import test, { afterEach, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import adminHandler from './admin/submissions.js';

const ORIGINAL_FETCH = global.fetch;
const ENV_KEYS = ['IWW_SUPABASE_URL', 'IWW_SUPABASE_SERVICE_ROLE_KEY', 'PUBLIC_APP_ORIGIN'];
const ORIGINAL_ENV = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));

function configure() {
  process.env.IWW_SUPABASE_URL = 'https://iww-test.supabase.co';
  process.env.IWW_SUPABASE_SERVICE_ROLE_KEY = 'server-secret-test-key';
  process.env.PUBLIC_APP_ORIGIN = 'https://iww.example';
}

function response() {
  return {
    headers: {},
    statusCode: 200,
    body: null,
    setHeader(name, value) { this.headers[name.toLowerCase()] = value; },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
    end() { return this; },
  };
}

function request(method, { body, query, token = '', origin } = {}) {
  return {
    method,
    body,
    query,
    headers: {
      'user-agent': 'admin-test',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(origin ? { origin } : {}),
    },
  };
}

function staffFetch({ roles = ['reviewer'], items = [], transition, transitionError } = {}) {
  const calls = [];
  const fetch = async (url, options) => {
    calls.push({ url, options });
    if (url.endsWith('/auth/v1/user')) {
      return { ok: true, status: 200, json: async () => ({ id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', email: 'reviewer@example.com' }) };
    }
    if (url.includes('/rest/v1/iww_user_roles?')) {
      return { ok: true, status: 200, json: async () => roles.map((role) => ({ role })) };
    }
    if (url.includes('/rest/v1/iww_inquiries?') || url.includes('/rest/v1/iww_membership_applications?')) {
      return { ok: true, status: 200, json: async () => items };
    }
    if (url.endsWith('/rest/v1/rpc/iww_transition_submission')) {
      if (transitionError) {
        return { ok: false, status: transitionError.status || 400, json: async () => ({ message: transitionError.message }) };
      }
      return { ok: true, status: 200, json: async () => transition || { status: 'triaged', unchanged: false } };
    }
    throw new Error(`Unexpected fetch ${url}`);
  };
  return { fetch, calls };
}

beforeEach(() => {
  configure();
  global.fetch = ORIGINAL_FETCH;
});

afterEach(() => {
  for (const key of ENV_KEYS) {
    const value = ORIGINAL_ENV[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  global.fetch = ORIGINAL_FETCH;
});

test('staff API rejects missing bearer token before any database request', async () => {
  let called = false;
  global.fetch = async () => { called = true; return { ok: false, json: async () => ({}) }; };
  const res = response();
  await adminHandler(request('GET'), res);
  assert.equal(res.statusCode, 401);
  assert.equal(res.body.error, 'authentication_required');
  assert.equal(called, false);
});

test('staff API rejects an authenticated user without reviewer/admin role', async () => {
  const mocked = staffFetch({ roles: [] });
  global.fetch = mocked.fetch;
  const res = response();
  await adminHandler(request('GET', { token: 'user-token' }), res);
  assert.equal(res.statusCode, 403);
  assert.equal(res.body.error, 'staff_role_required');
  assert.equal(mocked.calls.length, 2);
});

test('reviewer can list inquiry queue with bounded server query', async () => {
  const mocked = staffFetch({
    items: [{ id: '11111111-1111-4111-8111-111111111111', reference: 'IWW-INQ-ABC', status: 'received' }],
  });
  global.fetch = mocked.fetch;
  const res = response();
  await adminHandler(request('GET', {
    token: 'staff-token',
    query: { kind: 'inquiry', status: 'received', limit: '500' },
  }), res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.kind, 'inquiry');
  assert.equal(res.body.count, 1);
  const queueCall = mocked.calls[2];
  assert.match(queueCall.url, /iww_inquiries\?/);
  assert.match(queueCall.url, /status=eq.received/);
  assert.match(queueCall.url, /limit=50/);
});

test('reviewer can list membership applications using the correct table', async () => {
  const mocked = staffFetch({ items: [] });
  global.fetch = mocked.fetch;
  const res = response();
  await adminHandler(request('GET', {
    token: 'staff-token',
    query: { kind: 'membership_application' },
  }), res);
  assert.equal(res.statusCode, 200);
  assert.match(mocked.calls[2].url, /iww_membership_applications\?/);
});

test('status transition is performed by audited RPC with authenticated actor identity', async () => {
  const mocked = staffFetch({
    roles: ['admin'],
    transition: {
      status: 'triaged',
      reference: 'IWW-INQ-ABC',
      submissionId: '11111111-1111-4111-8111-111111111111',
      unchanged: false,
    },
  });
  global.fetch = mocked.fetch;
  const res = response();
  await adminHandler(request('PATCH', {
    token: 'staff-token',
    body: {
      kind: 'inquiry',
      submissionId: '11111111-1111-4111-8111-111111111111',
      toStatus: 'triaged',
      reason: 'Initial staff triage',
    },
  }), res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.status, 'updated');
  const rpcCall = mocked.calls[2];
  assert.match(rpcCall.url, /rpc\/iww_transition_submission$/);
  const rpcBody = JSON.parse(rpcCall.options.body);
  assert.equal(rpcBody.p_actor_user_id, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
  assert.equal(rpcBody.p_to_status, 'triaged');
  assert.equal(rpcBody.p_reason, 'Initial staff triage');
});

test('illegal database status transition is returned as conflict', async () => {
  const mocked = staffFetch({
    transitionError: { status: 400, message: 'invalid_status_transition' },
  });
  global.fetch = mocked.fetch;
  const res = response();
  await adminHandler(request('PATCH', {
    token: 'staff-token',
    body: {
      kind: 'inquiry',
      submissionId: '11111111-1111-4111-8111-111111111111',
      toStatus: 'approved',
      reason: 'Trying to skip review',
    },
  }), res);
  assert.equal(res.statusCode, 409);
  assert.equal(res.body.error, 'invalid_status_transition');
});

test('foreign browser origin is rejected before staff authentication', async () => {
  let called = false;
  global.fetch = async () => { called = true; return { ok: true, json: async () => ({}) }; };
  const res = response();
  await adminHandler(request('GET', {
    token: 'staff-token',
    origin: 'https://attacker.example',
  }), res);
  assert.equal(res.statusCode, 403);
  assert.equal(res.body.error, 'origin_not_allowed');
  assert.equal(called, false);
});

import test, { afterEach, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import historyHandler from './admin/history.js';

const ORIGINAL_FETCH = global.fetch;
const ENV_KEYS = ['IWW_SUPABASE_URL', 'IWW_SUPABASE_SERVICE_ROLE_KEY', 'PUBLIC_APP_ORIGIN'];
const ORIGINAL_ENV = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));
const USER_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const SUBMISSION_ID = '11111111-1111-4111-8111-111111111111';

function configure() {
  process.env.IWW_SUPABASE_URL = 'https://iww-test.supabase.co';
  process.env.IWW_SUPABASE_SERVICE_ROLE_KEY = 'server-secret-test-key';
  process.env.PUBLIC_APP_ORIGIN = 'https://iww.example';
}

function token(aal = 'aal2') {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ sub: USER_ID, aal, exp: 4102444800 })).toString('base64url');
  return `${header}.${payload}.test-signature`;
}

function req({ aal = 'aal2', kind = 'inquiry', submissionId = SUBMISSION_ID, origin } = {}) {
  return {
    method: 'GET',
    query: { kind, submissionId },
    headers: {
      authorization: `Bearer ${token(aal)}`,
      ...(origin ? { origin } : {}),
    },
  };
}

function res() {
  return {
    headers: {}, statusCode: 200, body: null,
    setHeader(name, value) { this.headers[name.toLowerCase()] = value; },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
    end() { return this; },
  };
}

function authorizedFetch({ roles = ['reviewer'] } = {}) {
  const calls = [];
  const fetch = async (url) => {
    calls.push(url);
    if (url.endsWith('/auth/v1/user')) {
      return { ok: true, status: 200, json: async () => ({ id: USER_ID, email: 'reviewer@example.com' }) };
    }
    if (url.includes('/iww_user_roles?')) {
      return { ok: true, status: 200, json: async () => roles.map((role) => ({ role })) };
    }
    if (url.includes('/iww_submission_status_events?')) {
      return { ok: true, status: 200, json: async () => [{ id: 1, from_status: 'received', to_status: 'triaged', changed_by: USER_ID, reason: 'Reviewed', created_at: '2026-08-09T12:00:00Z' }] };
    }
    if (url.includes('/iww_audit_events?')) {
      return { ok: true, status: 200, json: async () => [{ id: 2, actor_user_id: USER_ID, action: 'submission.status_changed', details: {}, created_at: '2026-08-09T12:00:00Z' }] };
    }
    if (url.includes('/iww_notification_deliveries?')) {
      return { ok: true, status: 200, json: async () => [{ id: 'd1', channel: 'webhook', provider: 'workflow-webhook', attempt: 1, status: 'sent', created_at: '2026-08-09T12:00:01Z' }] };
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

test('audit history rejects aal1 before staff role or evidence lookup', async () => {
  const mocked = authorizedFetch({ roles: ['admin'] });
  global.fetch = mocked.fetch;
  const response = res();
  await historyHandler(req({ aal: 'aal1' }), response);
  assert.equal(response.statusCode, 403);
  assert.equal(response.body.error, 'mfa_required');
  assert.equal(mocked.calls.length, 1);
});

test('audit history rejects aal2 authenticated user without staff role', async () => {
  const mocked = authorizedFetch({ roles: [] });
  global.fetch = mocked.fetch;
  const response = res();
  await historyHandler(req(), response);
  assert.equal(response.statusCode, 403);
  assert.equal(response.body.error, 'staff_role_required');
  assert.equal(mocked.calls.length, 2);
});

test('authorized aal2 reviewer receives bounded status audit and delivery evidence', async () => {
  const mocked = authorizedFetch();
  global.fetch = mocked.fetch;
  const response = res();
  await historyHandler(req(), response);
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.kind, 'inquiry');
  assert.equal(response.body.submissionId, SUBMISSION_ID);
  assert.equal(response.body.statusEvents.length, 1);
  assert.equal(response.body.auditEvents.length, 1);
  assert.equal(response.body.deliveries.length, 1);
  assert.equal(mocked.calls.length, 5);
  assert.equal(mocked.calls.slice(2).every((url) => /limit=200/.test(url)), true);
});

test('foreign browser origin is rejected before token validation', async () => {
  let called = false;
  global.fetch = async () => { called = true; return { ok: true, json: async () => ({}) }; };
  const response = res();
  await historyHandler(req({ origin: 'https://attacker.example' }), response);
  assert.equal(response.statusCode, 403);
  assert.equal(response.body.error, 'origin_not_allowed');
  assert.equal(called, false);
});

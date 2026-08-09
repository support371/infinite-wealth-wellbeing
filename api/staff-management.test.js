import test, { afterEach, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import staffHandler from './admin/staff.js';

const ORIGINAL_FETCH = global.fetch;
const ENV_KEYS = ['IWW_SUPABASE_URL', 'IWW_SUPABASE_SERVICE_ROLE_KEY', 'PUBLIC_APP_ORIGIN'];
const ORIGINAL_ENV = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));
const STAFF_USER_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const baseMigration = readFileSync(
  new URL('../supabase/migrations/20260809066000_iww_staff_role_management.sql', import.meta.url),
  'utf8',
);
const mfaMigration = readFileSync(
  new URL('../supabase/migrations/20260809072000_iww_staff_mfa_guard.sql', import.meta.url),
  'utf8',
);

function configure() {
  process.env.IWW_SUPABASE_URL = 'https://iww-test.supabase.co';
  process.env.IWW_SUPABASE_SERVICE_ROLE_KEY = 'server-secret-test-key';
  process.env.PUBLIC_APP_ORIGIN = 'https://iww.example';
}

function staffToken(aal = 'aal2', sub = STAFF_USER_ID) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ sub, aal, exp: 4102444800 })).toString('base64url');
  return `${header}.${payload}.test-signature`;
}

function request(method, { token = staffToken(), body, origin } = {}) {
  return {
    method,
    body,
    headers: {
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      'user-agent': 'staff-test',
      ...(origin ? { origin } : {}),
    },
  };
}

function response() {
  return {
    headers: {}, statusCode: 200, body: null,
    setHeader(name, value) { this.headers[name.toLowerCase()] = value; },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
    end() { return this; },
  };
}

function authFetch(roles, extra) {
  const calls = [];
  const fetch = async (url, options) => {
    calls.push({ url, options });
    if (url.endsWith('/auth/v1/user')) {
      return { ok: true, status: 200, json: async () => ({ id: STAFF_USER_ID, email: 'admin@example.com' }) };
    }
    if (url.includes('/iww_user_roles?') && calls.length === 2) {
      return { ok: true, status: 200, json: async () => roles.map((role) => ({ role })) };
    }
    return extra(url, options, calls);
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

test('aal1 admin session cannot use staff-role API', async () => {
  const mocked = authFetch(['admin'], async () => { throw new Error('unexpected'); });
  global.fetch = mocked.fetch;
  const res = response();
  await staffHandler(request('GET', { token: staffToken('aal1') }), res);
  assert.equal(res.statusCode, 403);
  assert.equal(res.body.error, 'mfa_required');
  assert.equal(mocked.calls.length, 1);
});

test('reviewer cannot use admin staff-role API', async () => {
  const mocked = authFetch(['reviewer'], async () => { throw new Error('unexpected'); });
  global.fetch = mocked.fetch;
  const res = response();
  await staffHandler(request('GET'), res);
  assert.equal(res.statusCode, 403);
  assert.equal(res.body.error, 'admin_role_required');
  assert.equal(mocked.calls.length, 2);
});

test('admin can list reviewer/admin role assignments', async () => {
  const mocked = authFetch(['admin'], async (url) => {
    if (url.includes('/iww_user_roles?')) {
      return {
        ok: true,
        status: 200,
        json: async () => [
          { user_id: '1', role: 'admin', revoked_at: null },
          { user_id: '2', role: 'reviewer', revoked_at: null },
          { user_id: '3', role: 'member', revoked_at: null },
        ],
      };
    }
    throw new Error(`Unexpected ${url}`);
  });
  global.fetch = mocked.fetch;
  const res = response();
  await staffHandler(request('GET'), res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.count, 2);
  assert.equal(res.body.items.some((item) => item.role === 'member'), false);
});

test('admin role change RPC receives authenticated actor identity', async () => {
  const mocked = authFetch(['admin'], async (url, options) => {
    if (url.endsWith('/rpc/iww_set_staff_role')) {
      const body = JSON.parse(options.body);
      assert.equal(body.p_actor_user_id, STAFF_USER_ID);
      assert.equal(body.p_target_user_id, 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
      assert.equal(body.p_role, 'reviewer');
      assert.equal(body.p_active, true);
      return { ok: true, status: 200, json: async () => ({ active: true, role: 'reviewer', changed: true, mfaVerifiedWhenGranted: true }) };
    }
    throw new Error(`Unexpected ${url}`);
  });
  global.fetch = mocked.fetch;
  const res = response();
  await staffHandler(request('PATCH', {
    body: {
      targetUserId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      role: 'reviewer',
      active: true,
    },
  }), res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.status, 'updated');
});

test('staff activation without verified MFA is returned as a conflict', async () => {
  const mocked = authFetch(['admin'], async (url) => {
    if (url.endsWith('/rpc/iww_set_staff_role')) {
      return { ok: false, status: 400, json: async () => ({ message: 'verified_mfa_required' }) };
    }
    throw new Error(`Unexpected ${url}`);
  });
  global.fetch = mocked.fetch;
  const res = response();
  await staffHandler(request('PATCH', {
    body: {
      targetUserId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      role: 'reviewer',
      active: true,
    },
  }), res);
  assert.equal(res.statusCode, 409);
  assert.equal(res.body.error, 'verified_mfa_required');
});

test('database last-admin protection is mapped to a conflict', async () => {
  const mocked = authFetch(['admin'], async (url) => {
    if (url.endsWith('/rpc/iww_set_staff_role')) {
      return { ok: false, status: 400, json: async () => ({ message: 'last_admin_required' }) };
    }
    throw new Error(`Unexpected ${url}`);
  });
  global.fetch = mocked.fetch;
  const res = response();
  await staffHandler(request('PATCH', {
    body: {
      targetUserId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      role: 'admin',
      active: false,
    },
  }), res);
  assert.equal(res.statusCode, 409);
  assert.equal(res.body.error, 'last_admin_required');
});

test('bootstrap admin can execute only before an active admin exists', () => {
  assert.match(baseMigration, /create or replace function public\.iww_bootstrap_admin/i);
  assert.match(mfaMigration, /raise exception 'admin_already_bootstrapped';/i);
  assert.match(mfaMigration, /select 1 from auth\.users where id = p_user_id/i);
});

test('final role-management implementation requires verified MFA for bootstrap and activation', () => {
  assert.match(mfaMigration, /from auth\.mfa_factors/i);
  assert.match(mfaMigration, /status = 'verified'/i);
  const occurrences = mfaMigration.match(/raise exception 'verified_mfa_required';/g) || [];
  assert.equal(occurrences.length, 2);
});

test('final MFA role migration preserves no-op audit semantics and last-admin protection', () => {
  assert.match(mfaMigration, /staff\.role_unchanged/);
  assert.match(mfaMigration, /'changed', v_changed/);
  assert.match(mfaMigration, /raise exception 'last_admin_required';/i);
  assert.match(mfaMigration, /mfaVerifiedWhenGranted/);
});

test('bootstrap and role management RPCs remain service-role only after MFA guard', () => {
  assert.match(mfaMigration, /revoke all on function public\.iww_bootstrap_admin[\s\S]*from public, anon, authenticated;/i);
  assert.match(mfaMigration, /revoke all on function public\.iww_set_staff_role[\s\S]*from public, anon, authenticated;/i);
  assert.match(mfaMigration, /grant execute on function public\.iww_bootstrap_admin[\s\S]*to service_role;/i);
  assert.match(mfaMigration, /grant execute on function public\.iww_set_staff_role[\s\S]*to service_role;/i);
});

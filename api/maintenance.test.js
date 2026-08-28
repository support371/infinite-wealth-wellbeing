import test, { afterEach, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import maintenanceHandler from './internal/maintenance.js';

const ORIGINAL_FETCH = global.fetch;
const ENV_KEYS = ['IWW_SUPABASE_URL', 'IWW_SUPABASE_SERVICE_ROLE_KEY', 'IWW_NOTIFICATION_WORKER_SECRET'];
const ORIGINAL_ENV = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));

function configure() {
  process.env.IWW_SUPABASE_URL = 'https://iww-test.supabase.co';
  process.env.IWW_SUPABASE_SERVICE_ROLE_KEY = 'server-secret-test-key';
  process.env.IWW_NOTIFICATION_WORKER_SECRET = 'worker-secret';
}

function request(token = 'worker-secret', method = 'POST') {
  return { method, headers: token ? { authorization: `Bearer ${token}` } : {} };
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

test('maintenance rejects missing secret before database access', async () => {
  let called = false;
  global.fetch = async () => { called = true; return { ok: true, json: async () => 0 }; };
  const res = response();
  await maintenanceHandler(request(''), res);
  assert.equal(res.statusCode, 401);
  assert.equal(called, false);
});

test('maintenance rejects unsupported methods', async () => {
  const res = response();
  await maintenanceHandler(request('worker-secret', 'GET'), res);
  assert.equal(res.statusCode, 405);
  assert.equal(res.headers.allow, 'POST');
});

test('maintenance invokes only bounded expired-idempotency purge', async () => {
  let call;
  global.fetch = async (url, options) => {
    call = { url, options };
    return { ok: true, status: 200, json: async () => 37 };
  };

  const res = response();
  await maintenanceHandler(request(), res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.expiredIdempotencyRecordsDeleted, 37);
  assert.equal(res.body.substantiveRecordsDeleted, 0);
  assert.match(call.url, /rpc\/iww_purge_expired_idempotency$/);
  assert.deepEqual(JSON.parse(call.options.body), { p_limit: 5000 });
});

test('maintenance fails closed if persistence is unavailable', async () => {
  global.fetch = async () => ({ ok: false, status: 503, json: async () => ({ message: 'unavailable' }) });
  const res = response();
  await maintenanceHandler(request(), res);
  assert.equal(res.statusCode, 503);
  assert.equal(res.body.error, 'maintenance_failed');
});

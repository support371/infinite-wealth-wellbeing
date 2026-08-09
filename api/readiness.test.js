import test, { afterEach, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import readinessHandler from './internal/readiness.js';

const ORIGINAL_FETCH = global.fetch;
const ENV_KEYS = [
  'PUBLIC_APP_ORIGIN',
  'INQUIRY_WEBHOOK_URL',
  'MEMBERSHIP_WEBHOOK_URL',
  'WORKFLOW_WEBHOOK_SECRET',
  'IWW_SUPABASE_URL',
  'IWW_SUPABASE_SERVICE_ROLE_KEY',
  'IWW_NOTIFICATION_WORKER_SECRET',
  'IWW_EMAIL_DELIVERY_URL',
  'IWW_EMAIL_DELIVERY_SECRET',
  'IWW_EMAIL_WORKER_SECRET',
];
const ORIGINAL_ENV = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));

function configure() {
  process.env.PUBLIC_APP_ORIGIN = 'https://iww.example';
  process.env.INQUIRY_WEBHOOK_URL = 'https://workflow.test/inquiry';
  process.env.MEMBERSHIP_WEBHOOK_URL = 'https://workflow.test/membership';
  process.env.WORKFLOW_WEBHOOK_SECRET = 'workflow-secret';
  process.env.IWW_SUPABASE_URL = 'https://iww-test.supabase.co';
  process.env.IWW_SUPABASE_SERVICE_ROLE_KEY = 'server-secret-test-key';
  process.env.IWW_NOTIFICATION_WORKER_SECRET = 'worker-secret';
  process.env.IWW_EMAIL_DELIVERY_URL = 'https://email-adapter.test/deliver';
  process.env.IWW_EMAIL_DELIVERY_SECRET = 'email-delivery-secret';
  process.env.IWW_EMAIL_WORKER_SECRET = 'email-worker-secret';
}

function request(token = 'worker-secret', method = 'GET') {
  return { method, headers: token ? { authorization: `Bearer ${token}` } : {} };
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

test('deep readiness rejects missing internal bearer secret before database access', async () => {
  let called = false;
  global.fetch = async () => { called = true; return { ok: true, json: async () => [] }; };
  const res = response();
  await readinessHandler(request(''), res);
  assert.equal(res.statusCode, 401);
  assert.equal(res.body.error, 'internal_authentication_required');
  assert.equal(called, false);
});

test('deep readiness rejects unsupported methods', async () => {
  const res = response();
  await readinessHandler(request('worker-secret', 'POST'), res);
  assert.equal(res.statusCode, 405);
  assert.equal(res.headers.allow, 'GET');
});

test('deep readiness returns ready only when configuration and required schema tables respond', async () => {
  const calls = [];
  global.fetch = async (url, options) => {
    calls.push({ url, options });
    return { ok: true, status: 200, json: async () => [] };
  };

  const res = response();
  await readinessHandler(request(), res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.status, 'ready');
  assert.equal(res.body.checks.configuration.persistenceConfigured, true);
  assert.equal(res.body.checks.configuration.emailDeliveryConfigured, true);
  assert.equal(res.body.checks.configuration.emailWorkerSecretConfigured, true);
  assert.equal(res.body.checks.database.notificationOutbox.ok, true);
  assert.equal(res.body.checks.database.emailOutbox.ok, true);
  assert.equal(calls.length, 6);
  assert.equal(calls.every((call) => call.options.headers.apikey === 'server-secret-test-key'), true);
});

test('deep readiness degrades when transactional email adapter configuration is missing', async () => {
  delete process.env.IWW_EMAIL_DELIVERY_URL;
  delete process.env.IWW_EMAIL_DELIVERY_SECRET;
  global.fetch = async () => ({ ok: true, status: 200, json: async () => [] });
  const res = response();
  await readinessHandler(request(), res);
  assert.equal(res.statusCode, 503);
  assert.equal(res.body.checks.configuration.emailDeliveryConfigured, false);
});

test('deep readiness degrades when one required schema table is missing', async () => {
  global.fetch = async (url) => {
    if (url.includes('/iww_email_outbox?')) {
      return { ok: false, status: 404, json: async () => ({ message: 'relation missing' }) };
    }
    return { ok: true, status: 200, json: async () => [] };
  };

  const res = response();
  await readinessHandler(request(), res);
  assert.equal(res.statusCode, 503);
  assert.equal(res.body.status, 'degraded');
  assert.equal(res.body.checks.database.emailOutbox.ok, false);
});

test('deep readiness degrades without persistence configuration and makes no database calls', async () => {
  delete process.env.IWW_SUPABASE_URL;
  delete process.env.IWW_SUPABASE_SERVICE_ROLE_KEY;
  let called = false;
  global.fetch = async () => { called = true; return { ok: true, json: async () => [] }; };

  const res = response();
  await readinessHandler(request(), res);
  assert.equal(res.statusCode, 503);
  assert.equal(res.body.checks.configuration.persistenceConfigured, false);
  assert.equal(res.body.checks.database.inquiries.error, 'persistence_not_configured');
  assert.equal(res.body.checks.database.emailOutbox.error, 'persistence_not_configured');
  assert.equal(called, false);
});

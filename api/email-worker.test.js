import test, { afterEach, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import emailWorker from './internal/email-worker.js';

const ORIGINAL_FETCH = global.fetch;
const ENV_KEYS = [
  'IWW_SUPABASE_URL',
  'IWW_SUPABASE_SERVICE_ROLE_KEY',
  'IWW_EMAIL_WORKER_SECRET',
  'IWW_EMAIL_DELIVERY_URL',
  'IWW_EMAIL_DELIVERY_SECRET',
];
const ORIGINAL_ENV = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));

function configure() {
  process.env.IWW_SUPABASE_URL = 'https://iww-test.supabase.co';
  process.env.IWW_SUPABASE_SERVICE_ROLE_KEY = 'server-secret-test-key';
  process.env.IWW_EMAIL_WORKER_SECRET = 'email-worker-secret';
  process.env.IWW_EMAIL_DELIVERY_URL = 'https://email-adapter.test/deliver';
  process.env.IWW_EMAIL_DELIVERY_SECRET = 'email-delivery-secret';
}

function req(secret = 'email-worker-secret', method = 'POST') {
  return { method, headers: secret ? { authorization: `Bearer ${secret}` } : {} };
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

const item = {
  outbox_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  submission_kind: 'inquiry',
  submission_id: '11111111-1111-4111-8111-111111111111',
  template_key: 'inquiry_received_v1',
  recipient_email: 'ada@example.com',
  attempt_count: 3,
};

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

test('email worker rejects missing secret before persistence access', async () => {
  let called = false;
  global.fetch = async () => { called = true; return { ok: true, json: async () => [] }; };
  const response = res();
  await emailWorker(req(''), response);
  assert.equal(response.statusCode, 401);
  assert.equal(response.body.error, 'email_worker_authentication_required');
  assert.equal(called, false);
});

test('email worker rejects unsupported methods', async () => {
  const response = res();
  await emailWorker(req('email-worker-secret', 'GET'), response);
  assert.equal(response.statusCode, 405);
  assert.equal(response.headers.allow, 'POST');
});

test('email worker exits cleanly when no email jobs are due', async () => {
  global.fetch = async (url) => {
    assert.match(url, /rpc\/iww_claim_email_batch$/);
    return { ok: true, status: 200, json: async () => [] };
  };
  const response = res();
  await emailWorker(req(), response);
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.claimed, 0);
  assert.equal(response.body.sent, 0);
});

test('email worker finalizes without resending when durable email success already exists', async () => {
  const calls = [];
  global.fetch = async (url, options) => {
    calls.push({ url, options });
    if (url.endsWith('/rpc/iww_claim_email_batch')) return { ok: true, status: 200, json: async () => [item] };
    if (url.includes('/iww_notification_deliveries?')) return { ok: true, status: 200, json: async () => [{ id: 'email-delivery-1' }] };
    if (url.endsWith('/rpc/iww_finish_email_attempt')) return { ok: true, status: 200, json: async () => ({ status: 'delivered' }) };
    throw new Error(`Unexpected fetch ${url}`);
  };
  const response = res();
  await emailWorker(req(), response);
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.alreadySent, 1);
  assert.equal(calls.some((call) => call.url === 'https://email-adapter.test/deliver'), false);
});

test('email worker sends template-only request, records provider evidence, and finalizes delivery', async () => {
  const calls = [];
  global.fetch = async (url, options) => {
    calls.push({ url, options });
    if (url.endsWith('/rpc/iww_claim_email_batch')) return { ok: true, status: 200, json: async () => [item] };
    if (url.includes('/iww_notification_deliveries?')) return { ok: true, status: 200, json: async () => [] };
    if (url.includes('/iww_inquiries?')) return { ok: true, status: 200, json: async () => [{ id: item.submission_id, reference: 'IWW-INQ-ABC123' }] };
    if (url === 'https://email-adapter.test/deliver') return { ok: true, status: 202, json: async () => ({ messageId: 'provider-123' }) };
    if (url.endsWith('/iww_notification_deliveries')) return { ok: true, status: 201, json: async () => ({}) };
    if (url.endsWith('/rpc/iww_finish_email_attempt')) return { ok: true, status: 200, json: async () => ({ status: 'delivered', deliveryEvidence: true }) };
    throw new Error(`Unexpected fetch ${url}`);
  };

  const response = res();
  await emailWorker(req(), response);
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.sent, 1);

  const adapterCall = calls.find((call) => call.url === 'https://email-adapter.test/deliver');
  assert.equal(adapterCall.options.headers['X-IWW-Email-Delivery-Secret'], 'email-delivery-secret');
  assert.equal(adapterCall.options.headers['Idempotency-Key'], `iww-email-${item.outbox_id}`);
  const adapterPayload = JSON.parse(adapterCall.options.body);
  assert.deepEqual(Object.keys(adapterPayload).sort(), ['recipientEmail', 'reference', 'submissionId', 'submissionKind', 'templateKey', 'type'].sort());
  assert.equal(adapterPayload.templateKey, 'inquiry_received_v1');
  assert.equal(adapterPayload.reference, 'IWW-INQ-ABC123');
  assert.equal(JSON.stringify(adapterPayload).includes('Please send more information'), false);

  const ledgerCall = calls.find((call) => call.url.endsWith('/iww_notification_deliveries'));
  const ledger = JSON.parse(ledgerCall.options.body);
  assert.equal(ledger.channel, 'email');
  assert.equal(ledger.attempt, 3);
  assert.equal(ledger.provider_message_id, 'provider-123');
  assert.equal(ledger.status, 'sent');
});

test('adapter failure records failed evidence and requeues email', async () => {
  const calls = [];
  global.fetch = async (url, options) => {
    calls.push({ url, options });
    if (url.endsWith('/rpc/iww_claim_email_batch')) return { ok: true, status: 200, json: async () => [item] };
    if (url.includes('/iww_notification_deliveries?')) return { ok: true, status: 200, json: async () => [] };
    if (url.includes('/iww_inquiries?')) return { ok: true, status: 200, json: async () => [{ id: item.submission_id, reference: 'IWW-INQ-ABC123' }] };
    if (url === 'https://email-adapter.test/deliver') return { ok: false, status: 503, json: async () => ({}) };
    if (url.endsWith('/iww_notification_deliveries')) return { ok: true, status: 201, json: async () => ({}) };
    if (url.endsWith('/rpc/iww_finish_email_attempt')) return { ok: true, status: 200, json: async () => ({ status: 'queued' }) };
    throw new Error(`Unexpected fetch ${url}`);
  };
  const response = res();
  await emailWorker(req(), response);
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.retry, 1);
  const ledgerCall = calls.find((call) => call.url.endsWith('/iww_notification_deliveries'));
  const ledger = JSON.parse(ledgerCall.options.body);
  assert.equal(ledger.status, 'failed');
  assert.equal(ledger.error_code, 'email_delivery_failed');
});

test('adapter success without durable ledger write cannot be finalized as delivered', async () => {
  const calls = [];
  global.fetch = async (url, options) => {
    calls.push({ url, options });
    if (url.endsWith('/rpc/iww_claim_email_batch')) return { ok: true, status: 200, json: async () => [item] };
    if (url.includes('/iww_notification_deliveries?')) return { ok: true, status: 200, json: async () => [] };
    if (url.includes('/iww_inquiries?')) return { ok: true, status: 200, json: async () => [{ id: item.submission_id, reference: 'IWW-INQ-ABC123' }] };
    if (url === 'https://email-adapter.test/deliver') return { ok: true, status: 202, json: async () => ({ messageId: 'provider-123' }) };
    if (url.endsWith('/iww_notification_deliveries')) return { ok: false, status: 500, json: async () => ({ message: 'write failed' }) };
    if (url.endsWith('/rpc/iww_finish_email_attempt')) {
      const body = JSON.parse(options.body);
      assert.equal(body.p_delivered, false);
      assert.equal(body.p_error, 'email_delivery_record_failed');
      return { ok: true, status: 200, json: async () => ({ status: 'queued' }) };
    }
    throw new Error(`Unexpected fetch ${url}`);
  };
  const response = res();
  await emailWorker(req(), response);
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.retry, 1);
});

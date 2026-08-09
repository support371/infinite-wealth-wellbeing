import test, { afterEach, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  hashSubmission,
  persistInquiry,
  persistMembershipApplication,
  readIdempotencyKey,
  recordNotificationDelivery,
} from './_lib/persistence.js';

const ORIGINAL_FETCH = global.fetch;
const ENV_KEYS = ['IWW_SUPABASE_URL', 'IWW_SUPABASE_SERVICE_ROLE_KEY'];
const ORIGINAL_ENV = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));

beforeEach(() => {
  for (const key of ENV_KEYS) delete process.env[key];
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

function configurePersistence() {
  process.env.IWW_SUPABASE_URL = 'https://iww-test.supabase.co';
  process.env.IWW_SUPABASE_SERVICE_ROLE_KEY = 'server-secret-test-key';
}

const metadata = {
  requestId: 'request-1',
  userAgent: 'test-agent',
  submittedAt: '2026-08-09T06:00:00.000Z',
};

test('submission hashes are deterministic and payload-sensitive', () => {
  const first = hashSubmission({ a: 1, b: 'two' });
  const second = hashSubmission({ a: 1, b: 'two' });
  const changed = hashSubmission({ a: 1, b: 'different' });
  assert.equal(first, second);
  assert.notEqual(first, changed);
  assert.match(first, /^[a-f0-9]{64}$/);
});

test('idempotency keys are required to be bounded strings', () => {
  assert.equal(readIdempotencyKey({ headers: {} }), '');
  assert.equal(readIdempotencyKey({ headers: { 'idempotency-key': 'short' } }), '');
  assert.equal(readIdempotencyKey({ headers: { 'idempotency-key': ' inquiry-123456 ' } }), 'inquiry-123456');
});

test('persistence fails closed when dedicated database configuration is missing', async () => {
  const result = await persistInquiry({
    idempotencyKey: 'inquiry-123456',
    person: { firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com' },
    subject: 'General Inquiry',
    message: 'Please send more information.',
    metadata,
  });
  assert.equal(result.ok, false);
  assert.equal(result.status, 503);
  assert.equal(result.error, 'persistence_not_configured');
});

test('persistence refuses a non-HTTPS remote Supabase URL', async () => {
  process.env.IWW_SUPABASE_URL = 'http://remote.example';
  process.env.IWW_SUPABASE_SERVICE_ROLE_KEY = 'server-secret-test-key';
  const result = await persistInquiry({
    idempotencyKey: 'inquiry-123456',
    person: { firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com' },
    subject: 'General Inquiry',
    message: 'Please send more information.',
    metadata,
  });
  assert.equal(result.error, 'persistence_not_configured');
});

test('inquiry persistence calls only the service-role RPC with canonical values', async () => {
  configurePersistence();
  let call;
  global.fetch = async (url, options) => {
    call = { url, options };
    return {
      ok: true,
      json: async () => ({ reference: 'IWW-INQ-ABC123', submissionId: '11111111-1111-1111-1111-111111111111' }),
    };
  };

  const result = await persistInquiry({
    idempotencyKey: 'inquiry-123456',
    person: { firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com' },
    subject: 'General Inquiry',
    message: 'Please send more information.',
    metadata,
  });

  assert.equal(result.ok, true);
  assert.equal(call.url, 'https://iww-test.supabase.co/rest/v1/rpc/iww_accept_inquiry');
  assert.equal(call.options.headers.apikey, 'server-secret-test-key');
  assert.equal(call.options.headers.Authorization, 'Bearer server-secret-test-key');
  const body = JSON.parse(call.options.body);
  assert.equal(body.p_idempotency_key, 'inquiry-123456');
  assert.equal(body.p_email, 'ada@example.com');
  assert.match(body.p_request_hash, /^[a-f0-9]{64}$/);
});

test('membership persistence maps an idempotency conflict to HTTP 409 semantics', async () => {
  configurePersistence();
  global.fetch = async () => ({
    ok: false,
    json: async () => ({ message: 'idempotency_key_reused' }),
  });

  const result = await persistMembershipApplication({
    idempotencyKey: 'membership-123456',
    person: { firstName: 'Grace', lastName: 'Hopper', email: 'grace@example.com' },
    requestedTier: 'Explorer',
    primaryInterest: 'Wealth & Financial Education',
    introduction: 'I want a structured place to participate.',
    metadata,
  });

  assert.equal(result.ok, false);
  assert.equal(result.status, 409);
  assert.equal(result.error, 'idempotency_conflict');
});

test('notification delivery records outcome without exposing credentials in the payload', async () => {
  configurePersistence();
  let call;
  global.fetch = async (url, options) => {
    call = { url, options };
    return { ok: true, json: async () => ({}) };
  };

  const result = await recordNotificationDelivery({
    submissionKind: 'inquiry',
    submissionId: '11111111-1111-1111-1111-111111111111',
    delivered: { ok: false, error: 'workflow_unavailable' },
  });

  assert.equal(result.ok, true);
  assert.equal(call.url, 'https://iww-test.supabase.co/rest/v1/iww_notification_deliveries');
  const body = JSON.parse(call.options.body);
  assert.equal(body.status, 'failed');
  assert.equal(body.error_code, 'workflow_unavailable');
  assert.equal(JSON.stringify(body).includes('server-secret-test-key'), false);
});

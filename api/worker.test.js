import test, { afterEach, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import workerHandler from './internal/notification-worker.js';

const ORIGINAL_FETCH = global.fetch;
const ENV_KEYS = [
  'IWW_SUPABASE_URL',
  'IWW_SUPABASE_SERVICE_ROLE_KEY',
  'IWW_NOTIFICATION_WORKER_SECRET',
  'INQUIRY_WEBHOOK_URL',
  'MEMBERSHIP_WEBHOOK_URL',
  'WORKFLOW_WEBHOOK_SECRET',
];
const ORIGINAL_ENV = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));

function configure() {
  process.env.IWW_SUPABASE_URL = 'https://iww-test.supabase.co';
  process.env.IWW_SUPABASE_SERVICE_ROLE_KEY = 'server-secret-test-key';
  process.env.IWW_NOTIFICATION_WORKER_SECRET = 'worker-secret';
  process.env.INQUIRY_WEBHOOK_URL = 'https://workflow.test/inquiry';
  process.env.MEMBERSHIP_WEBHOOK_URL = 'https://workflow.test/membership';
  process.env.WORKFLOW_WEBHOOK_SECRET = 'workflow-secret';
}

function request(token = 'worker-secret', method = 'POST') {
  return {
    method,
    headers: token ? { authorization: `Bearer ${token}` } : {},
  };
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

test('worker rejects missing or incorrect secret before touching persistence', async () => {
  let called = false;
  global.fetch = async () => { called = true; return { ok: true, json: async () => [] }; };

  const missing = response();
  await workerHandler(request('', 'POST'), missing);
  assert.equal(missing.statusCode, 401);
  assert.equal(missing.body.error, 'worker_authentication_required');

  const wrong = response();
  await workerHandler(request('wrong-secret', 'POST'), wrong);
  assert.equal(wrong.statusCode, 401);
  assert.equal(called, false);
});

test('worker rejects unsupported methods', async () => {
  const res = response();
  await workerHandler(request('worker-secret', 'GET'), res);
  assert.equal(res.statusCode, 405);
  assert.equal(res.headers.allow, 'POST');
});

test('worker returns cleanly when no outbox items are available', async () => {
  const calls = [];
  global.fetch = async (url, options) => {
    calls.push({ url, options });
    if (url.endsWith('/rpc/iww_claim_notification_batch')) {
      return { ok: true, status: 200, json: async () => [] };
    }
    throw new Error(`Unexpected fetch ${url}`);
  };

  const res = response();
  await workerHandler(request(), res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.claimed, 0);
  assert.equal(res.body.sent, 0);
  assert.equal(calls.length, 1);
});

test('worker marks an outbox item complete without resending when webhook history already succeeded', async () => {
  const calls = [];
  global.fetch = async (url, options) => {
    calls.push({ url, options });
    if (url.endsWith('/rpc/iww_claim_notification_batch')) {
      return {
        ok: true,
        status: 200,
        json: async () => [{
          outbox_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
          submission_kind: 'inquiry',
          submission_id: '11111111-1111-4111-8111-111111111111',
          event_type: 'staff.inquiry.received',
          attempt_count: 2,
        }],
      };
    }
    if (url.includes('/iww_notification_deliveries?')) {
      return { ok: true, status: 200, json: async () => [{ id: 'delivery-1' }] };
    }
    if (url.endsWith('/rpc/iww_finish_notification_attempt')) {
      const body = JSON.parse(options.body);
      assert.equal(body.p_delivered, true);
      return { ok: true, status: 200, json: async () => ({ status: 'delivered' }) };
    }
    throw new Error(`Unexpected fetch ${url}`);
  };

  const res = response();
  await workerHandler(request(), res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.alreadySent, 1);
  assert.equal(res.body.sent, 0);
  assert.equal(calls.some((call) => call.url === 'https://workflow.test/inquiry'), false);
});

test('worker retries an inquiry from durable data and records successful delivery', async () => {
  const calls = [];
  global.fetch = async (url, options) => {
    calls.push({ url, options });
    if (url.endsWith('/rpc/iww_claim_notification_batch')) {
      return {
        ok: true,
        status: 200,
        json: async () => [{
          outbox_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
          submission_kind: 'inquiry',
          submission_id: '11111111-1111-4111-8111-111111111111',
          event_type: 'staff.inquiry.received',
          attempt_count: 1,
        }],
      };
    }
    if (url.includes('/iww_notification_deliveries?')) {
      return { ok: true, status: 200, json: async () => [] };
    }
    if (url.includes('/iww_inquiries?')) {
      return {
        ok: true,
        status: 200,
        json: async () => [{
          id: '11111111-1111-4111-8111-111111111111',
          reference: 'IWW-INQ-ABC',
          first_name: 'Ada',
          last_name: 'Lovelace',
          email: 'ada@example.com',
          subject: 'General Inquiry',
          message: 'Please send information.',
          request_id: 'request-1',
          metadata: { userAgent: 'test-agent', submittedAt: '2026-08-09T06:00:00Z' },
          created_at: '2026-08-09T06:00:00Z',
        }],
      };
    }
    if (url === 'https://workflow.test/inquiry') {
      const body = JSON.parse(options.body);
      assert.equal(options.headers['X-IWW-Webhook-Secret'], 'workflow-secret');
      assert.equal(body.reference, 'IWW-INQ-ABC');
      assert.equal(body.metadata.replayedByOutbox, true);
      return { ok: true, status: 202, json: async () => ({}) };
    }
    if (url.endsWith('/iww_notification_deliveries')) {
      const body = JSON.parse(options.body);
      assert.equal(body.status, 'sent');
      return { ok: true, status: 201, json: async () => ({}) };
    }
    if (url.endsWith('/rpc/iww_finish_notification_attempt')) {
      const body = JSON.parse(options.body);
      assert.equal(body.p_delivered, true);
      return { ok: true, status: 200, json: async () => ({ status: 'delivered' }) };
    }
    throw new Error(`Unexpected fetch ${url}`);
  };

  const res = response();
  await workerHandler(request(), res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.claimed, 1);
  assert.equal(res.body.sent, 1);
  assert.equal(res.body.retry, 0);
});

test('worker records failure and requeues when staff workflow delivery fails', async () => {
  const calls = [];
  global.fetch = async (url, options) => {
    calls.push({ url, options });
    if (url.endsWith('/rpc/iww_claim_notification_batch')) {
      return {
        ok: true,
        status: 200,
        json: async () => [{
          outbox_id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
          submission_kind: 'membership_application',
          submission_id: '22222222-2222-4222-8222-222222222222',
          event_type: 'staff.membership_application.received',
          attempt_count: 3,
        }],
      };
    }
    if (url.includes('/iww_notification_deliveries?')) {
      return { ok: true, status: 200, json: async () => [] };
    }
    if (url.includes('/iww_membership_applications?')) {
      return {
        ok: true,
        status: 200,
        json: async () => [{
          id: '22222222-2222-4222-8222-222222222222',
          reference: 'IWW-MEM-XYZ',
          first_name: 'Grace',
          last_name: 'Hopper',
          email: 'grace@example.com',
          requested_tier: 'Explorer',
          primary_interest: 'Wealth & Financial Education',
          introduction: 'I want to participate.',
          request_id: 'request-2',
          metadata: {},
          created_at: '2026-08-09T06:00:00Z',
        }],
      };
    }
    if (url === 'https://workflow.test/membership') {
      return { ok: false, status: 500, json: async () => ({}) };
    }
    if (url.endsWith('/iww_notification_deliveries')) {
      const body = JSON.parse(options.body);
      assert.equal(body.status, 'failed');
      return { ok: true, status: 201, json: async () => ({}) };
    }
    if (url.endsWith('/rpc/iww_finish_notification_attempt')) {
      const body = JSON.parse(options.body);
      assert.equal(body.p_delivered, false);
      assert.equal(body.p_error, 'workflow_delivery_failed');
      return { ok: true, status: 200, json: async () => ({ status: 'queued' }) };
    }
    throw new Error(`Unexpected fetch ${url}`);
  };

  const res = response();
  await workerHandler(request(), res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.sent, 0);
  assert.equal(res.body.retry, 1);
  assert.equal(res.body.results[0].error, 'workflow_delivery_failed');
});

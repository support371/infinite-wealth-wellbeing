import test, { afterEach, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import healthHandler from './health.js';
import inquiryHandler from './inquiries.js';
import membershipHandler from './membership-applications.js';

const ENV_KEYS = [
  'PUBLIC_APP_ORIGIN',
  'INQUIRY_WEBHOOK_URL',
  'MEMBERSHIP_WEBHOOK_URL',
  'WORKFLOW_WEBHOOK_SECRET',
  'IWW_SUPABASE_URL',
  'IWW_SUPABASE_SERVICE_ROLE_KEY',
  'VERCEL_ENV',
];
const ORIGINAL_ENV = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));
const ORIGINAL_FETCH = global.fetch;

function createResponse() {
  return {
    headers: {},
    statusCode: 200,
    body: null,
    ended: false,
    setHeader(name, value) { this.headers[name.toLowerCase()] = value; },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
    end() { this.ended = true; return this; },
  };
}

function request(method, body = undefined, headers = {}) {
  return {
    method,
    body,
    headers: { 'user-agent': 'test-agent', ...headers },
  };
}

function configurePersistence() {
  process.env.IWW_SUPABASE_URL = 'https://iww-test.supabase.co';
  process.env.IWW_SUPABASE_SERVICE_ROLE_KEY = 'server-secret-test-key';
}

function persistenceResponse(reference, submissionId) {
  return {
    ok: true,
    json: async () => ({ reference, submissionId, status: 'accepted' }),
  };
}

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

test('health remains degraded when persistence is missing', () => {
  process.env.PUBLIC_APP_ORIGIN = 'https://iww.example';
  process.env.INQUIRY_WEBHOOK_URL = 'https://workflow.test/inquiry';
  process.env.MEMBERSHIP_WEBHOOK_URL = 'https://workflow.test/membership';
  process.env.WORKFLOW_WEBHOOK_SECRET = 'test-secret';
  const res = createResponse();
  healthHandler(request('GET'), res);
  assert.equal(res.statusCode, 503);
  assert.equal(res.body.status, 'degraded');
  assert.equal(res.body.checks.persistenceUrlConfigured, false);
  assert.equal(res.body.checks.persistenceServiceRoleConfigured, false);
  assert.equal(res.headers['cache-control'], 'no-store');
});

test('health remains degraded when public origin is missing', () => {
  process.env.INQUIRY_WEBHOOK_URL = 'https://workflow.test/inquiry';
  process.env.MEMBERSHIP_WEBHOOK_URL = 'https://workflow.test/membership';
  process.env.WORKFLOW_WEBHOOK_SECRET = 'test-secret';
  configurePersistence();
  const res = createResponse();
  healthHandler(request('GET'), res);
  assert.equal(res.statusCode, 503);
  assert.equal(res.body.checks.publicOriginConfigured, false);
});

test('health is ready only when workflows, origin, signing, and persistence exist', () => {
  process.env.PUBLIC_APP_ORIGIN = 'https://iww.example';
  process.env.INQUIRY_WEBHOOK_URL = 'https://workflow.test/inquiry';
  process.env.MEMBERSHIP_WEBHOOK_URL = 'https://workflow.test/membership';
  process.env.WORKFLOW_WEBHOOK_SECRET = 'test-secret';
  configurePersistence();
  const res = createResponse();
  healthHandler(request('GET'), res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.status, 'ready');
  assert.equal(res.body.checks.publicOriginConfigured, true);
  assert.equal(res.body.checks.persistenceUrlConfigured, true);
  assert.equal(res.body.checks.persistenceServiceRoleConfigured, true);
});

test('inquiry rejects invalid public values before persistence', async () => {
  let called = false;
  global.fetch = async () => { called = true; return { ok: true, json: async () => ({}) }; };
  const res = createResponse();
  await inquiryHandler(request('POST', {
    firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com',
    subject: 'Unsupported Subject', message: 'This message is long enough.', consent: true,
  }), res);
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.error, 'validation_failed');
  assert.equal(res.body.fields.subject, 'invalid');
  assert.equal(called, false);
});

test('inquiry honeypot returns accepted without invoking persistence or workflow', async () => {
  let called = false;
  global.fetch = async () => { called = true; return { ok: true, json: async () => ({}) }; };
  const res = createResponse();
  await inquiryHandler(request('POST', { companyWebsite: 'https://bot.example' }), res);
  assert.equal(res.statusCode, 202);
  assert.equal(res.body.status, 'accepted');
  assert.equal(called, false);
});

test('valid inquiry requires an idempotency key before persistence', async () => {
  let called = false;
  global.fetch = async () => { called = true; return { ok: true, json: async () => ({}) }; };
  const res = createResponse();
  await inquiryHandler(request('POST', {
    firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com',
    subject: 'General Inquiry', message: 'Please send more information about the organization.', consent: true,
  }), res);
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.error, 'idempotency_key_required');
  assert.equal(called, false);
});

test('durably stored inquiry remains accepted when staff webhook is unavailable', async () => {
  configurePersistence();
  process.env.INQUIRY_WEBHOOK_URL = 'https://workflow.test/inquiry';
  const calls = [];
  global.fetch = async (url, options) => {
    calls.push({ url, options });
    if (url.includes('/rpc/iww_accept_inquiry')) {
      return persistenceResponse('IWW-INQ-ABC123', '11111111-1111-1111-1111-111111111111');
    }
    if (url.includes('/iww_notification_deliveries')) {
      return { ok: true, json: async () => ({}) };
    }
    throw new Error(`Unexpected fetch: ${url}`);
  };

  const res = createResponse();
  await inquiryHandler(request('POST', {
    firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com',
    subject: 'General Inquiry', message: 'Please send more information about the organization.', consent: true,
  }, { 'idempotency-key': 'inquiry-123456' }), res);

  assert.equal(res.statusCode, 202);
  assert.equal(res.body.status, 'accepted');
  assert.equal(res.body.reference, 'IWW-INQ-ABC123');
  assert.equal(res.body.staffNotification, 'degraded');
  assert.equal(calls.some((call) => call.url === 'https://workflow.test/inquiry'), false);
});

test('valid inquiry persists first, then sends signed workflow notification', async () => {
  configurePersistence();
  process.env.INQUIRY_WEBHOOK_URL = 'https://workflow.test/inquiry';
  process.env.WORKFLOW_WEBHOOK_SECRET = 'test-secret';
  const calls = [];
  global.fetch = async (url, options) => {
    calls.push({ url, options });
    if (url.includes('/rpc/iww_accept_inquiry')) {
      return persistenceResponse('IWW-INQ-ABC123', '11111111-1111-1111-1111-111111111111');
    }
    if (url === 'https://workflow.test/inquiry') return { ok: true, json: async () => ({}) };
    if (url.includes('/iww_notification_deliveries')) return { ok: true, json: async () => ({}) };
    throw new Error(`Unexpected fetch: ${url}`);
  };

  const res = createResponse();
  await inquiryHandler(request('POST', {
    firstName: ' Ada ', lastName: ' Lovelace ', email: 'ADA@EXAMPLE.COM',
    subject: 'General Inquiry', message: 'Please send more information about the organization.', consent: true,
  }, { 'idempotency-key': 'inquiry-123456' }), res);

  assert.equal(res.statusCode, 202);
  assert.equal(res.body.reference, 'IWW-INQ-ABC123');
  assert.equal(res.body.staffNotification, 'sent');
  assert.match(calls[0].url, /rpc\/iww_accept_inquiry$/);
  assert.equal(calls[1].url, 'https://workflow.test/inquiry');
  assert.match(calls[2].url, /iww_notification_deliveries$/);
  assert.equal(calls[1].options.headers['X-IWW-Webhook-Secret'], 'test-secret');
  const payload = JSON.parse(calls[1].options.body);
  assert.equal(payload.reference, 'IWW-INQ-ABC123');
  assert.equal(payload.submissionId, '11111111-1111-1111-1111-111111111111');
  assert.equal(payload.person.email, 'ada@example.com');
  assert.equal(payload.consent.submissionProcessing, true);
});

test('membership application validates allowed tier and interest before persistence', async () => {
  let called = false;
  global.fetch = async () => { called = true; return { ok: true, json: async () => ({}) }; };
  const res = createResponse();
  await membershipHandler(request('POST', {
    firstName: 'Grace', lastName: 'Hopper', email: 'grace@example.com', tier: 'Member',
    interest: 'Not an allowed interest', introduction: 'I would like to learn more about membership.', consent: true,
  }), res);
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.fields.interest, 'invalid');
  assert.equal(called, false);
});

test('valid membership application persists first and uses stored reference', async () => {
  configurePersistence();
  process.env.MEMBERSHIP_WEBHOOK_URL = 'https://workflow.test/membership';
  process.env.WORKFLOW_WEBHOOK_SECRET = 'test-secret';
  const calls = [];
  global.fetch = async (url, options) => {
    calls.push({ url, options });
    if (url.includes('/rpc/iww_accept_membership_application')) {
      return persistenceResponse('IWW-MEM-XYZ789', '22222222-2222-2222-2222-222222222222');
    }
    if (url === 'https://workflow.test/membership') return { ok: true, json: async () => ({}) };
    if (url.includes('/iww_notification_deliveries')) return { ok: true, json: async () => ({}) };
    throw new Error(`Unexpected fetch: ${url}`);
  };

  const res = createResponse();
  await membershipHandler(request('POST', {
    firstName: 'Grace', lastName: 'Hopper', email: 'grace@example.com', tier: 'Explorer',
    interest: 'Wealth & Financial Education', introduction: 'I want a structured place to learn and participate.', consent: true,
  }, { 'idempotency-key': 'membership-123456' }), res);

  assert.equal(res.statusCode, 202);
  assert.equal(res.body.reference, 'IWW-MEM-XYZ789');
  assert.equal(res.body.staffNotification, 'sent');
  assert.match(calls[0].url, /rpc\/iww_accept_membership_application$/);
  const payload = JSON.parse(calls[1].options.body);
  assert.equal(payload.requestedTier, 'Explorer');
  assert.equal(payload.primaryInterest, 'Wealth & Financial Education');
  assert.equal(payload.consent.applicationProcessing, true);
});

test('public API endpoints reject unsupported methods', async () => {
  const inquiryRes = createResponse();
  await inquiryHandler(request('GET'), inquiryRes);
  assert.equal(inquiryRes.statusCode, 405);
  assert.equal(inquiryRes.headers.allow, 'POST, OPTIONS');
  const healthRes = createResponse();
  healthHandler(request('POST'), healthRes);
  assert.equal(healthRes.statusCode, 405);
  assert.equal(healthRes.headers.allow, 'GET');
});

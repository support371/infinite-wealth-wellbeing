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
    setHeader(name, value) {
      this.headers[name.toLowerCase()] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
    end() {
      this.ended = true;
      return this;
    },
  };
}

function request(method, body = undefined, headers = {}) {
  return {
    method,
    body,
    headers: {
      'user-agent': 'test-agent',
      ...headers,
    },
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

test('health is degraded until both workflows and signing are configured', () => {
  process.env.INQUIRY_WEBHOOK_URL = 'https://workflow.test/inquiry';
  process.env.MEMBERSHIP_WEBHOOK_URL = 'https://workflow.test/membership';

  const res = createResponse();
  healthHandler(request('GET'), res);

  assert.equal(res.statusCode, 503);
  assert.equal(res.body.status, 'degraded');
  assert.equal(res.body.checks.workflowSigningConfigured, false);
  assert.equal(res.headers['cache-control'], 'no-store');
});

test('health is ready when workflow URLs and signing secret exist', () => {
  process.env.INQUIRY_WEBHOOK_URL = 'https://workflow.test/inquiry';
  process.env.MEMBERSHIP_WEBHOOK_URL = 'https://workflow.test/membership';
  process.env.WORKFLOW_WEBHOOK_SECRET = 'test-secret';

  const res = createResponse();
  healthHandler(request('GET'), res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.status, 'ready');
  assert.equal(res.body.checks.workflowSigningConfigured, true);
});

test('inquiry rejects invalid public values before delivery', async () => {
  const res = createResponse();
  await inquiryHandler(request('POST', {
    firstName: 'Ada',
    lastName: 'Lovelace',
    email: 'ada@example.com',
    subject: 'Unsupported Subject',
    message: 'This message is long enough.',
    consent: true,
  }), res);

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.error, 'validation_failed');
  assert.equal(res.body.fields.subject, 'invalid');
});

test('inquiry honeypot returns accepted without invoking a workflow', async () => {
  let called = false;
  global.fetch = async () => {
    called = true;
    return { ok: true };
  };

  const res = createResponse();
  await inquiryHandler(request('POST', {
    companyWebsite: 'https://bot.example',
  }), res);

  assert.equal(res.statusCode, 202);
  assert.equal(res.body.status, 'accepted');
  assert.equal(called, false);
});

test('inquiry refuses unsigned workflow delivery', async () => {
  process.env.INQUIRY_WEBHOOK_URL = 'https://workflow.test/inquiry';
  let called = false;
  global.fetch = async () => {
    called = true;
    return { ok: true };
  };

  const res = createResponse();
  await inquiryHandler(request('POST', {
    firstName: 'Ada',
    lastName: 'Lovelace',
    email: 'ada@example.com',
    subject: 'General Inquiry',
    message: 'Please send more information about the organization.',
    consent: true,
  }), res);

  assert.equal(res.statusCode, 503);
  assert.equal(res.body.error, 'workflow_not_configured');
  assert.equal(called, false);
});

test('valid inquiry is delivered with the workflow signing secret', async () => {
  process.env.INQUIRY_WEBHOOK_URL = 'https://workflow.test/inquiry';
  process.env.WORKFLOW_WEBHOOK_SECRET = 'test-secret';
  let delivery;
  global.fetch = async (url, options) => {
    delivery = { url, options };
    return { ok: true };
  };

  const res = createResponse();
  await inquiryHandler(request('POST', {
    firstName: ' Ada ',
    lastName: ' Lovelace ',
    email: 'ADA@EXAMPLE.COM',
    subject: 'General Inquiry',
    message: 'Please send more information about the organization.',
    consent: true,
  }), res);

  assert.equal(res.statusCode, 202);
  assert.match(res.body.reference, /^IWW-INQ-/);
  assert.equal(delivery.url, 'https://workflow.test/inquiry');
  assert.equal(delivery.options.headers['X-IWW-Webhook-Secret'], 'test-secret');
  const payload = JSON.parse(delivery.options.body);
  assert.equal(payload.type, 'inquiry.received');
  assert.equal(payload.person.email, 'ada@example.com');
  assert.equal(payload.consent.privacyNoticeAccepted, true);
});

test('membership application validates allowed tier and interest', async () => {
  const res = createResponse();
  await membershipHandler(request('POST', {
    firstName: 'Grace',
    lastName: 'Hopper',
    email: 'grace@example.com',
    tier: 'Member',
    interest: 'Not an allowed interest',
    introduction: 'I would like to learn more about membership.',
    consent: true,
  }), res);

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.fields.interest, 'invalid');
});

test('valid membership application is signed and accepted', async () => {
  process.env.MEMBERSHIP_WEBHOOK_URL = 'https://workflow.test/membership';
  process.env.WORKFLOW_WEBHOOK_SECRET = 'test-secret';
  let delivery;
  global.fetch = async (url, options) => {
    delivery = { url, options };
    return { ok: true };
  };

  const res = createResponse();
  await membershipHandler(request('POST', {
    firstName: 'Grace',
    lastName: 'Hopper',
    email: 'grace@example.com',
    tier: 'Explorer',
    interest: 'Wealth & Financial Education',
    introduction: 'I want a structured place to learn and participate.',
    consent: true,
  }), res);

  assert.equal(res.statusCode, 202);
  assert.match(res.body.reference, /^IWW-MEM-/);
  assert.equal(delivery.url, 'https://workflow.test/membership');
  assert.equal(delivery.options.headers['X-IWW-Webhook-Secret'], 'test-secret');
  const payload = JSON.parse(delivery.options.body);
  assert.equal(payload.type, 'membership.application.received');
  assert.equal(payload.requestedTier, 'Explorer');
  assert.equal(payload.primaryInterest, 'Wealth & Financial Education');
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

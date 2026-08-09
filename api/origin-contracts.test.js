import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import inquiryHandler from './inquiries.js';
import membershipHandler from './membership-applications.js';
import {
  CONTACT_SUBJECTS,
  MEMBERSHIP_INTERESTS,
  MEMBERSHIP_TIERS,
  SUBMISSION_LIMITS,
} from '../shared/submission-contracts.js';

const originalOrigin = process.env.PUBLIC_APP_ORIGIN;

afterEach(() => {
  if (originalOrigin === undefined) delete process.env.PUBLIC_APP_ORIGIN;
  else process.env.PUBLIC_APP_ORIGIN = originalOrigin;
});

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

function request(origin, body = {}) {
  return {
    method: 'POST',
    body,
    headers: {
      origin,
      'user-agent': 'origin-test',
    },
  };
}

test('shared submission contracts are unique and bounded', () => {
  assert.equal(new Set(CONTACT_SUBJECTS).size, CONTACT_SUBJECTS.length);
  assert.equal(new Set(MEMBERSHIP_TIERS).size, MEMBERSHIP_TIERS.length);
  assert.equal(new Set(MEMBERSHIP_INTERESTS).size, MEMBERSHIP_INTERESTS.length);
  assert.ok(SUBMISSION_LIMITS.email >= 254);
  assert.ok(SUBMISSION_LIMITS.message >= 1000);
  assert.ok(CONTACT_SUBJECTS.includes('Donation Enquiry'));
  assert.deepEqual(MEMBERSHIP_TIERS, ['Explorer', 'Member', 'Guardian']);
});

test('inquiry endpoint rejects a browser request from an untrusted origin', async () => {
  process.env.PUBLIC_APP_ORIGIN = 'https://iww.example';
  const res = response();
  await inquiryHandler(request('https://attacker.example'), res);
  assert.equal(res.statusCode, 403);
  assert.equal(res.body.error, 'origin_not_allowed');
  assert.equal(res.headers['access-control-allow-origin'], undefined);
});

test('membership endpoint rejects a browser request from an untrusted origin', async () => {
  process.env.PUBLIC_APP_ORIGIN = 'https://iww.example';
  const res = response();
  await membershipHandler(request('https://attacker.example'), res);
  assert.equal(res.statusCode, 403);
  assert.equal(res.body.error, 'origin_not_allowed');
});

test('configured browser origin is accepted into normal validation flow', async () => {
  process.env.PUBLIC_APP_ORIGIN = 'https://iww.example';
  const res = response();
  await inquiryHandler(request('https://iww.example', {}), res);
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.error, 'validation_failed');
  assert.equal(res.headers['access-control-allow-origin'], 'https://iww.example');
});

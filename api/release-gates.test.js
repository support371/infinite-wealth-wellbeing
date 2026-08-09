import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const config = JSON.parse(
  readFileSync(new URL('../config/release-gates.json', import.meta.url), 'utf8'),
);

const VALID_STATUSES = new Set([
  'implemented',
  'verified',
  'prepared',
  'in_progress',
  'blocked_dependency',
  'blocked_external',
]);

function gate(id) {
  return config.gates.find((entry) => entry.id === id);
}

test('release gate file has unique IDs and valid status values', () => {
  assert.equal(config.schemaVersion, 1);
  const ids = config.gates.map((entry) => entry.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const entry of config.gates) {
    assert.equal(VALID_STATUSES.has(entry.status), true, `invalid status for ${entry.id}`);
  }
});

test('implemented or verified gates carry concrete evidence', () => {
  for (const entry of config.gates.filter((item) => ['implemented', 'verified'].includes(item.status))) {
    assert.ok(Array.isArray(entry.evidence) && entry.evidence.length > 0, `${entry.id} has no evidence`);
  }
});

test('every uncleared required launch gate names its blocker', () => {
  for (const entry of config.gates.filter((item) => item.requiredForLaunch && !['implemented', 'verified'].includes(item.status))) {
    assert.ok(typeof entry.blocker === 'string' && entry.blocker.trim().length > 10, `${entry.id} has no blocker`);
  }
});

test('database is not falsely marked launch-clear before migration activation', () => {
  assert.equal(gate('dedicated_database').status, 'blocked_external');
  assert.equal(gate('durable_persistence_code').status, 'prepared');
});

test('provider-neutral operational systems remain prepared rather than falsely verified', () => {
  for (const id of [
    'notification_outbox',
    'transactional_email',
    'admin_review',
    'staff_role_governance',
    'operational_readiness',
    'backup_recovery',
    'incident_response',
    'function_budget',
  ]) {
    assert.equal(gate(id).requiredForLaunch, true, `${id} must remain a launch gate`);
    assert.equal(gate(id).status, 'prepared', `${id} must remain prepared until live evidence exists`);
  }
});

test('admin review gate includes terminal rationale guard evidence', () => {
  const evidence = gate('admin_review').evidence.join('\n');
  assert.match(evidence, /20260809071000_iww_terminal_review_reason_guard\.sql/);
  assert.match(evidence, /api\/review-reason-guard\.test\.js/);
});

test('operational readiness includes aggregate non-PII snapshot evidence', () => {
  const evidence = gate('operational_readiness').evidence.join('\n');
  assert.match(evidence, /20260809070000_iww_operational_snapshot\.sql/);
  assert.match(evidence, /api\/operational-snapshot\.test\.js/);
});

test('incident response remains launch-required until drill and ownership evidence exist', () => {
  const incident = gate('incident_response');
  assert.equal(incident.requiredForLaunch, true);
  assert.equal(incident.status, 'prepared');
  assert.match(incident.blocker, /drill/i);
  assert.match(incident.blocker, /ownership/i);
});

test('payments remain non-required while checkout is intentionally disabled', () => {
  const payments = gate('payments');
  assert.equal(payments.requiredForLaunch, false);
  assert.equal(['blocked_external', 'prepared'].includes(payments.status), true);
});

test('public claims and legal policy cannot be launch-clear without external evidence', () => {
  assert.equal(gate('public_claims').status, 'blocked_external');
  assert.equal(gate('legal_policy').status, 'blocked_external');
});

test('deployment and live verification gates remain uncleared without provider evidence', () => {
  assert.equal(gate('ci_deploy_evidence').status, 'in_progress');
  assert.equal(gate('e2e_accessibility_security').status, 'in_progress');
});

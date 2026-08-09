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

test('release gate file has unique IDs and valid status values', () => {
  assert.equal(config.schemaVersion, 1);
  const ids = config.gates.map((gate) => gate.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const gate of config.gates) {
    assert.equal(VALID_STATUSES.has(gate.status), true, `invalid status for ${gate.id}`);
  }
});

test('implemented or verified gates carry concrete evidence', () => {
  for (const gate of config.gates.filter((entry) => ['implemented', 'verified'].includes(entry.status))) {
    assert.ok(Array.isArray(gate.evidence) && gate.evidence.length > 0, `${gate.id} has no evidence`);
  }
});

test('every uncleared required launch gate names its blocker', () => {
  for (const gate of config.gates.filter((entry) => entry.requiredForLaunch && !['implemented', 'verified'].includes(entry.status))) {
    assert.ok(typeof gate.blocker === 'string' && gate.blocker.trim().length > 10, `${gate.id} has no blocker`);
  }
});

test('database is not falsely marked launch-clear before migration activation', () => {
  const database = config.gates.find((gate) => gate.id === 'dedicated_database');
  const persistence = config.gates.find((gate) => gate.id === 'durable_persistence_code');
  assert.equal(database.status, 'blocked_external');
  assert.equal(persistence.status, 'prepared');
});

test('payments remain non-required while checkout is intentionally disabled', () => {
  const payments = config.gates.find((gate) => gate.id === 'payments');
  assert.equal(payments.requiredForLaunch, false);
  assert.equal(['blocked_external', 'prepared'].includes(payments.status), true);
});

test('public claims and legal policy cannot be launch-clear without external evidence', () => {
  const claimGate = config.gates.find((gate) => gate.id === 'public_claims');
  const legalGate = config.gates.find((gate) => gate.id === 'legal_policy');
  assert.equal(claimGate.status, 'blocked_external');
  assert.equal(legalGate.status, 'blocked_external');
});

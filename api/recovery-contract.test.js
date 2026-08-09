import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const acceptance = readFileSync(
  new URL('../supabase/verification/restore_acceptance.sql', import.meta.url),
  'utf8',
);
const runbook = readFileSync(
  new URL('../ops/BACKUP_RECOVERY_RUNBOOK.md', import.meta.url),
  'utf8',
);

test('restore acceptance SQL remains read-only', () => {
  assert.equal(/\b(insert|update|delete|drop|truncate|alter|create|grant|revoke)\b/i.test(acceptance), false);
});

test('restore acceptance checks RLS and anonymous privilege exposure', () => {
  assert.match(acceptance, /relrowsecurity/i);
  assert.match(acceptance, /grantee = 'anon'/i);
  assert.match(acceptance, /Expected result: zero rows/i);
});

test('restore acceptance verifies notification and email outbox infrastructure', () => {
  assert.match(acceptance, /iww_notification_outbox/);
  assert.match(acceptance, /iww_email_outbox/);
  assert.match(acceptance, /iww_claim_notification_batch/);
  assert.match(acceptance, /iww_claim_email_batch/);
});

test('runbook refuses to invent RPO RTO or retention promises', () => {
  assert.match(runbook, /does \*\*not\*\* currently claim an approved recovery point objective \(RPO\) or recovery time objective \(RTO\)/i);
  assert.match(runbook, /No business-data retention period is approved yet/i);
  assert.match(runbook, /do not add automated deletion/i);
});

test('recovery procedure requires isolated restore validation before external delivery resumes', () => {
  assert.match(runbook, /isolated non-production environment/i);
  assert.match(runbook, /Do not point public production traffic, workers, webhooks, or email providers at the restored environment/i);
  assert.match(runbook, /disable outbound staff\/email workers until restored data integrity is confirmed/i);
  assert.match(runbook, /restore_acceptance\.sql/i);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const acceptance = readFileSync(
  new URL('../supabase/verification/restore_acceptance.sql', import.meta.url),
  'utf8',
);
const runbook = readFileSync(
  new URL('../ops/STAFF_MFA_RUNBOOK.md', import.meta.url),
  'utf8',
);

test('restore acceptance flags active privileged roles without verified MFA', () => {
  assert.match(acceptance, /r\.role in \('reviewer'::public\.iww_user_role, 'admin'::public\.iww_user_role\)/i);
  assert.match(acceptance, /from auth\.mfa_factors f/i);
  assert.match(acceptance, /f\.status = 'verified'/i);
  assert.match(acceptance, /Expected result: zero rows/i);
});

test('staff MFA recovery never permits password-only privileged reactivation', () => {
  assert.match(runbook, /Password-only staff access is not an accepted operating mode/i);
  assert.match(runbook, /Require a newly verified factor before privileged role activation\/re-activation/i);
  assert.match(runbook, /Never bootstrap a password-only account/i);
});

test('MFA recovery requires AAL1 negative and AAL2 positive evidence', () => {
  assert.match(runbook, /AAL1 negative test/i);
  assert.match(runbook, /AAL2 positive test/i);
  assert.match(runbook, /lost-factor\/recovery drill/i);
});

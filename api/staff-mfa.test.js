import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function text(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}

const staffAuth = text('server/staff-auth.js');
const mfaGate = text('src/admin/StaffMfaGate.jsx');
const adminApp = text('src/admin/AdminApp.jsx');
const historyApp = text('src/admin/HistoryApp.jsx');
const migration = text('supabase/migrations/20260809072000_iww_staff_mfa_guard.sql');

test('privileged server authentication requires validated JWT AAL2 before role lookup', () => {
  assert.match(staffAuth, /validateSupabaseAccessToken\(token\)/);
  assert.match(staffAuth, /claims\.aal !== 'aal2'/);
  assert.match(staffAuth, /error: 'mfa_required'/);
  assert.ok(staffAuth.indexOf("claims.aal !== 'aal2'") < staffAuth.indexOf('iww_user_roles'));
});

test('staff browser gate assesses authenticator assurance and completes TOTP challenge', () => {
  assert.match(mfaGate, /getAuthenticatorAssuranceLevel\(\)/);
  assert.match(mfaGate, /currentLevel === 'aal2'/);
  assert.match(mfaGate, /factorType: 'totp'/);
  assert.match(mfaGate, /challengeAndVerify/);
  assert.match(mfaGate, /pattern="\[0-9\]\{6\}"/);
});

test('both privileged browser surfaces use the same MFA gate', () => {
  assert.match(adminApp, /import StaffMfaGate from '\.\/StaffMfaGate\.jsx'/);
  assert.match(adminApp, /<StaffMfaGate/);
  assert.match(historyApp, /import StaffMfaGate from '\.\/StaffMfaGate\.jsx'/);
  assert.match(historyApp, /<StaffMfaGate/);
});

test('MFA browser gate contains no service-role or worker/provider secret references', () => {
  for (const forbidden of [
    'IWW_SUPABASE_SERVICE_ROLE_KEY',
    'WORKFLOW_WEBHOOK_SECRET',
    'IWW_NOTIFICATION_WORKER_SECRET',
    'IWW_EMAIL_WORKER_SECRET',
    'IWW_EMAIL_DELIVERY_SECRET',
  ]) {
    assert.equal(mfaGate.includes(forbidden), false, `${forbidden} leaked into MFA browser module`);
  }
});

test('staff-role bootstrap and grants require a verified Auth MFA factor', () => {
  assert.match(migration, /from auth\.mfa_factors/i);
  assert.match(migration, /status = 'verified'/i);
  assert.match(migration, /iww_private\.user_has_verified_mfa\(p_user_id\)/i);
  assert.match(migration, /iww_private\.user_has_verified_mfa\(p_target_user_id\)/i);
  assert.match(migration, /raise exception 'verified_mfa_required'/i);
});

test('MFA role guard preserves service-role-only mutation and evidence semantics', () => {
  assert.match(migration, /staff\.role_unchanged/);
  assert.match(migration, /mfaVerifiedWhenGranted/);
  assert.match(migration, /revoke all on function public\.iww_set_staff_role[\s\S]*from public, anon, authenticated;/i);
  assert.match(migration, /grant execute on function public\.iww_set_staff_role[\s\S]*to service_role;/i);
});

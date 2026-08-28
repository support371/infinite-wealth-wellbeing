import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const migration = readFileSync(
  new URL('../supabase/migrations/20260809073000_iww_operational_mfa_integrity.sql', import.meta.url),
  'utf8',
);

test('operational snapshot fails closed when active privileged role lacks verified MFA', () => {
  assert.match(migration, /r\.role in \('reviewer'::public\.iww_user_role, 'admin'::public\.iww_user_role\)/i);
  assert.match(migration, /from auth\.mfa_factors f/i);
  assert.match(migration, /f\.status = 'verified'/i);
  assert.match(migration, /raise exception 'privileged_role_without_verified_mfa'/i);
});

test('healthy operational snapshot positively records privileged MFA integrity', () => {
  assert.match(migration, /'privilegedMfaIntegrity', true/i);
});

test('operational snapshot remains server-only after MFA integrity replacement', () => {
  assert.match(migration, /revoke all on function public\.iww_operational_snapshot\(\) from public, anon, authenticated;/i);
  assert.match(migration, /grant execute on function public\.iww_operational_snapshot\(\) to service_role;/i);
});

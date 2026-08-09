import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const migration = readFileSync(
  new URL('../supabase/migrations/20260809067000_iww_staff_role_evidence_guard.sql', import.meta.url),
  'utf8',
);

test('system bootstrap does not falsely attribute itself to the new admin user', () => {
  assert.match(migration, /values \(\s*null,\s*'staff\.admin_bootstrapped'/i);
  assert.match(migration, /'systemBootstrap', true/i);
});

test('role no-ops are recorded distinctly from real grant or revoke changes', () => {
  assert.match(migration, /v_changed boolean := false/i);
  assert.match(migration, /'staff\.role_unchanged'/i);
  assert.match(migration, /'changed', v_changed/i);
});

test('revocation determines whether a row actually changed', () => {
  assert.match(migration, /get diagnostics v_changed_rows = row_count;/i);
  assert.match(migration, /v_changed := v_changed_rows > 0;/i);
});

test('last active admin protection remains present after evidence correction', () => {
  assert.match(migration, /raise exception 'last_admin_required';/i);
});

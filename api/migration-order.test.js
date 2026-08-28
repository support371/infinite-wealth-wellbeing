import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';

const migrationDirectory = new URL('../supabase/migrations/', import.meta.url);
const documented = readFileSync(new URL('../supabase/MIGRATION_ORDER.md', import.meta.url), 'utf8');

const expected = [
  '20260809060000_iww_production_core.sql',
  '20260809061000_iww_atomic_intake.sql',
  '20260809062000_iww_staff_review.sql',
  '20260809063000_iww_idempotency_maintenance.sql',
  '20260809064000_iww_notification_outbox.sql',
  '20260809065000_iww_outbox_delivery_guard.sql',
  '20260809066000_iww_staff_role_management.sql',
  '20260809067000_iww_staff_role_evidence_guard.sql',
  '20260809068000_iww_intake_throttle.sql',
  '20260809069000_iww_transactional_email_outbox.sql',
  '20260809070000_iww_operational_snapshot.sql',
  '20260809071000_iww_terminal_review_reason_guard.sql',
  '20260809072000_iww_staff_mfa_guard.sql',
  '20260809073000_iww_operational_mfa_integrity.sql',
];

test('production migration directory exactly matches the documented ordered inventory', () => {
  const actual = readdirSync(migrationDirectory)
    .filter((name) => name.endsWith('.sql'))
    .sort();
  assert.deepEqual(actual, expected);
});

test('migration documentation lists every migration in lexical execution order', () => {
  let previousIndex = -1;
  for (const name of expected) {
    const index = documented.indexOf(name);
    assert.ok(index > previousIndex, `${name} is missing or out of order in MIGRATION_ORDER.md`);
    previousIndex = index;
  }
});

test('replacement-function migrations document their dependency semantics', () => {
  for (const marker of ['`670`', '`710`', '`720`', '`730`']) {
    assert.match(documented, new RegExp(marker.replace(/`/g, '\\`')));
  }
  assert.match(documented, /complete ordered migration history/i);
});

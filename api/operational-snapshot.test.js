import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const migration = readFileSync(
  new URL('../supabase/migrations/20260809070000_iww_operational_snapshot.sql', import.meta.url),
  'utf8',
);

test('operational snapshot is service-role only', () => {
  assert.match(migration, /create or replace function public\.iww_operational_snapshot\(\)/i);
  assert.match(migration, /security definer/i);
  assert.match(migration, /revoke all on function public\.iww_operational_snapshot\(\) from public, anon, authenticated;/i);
  assert.match(migration, /grant execute on function public\.iww_operational_snapshot\(\) to service_role;/i);
});

test('snapshot reports aggregate staff and email queue health including stuck and dead-letter work', () => {
  assert.match(migration, /'notificationOutbox'/);
  assert.match(migration, /'emailOutbox'/);
  assert.match(migration, /'deadLetter'/);
  assert.match(migration, /'stuckProcessing'/);
  assert.match(migration, /locked_at < now\(\) - interval '10 minutes'/i);
});

test('snapshot provides review backlog and recent delivery-failure counts without submission content', () => {
  assert.match(migration, /'reviewQueue'/);
  assert.match(migration, /'deliveryFailures24h'/);
  assert.equal(/select\s+(first_name|last_name|email|message|introduction|metadata)/i.test(migration), false);
  assert.equal(/jsonb_build_object\([^]*'(firstName|lastName|email|message|introduction)'/i.test(migration), false);
});

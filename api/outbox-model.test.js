import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const migration = readFileSync(
  new URL('../supabase/migrations/20260809064000_iww_notification_outbox.sql', import.meta.url),
  'utf8',
);

test('outbox has a unique submission/event key and RLS with no browser access', () => {
  assert.match(migration, /unique \(submission_kind, submission_id, event_type\)/i);
  assert.match(migration, /alter table public\.iww_notification_outbox enable row level security;/i);
  assert.match(migration, /revoke all on public\.iww_notification_outbox from anon, authenticated;/i);
  assert.match(migration, /grant all on public\.iww_notification_outbox to service_role;/i);
});

test('accepted inquiries and membership applications enqueue work automatically', () => {
  assert.match(migration, /create trigger iww_inquiries_enqueue_notification[\s\S]*after insert on public\.iww_inquiries/i);
  assert.match(migration, /create trigger iww_membership_applications_enqueue_notification[\s\S]*after insert on public\.iww_membership_applications/i);
  assert.match(migration, /'staff\.inquiry\.received'/i);
  assert.match(migration, /'staff\.membership_application\.received'/i);
});

test('claim RPC uses skip-locked concurrency and stale-processing recovery', () => {
  assert.match(migration, /for update skip locked/i);
  assert.match(migration, /status = 'processing' and q\.locked_at < now\(\) - interval '10 minutes'/i);
  assert.match(migration, /attempt_count = q\.attempt_count \+ 1/i);
});

test('successful immediate delivery automatically completes pending outbox work', () => {
  assert.match(migration, /create trigger iww_delivery_completes_outbox/i);
  assert.match(migration, /new\.channel = 'webhook' and new\.status in \('sent', 'delivered'\)/i);
  assert.match(migration, /set status = 'delivered'/i);
});

test('failed work uses bounded exponential backoff and eventually dead-letters', () => {
  assert.match(migration, /v_attempt >= 8/i);
  assert.match(migration, /status = 'dead_letter'/i);
  assert.match(migration, /make_interval\(mins => least\(360, power\(2,/i);
  assert.match(migration, /status = 'queued'/i);
});

test('worker RPCs remain service-role only', () => {
  assert.match(migration, /revoke all on function public\.iww_claim_notification_batch[\s\S]*from public, anon, authenticated;/i);
  assert.match(migration, /revoke all on function public\.iww_finish_notification_attempt[\s\S]*from public, anon, authenticated;/i);
  assert.match(migration, /grant execute on function public\.iww_claim_notification_batch[\s\S]*to service_role;/i);
  assert.match(migration, /grant execute on function public\.iww_finish_notification_attempt[\s\S]*to service_role;/i);
});

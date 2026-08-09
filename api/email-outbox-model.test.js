import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const migration = readFileSync(
  new URL('../supabase/migrations/20260809069000_iww_transactional_email_outbox.sql', import.meta.url),
  'utf8',
);

test('transactional email queue is durable, RLS-protected, and server-only', () => {
  assert.match(migration, /create table public\.iww_email_outbox/i);
  assert.match(migration, /alter table public\.iww_email_outbox enable row level security;/i);
  assert.match(migration, /revoke all on public\.iww_email_outbox from public, anon, authenticated;/i);
  assert.match(migration, /grant all on public\.iww_email_outbox to service_role;/i);
});

test('accepted inquiry and membership records enqueue confirmation template identifiers', () => {
  assert.match(migration, /iww_inquiries_enqueue_confirmation_email/i);
  assert.match(migration, /iww_membership_applications_enqueue_confirmation_email/i);
  assert.match(migration, /inquiry_received_v1/);
  assert.match(migration, /membership_application_received_v1/);
});

test('email outbox deliberately does not persist rendered message copy', () => {
  const createTable = migration.match(/create table public\.iww_email_outbox \([\s\S]*?\n\);/i)?.[0] || '';
  assert.equal(/\b(subject|html|text_body|html_body|rendered_body|content)\b/i.test(createTable), false);
  assert.match(createTable, /template_key text not null/i);
});

test('email queue claims are concurrency-safe and bounded', () => {
  assert.match(migration, /create or replace function public\.iww_claim_email_batch/i);
  assert.match(migration, /for update skip locked/i);
  assert.match(migration, /greatest\(1, least\(coalesce\(p_limit, 25\), 100\)\)/i);
  assert.match(migration, /processing[^]*locked_at < now\(\) - interval '10 minutes'/i);
});

test('email completion requires durable email delivery evidence', () => {
  assert.match(migration, /channel = 'email'/i);
  assert.match(migration, /status in \('sent', 'delivered'\)/i);
  assert.match(migration, /v_effective_delivered := p_delivered and v_delivery_evidence;/i);
  assert.match(migration, /email_delivery_evidence_missing/i);
});

test('email queue RPCs are executable only by service_role', () => {
  assert.match(migration, /revoke all on function public\.iww_claim_email_batch\(integer\) from public, anon, authenticated;/i);
  assert.match(migration, /revoke all on function public\.iww_finish_email_attempt\(uuid, boolean, text\) from public, anon, authenticated;/i);
  assert.match(migration, /grant execute on function public\.iww_claim_email_batch\(integer\) to service_role;/i);
  assert.match(migration, /grant execute on function public\.iww_finish_email_attempt\(uuid, boolean, text\) to service_role;/i);
});

test('migration remains provider-neutral until sender infrastructure is approved', () => {
  assert.equal(/sendgrid|mailgun|postmark|resend|ses|smtp/i.test(migration), false);
});

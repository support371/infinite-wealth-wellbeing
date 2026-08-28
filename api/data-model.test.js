import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const migration = readFileSync(
  new URL('../supabase/migrations/20260809060000_iww_production_core.sql', import.meta.url),
  'utf8',
);
const atomicIntake = readFileSync(
  new URL('../supabase/migrations/20260809061000_iww_atomic_intake.sql', import.meta.url),
  'utf8',
);

const TABLES = [
  'iww_profiles',
  'iww_user_roles',
  'iww_inquiries',
  'iww_membership_applications',
  'iww_consent_records',
  'iww_submission_status_events',
  'iww_memberships',
  'iww_notification_deliveries',
  'iww_idempotency_records',
  'iww_audit_events',
];

test('every IWW core public table enables row level security', () => {
  for (const table of TABLES) {
    assert.match(
      migration,
      new RegExp(`alter table public\\.${table} enable row level security;`, 'i'),
      `RLS missing for ${table}`,
    );
  }
});

test('anonymous role is explicitly revoked from every IWW core table', () => {
  for (const table of TABLES) {
    assert.match(
      migration,
      new RegExp(`revoke all on public\\.${table} from anon;`, 'i'),
      `anon revoke missing for ${table}`,
    );
  }
});

test('role and audit mutation remain server-side', () => {
  assert.match(migration, /revoke all on public\.iww_user_roles from authenticated;/i);
  assert.match(migration, /revoke all on public\.iww_audit_events from authenticated;/i);
  assert.match(migration, /revoke all on public\.iww_idempotency_records from authenticated;/i);
  assert.match(migration, /revoke all on public\.iww_notification_deliveries from authenticated;/i);
});

test('staff authorization helpers are security-definer functions in a private schema', () => {
  assert.match(migration, /create schema if not exists iww_private;/i);
  assert.match(migration, /create or replace function iww_private\.has_staff_role\(\)[\s\S]*security definer/i);
  assert.match(migration, /create or replace function iww_private\.has_admin_role\(\)[\s\S]*security definer/i);
  assert.equal(/create or replace function public\.has_staff_role/i.test(migration), false);
});

test('user-facing intake and membership rows support user linkage without anonymous writes', () => {
  assert.match(migration, /user_id uuid references auth\.users\(id\) on delete set null/i);
  assert.match(migration, /create policy "inquiries_select_own_or_staff"/i);
  assert.match(migration, /create policy "membership_applications_select_own_or_staff"/i);
  assert.match(migration, /create policy "memberships_select_own_or_staff"/i);
});

test('schema includes durable operational evidence tables', () => {
  assert.match(migration, /create table public\.iww_consent_records/i);
  assert.match(migration, /create table public\.iww_submission_status_events/i);
  assert.match(migration, /create table public\.iww_notification_deliveries/i);
  assert.match(migration, /create table public\.iww_idempotency_records/i);
  assert.match(migration, /create table public\.iww_audit_events/i);
});

test('atomic intake RPCs claim idempotency before creating submissions', () => {
  assert.match(atomicIntake, /create or replace function public\.iww_accept_inquiry/i);
  assert.match(atomicIntake, /create or replace function public\.iww_accept_membership_application/i);
  assert.match(atomicIntake, /insert into public\.iww_idempotency_records[\s\S]*on conflict \(idempotency_key\) do nothing/i);
  assert.match(atomicIntake, /get diagnostics v_claimed_rows = row_count;/i);
  assert.equal(/get diagnostics v_claimed = row_count;/i.test(atomicIntake), false);
});

test('idempotency replay rejects a key used for different request content', () => {
  const occurrences = atomicIntake.match(/raise exception 'idempotency_key_reused';/g) || [];
  assert.equal(occurrences.length, 2);
  assert.match(atomicIntake, /v_existing\.request_hash <> p_request_hash/i);
});

test('atomic intake records consent, initial status, audit evidence, and stable response', () => {
  assert.match(atomicIntake, /insert into public\.iww_consent_records/i);
  assert.match(atomicIntake, /insert into public\.iww_submission_status_events/i);
  assert.match(atomicIntake, /insert into public\.iww_audit_events/i);
  assert.match(atomicIntake, /'submissionId', v_submission_id/i);
  assert.match(atomicIntake, /response_body = v_response/i);
});

test('public intake RPCs are executable only by service_role', () => {
  assert.match(
    atomicIntake,
    /revoke all on function public\.iww_accept_inquiry[\s\S]*from public, anon, authenticated;/i,
  );
  assert.match(
    atomicIntake,
    /revoke all on function public\.iww_accept_membership_application[\s\S]*from public, anon, authenticated;/i,
  );
  assert.match(
    atomicIntake,
    /grant execute on function public\.iww_accept_inquiry[\s\S]*to service_role;/i,
  );
  assert.match(
    atomicIntake,
    /grant execute on function public\.iww_accept_membership_application[\s\S]*to service_role;/i,
  );
});

test('payment tables are not invented before a payment provider is selected', () => {
  assert.equal(/create table public\.iww_(payments|payment_events|charges|donations)/i.test(migration), false);
  assert.equal(/create table public\.iww_(payments|payment_events|charges|donations)/i.test(atomicIntake), false);
});

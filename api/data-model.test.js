import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const migration = readFileSync(
  new URL('../supabase/migrations/20260809060000_iww_production_core.sql', import.meta.url),
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

test('payment tables are not invented before a payment provider is selected', () => {
  assert.equal(/create table public\.iww_(payments|payment_events|charges|donations)/i.test(migration), false);
});

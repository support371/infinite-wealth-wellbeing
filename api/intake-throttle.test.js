import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const migration = readFileSync(
  new URL('../supabase/migrations/20260809068000_iww_intake_throttle.sql', import.meta.url),
  'utf8',
);

test('intake throttle indexes normalized email and creation time', () => {
  assert.match(migration, /iww_inquiries_email_created_idx[\s\S]*lower\(email\), created_at desc/i);
  assert.match(migration, /iww_membership_applications_email_created_idx[\s\S]*lower\(email\), created_at desc/i);
});

test('inquiry throttle blocks repeated submissions from one email within a short window', () => {
  assert.match(migration, /tg_table_name = 'iww_inquiries'/i);
  assert.match(migration, /created_at >= now\(\) - interval '15 minutes'/i);
  assert.match(migration, /if v_recent >= 5 then[\s\S]*raise exception 'intake_rate_limited'/i);
});

test('membership application throttle is stricter over a longer window', () => {
  assert.match(migration, /tg_table_name = 'iww_membership_applications'/i);
  assert.match(migration, /created_at >= now\(\) - interval '24 hours'/i);
  assert.match(migration, /if v_recent >= 3 then[\s\S]*raise exception 'intake_rate_limited'/i);
});

test('throttle is enforced before table insert and stores no IP address', () => {
  assert.match(migration, /create trigger iww_inquiries_intake_throttle[\s\S]*before insert on public\.iww_inquiries/i);
  assert.match(migration, /create trigger iww_membership_applications_intake_throttle[\s\S]*before insert on public\.iww_membership_applications/i);
  assert.equal(/ip_address|forwarded_for|client_ip/i.test(migration), false);
});

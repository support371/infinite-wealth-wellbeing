import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const core = read('supabase/migrations/20260828050000_iww_saas_core.sql');
const rls = read('supabase/migrations/20260828051000_iww_rls.sql');
const audit = read('supabase/migrations/20260828053000_iww_audit_guards.sql');
const config = read('src/lib/iwwConfig.js');
const client = read('src/lib/supabase.js');

const requiredRoles = ['owner','admin','operations_manager','advisor','practitioner','member','family_delegate'];
const requiredTables = [
  'profiles','organizations','memberships','invitations','user_preferences','activity_events','audit_events','consents','policy_acknowledgements','notifications','integration_connections','workflow_approvals','reports','report_runs',
  'wellbeing_plans','wellbeing_checkins','goals','habits','habit_logs','programmes','programme_enrolments','coaching_sessions','appointments','assessments',
  'wealth_plans','wealth_goals','assets','liabilities','cashflow_targets','financial_documents','adviser_tasks','wealth_reviews',
  'documents','document_access','conversations','messages','tasks','task_assignments','resources','community_posts','comments','subscriptions','billing_records'
];

test('declares the complete seven-role IWW authorization model', () => {
  for (const role of requiredRoles) {
    assert.match(config, new RegExp(`['\"]${role}['\"]`));
    assert.match(core, new RegExp(role));
  }
  assert.doesNotMatch(config, /super_admin|trustee/);
});

test('creates every required SaaS application table in the IWW migration', () => {
  for (const table of requiredTables) {
    assert.match(core, new RegExp(`create table if not exists public\\.${table}\\s*\\(`, 'i'), `missing ${table}`);
    assert.match(rls, new RegExp(`['\"]${table}['\"]`), `RLS inventory missing ${table}`);
  }
  assert.match(core, /member_assignments/);
  assert.match(core, /family_delegations/);
  assert.match(core, /data_requests/);
});

test('enforces family delegate scope and distinct wealth/wellbeing access helpers', () => {
  assert.match(rls, /iww_family_scope/);
  assert.match(rls, /allow_goals/);
  assert.match(rls, /allow_appointments/);
  assert.match(rls, /allow_documents/);
  assert.match(rls, /iww_can_access_wealth_member/);
  assert.match(rls, /iww_can_access_wellbeing_member/);
  const wealthFunction = rls.slice(rls.indexOf('iww_can_access_wealth_member'), rls.indexOf('iww_can_access_wellbeing_member'));
  assert.doesNotMatch(wealthFunction, /family_delegations/);
});

test('keeps audit history append-only and client secrets out of the browser client', () => {
  assert.match(audit, /audit_events_are_append_only/);
  assert.match(audit, /before update on public\.audit_events/);
  assert.match(audit, /before delete on public\.audit_events/);
  assert.match(audit, /revoke insert,update,delete on public\.audit_events from authenticated/);
  assert.match(client, /VITE_SUPABASE_PUBLISHABLE_KEY/);
  assert.doesNotMatch(client, /SERVICE_ROLE|STRIPE_SECRET|HUBSPOT_ACCESS_TOKEN/);
});

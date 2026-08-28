import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const sql = readFileSync(new URL('../supabase/migrations/20260828040315_iww_production_foundation.sql', import.meta.url),'utf8').toLowerCase();
const organizationBootstrapSql = readFileSync(new URL('../supabase/migrations/20260828173907_create_organization_with_owner.sql', import.meta.url),'utf8').toLowerCase();
const authContext = readFileSync(new URL('../src/auth/AuthContext.jsx', import.meta.url),'utf8');

describe('IWW Supabase production migration', () => {
  it('forces RLS on all public application tables', () => {
    expect(sql).toContain("alter table public.%i enable row level security");
    expect(sql).toContain("alter table public.%i force row level security");
  });
  it('uses server-authoritative organization and member helpers', () => {
    expect(sql).toContain('private.is_org_member');
    expect(sql).toContain('private.has_org_role');
    expect(sql).toContain('private.can_access_member');
    expect(sql).toContain('care_assignments');
    expect(sql).toContain('family_delegations');
  });
  it('keeps sensitive helper functions out of public schema', () => {
    expect(sql).not.toMatch(/create or replace function public\.[^(]+\([^)]*\)[\s\s]*returns[\s\s]*security definer/);
    expect(sql).toContain('revoke all on all functions in schema private from public, anon');
  });
  it('makes audit history append-only at the authenticated layer', () => {
    expect(sql).toContain('create policy audit_select');
    expect(sql).toContain('create policy audit_insert');
    expect(sql).not.toMatch(/create policy audit_(?:update|delete)/);
  });
  it('isolates messages to explicit participants and documents to explicit access', () => {
    expect(sql).toContain('(select auth.uid()) = any(participant_ids)');
    expect(sql).toContain('document_access_permissions');
    expect(sql).toContain('grantee_user_id = (select auth.uid())');
  });
  it('protects private document storage and captures governed changes', () => {
    expect(sql).toContain("'iww-private-documents'");
    expect(sql).toContain('create policy iww_storage_insert');
    expect(sql).toContain('private.capture_governed_change');
    expect(sql).toContain("'memberships','consents','policy_acknowledgements'");
  });
  it('contains the full required domain model', () => {
    const required = ['profiles','organizations','memberships','wellbeing_plans','wellbeing_checkins','goals','habits','habit_logs','programmes','programme_enrolments','coaching_sessions','appointments','assessments','wealth_plans','wealth_goals','assets','liabilities','cashflow_targets','financial_documents','adviser_tasks','wealth_reviews','documents','conversations','messages','tasks','resource_library_items','community_posts','billing_subscription_references'];
    for (const table of required) expect(sql).toContain(`create table public.${table}`);
  });

  it('bootstraps an organization and owner membership in one authenticated transaction', () => {
    expect(organizationBootstrapSql).toContain('actor_id uuid := auth.uid()');
    expect(organizationBootstrapSql).toContain('insert into public.organizations');
    expect(organizationBootstrapSql).toContain('insert into public.memberships');
    expect(organizationBootstrapSql).toContain("'owner'::public.app_role");
    expect(organizationBootstrapSql).toContain('security definer');
    expect(organizationBootstrapSql).toContain("set search_path = ''");
  });

  it('exposes organization bootstrap only as an authenticated security-invoker RPC', () => {
    expect(organizationBootstrapSql).toContain('create or replace function public.create_organization_with_owner');
    expect(organizationBootstrapSql).toContain('security invoker');
    expect(organizationBootstrapSql).toContain('revoke all on function public.create_organization_with_owner(text, text) from public, anon');
    expect(organizationBootstrapSql).toContain('grant execute on function public.create_organization_with_owner(text, text) to authenticated');
    expect(authContext).toContain(".rpc('create_organization_with_owner'");
    expect(authContext).not.toContain(".from('organizations')\n      .insert");
  });
});

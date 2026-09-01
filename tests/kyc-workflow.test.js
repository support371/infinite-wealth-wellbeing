import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const routeSource = readFileSync(new URL('../src/AppRoutes.jsx', import.meta.url), 'utf8');
const shellSource = readFileSync(new URL('../src/app/AppShell.jsx', import.meta.url), 'utf8');
const pageSource = readFileSync(new URL('../src/app/KycPage.jsx', import.meta.url), 'utf8');
const migration = readFileSync(new URL('../supabase/migrations/20260901150000_kyc_verification_workflow.sql', import.meta.url), 'utf8');
const hardening = readFileSync(new URL('../supabase/migrations/20260901152000_harden_kyc_policy_and_indexes.sql', import.meta.url), 'utf8');

describe('governed KYC workflow', () => {
  it('is a real tenant workspace route', () => {
    expect(routeSource).toMatch(/path="verification" element={<KycPage\/>}/);
    expect(shellSource).toMatch(/KYC verification/);
  });

  it('requires evidence and certification before member submission', () => {
    expect(pageSource).toMatch(/Complete KYC/);
    expect(pageSource).toMatch(/Upload identity evidence/);
    expect(pageSource).toMatch(/certification_accepted/);
    expect(pageSource).toMatch(/Submit KYC/);
  });

  it('gives authorized staff a review and decision queue', () => {
    expect(pageSource).toMatch(/KYC management/);
    expect(pageSource).toMatch(/Start review/);
    expect(pageSource).toMatch(/Approve KYC/);
    expect(pageSource).toMatch(/Request resubmission/);
    expect(pageSource).toMatch(/Reject KYC/);
  });

  it('protects KYC tables and private documents with RLS', () => {
    expect(migration).toMatch(/alter table public\.kyc_cases force row level security/);
    expect(migration).toMatch(/alter table public\.kyc_documents force row level security/);
    expect(migration).toMatch(/private\.has_org_role\(organization_id, array\['owner','admin','operations_manager'\]/);
    expect(migration).toMatch(/'iww-kyc-documents'.*false/s);
    expect(migration).toMatch(/size_bytes bigint not null check \(size_bytes > 0 and size_bytes <= 10485760\)/);
  });

  it('prevents members from self-approving through the subject update policy', () => {
    expect(migration).toMatch(/status in \('draft','submitted'\)/);
    const subjectPolicy = migration.match(/create policy kyc_cases_subject_update[\s\S]*?;\ncreate policy kyc_cases_staff_update/)?.[0] || '';
    expect(subjectPolicy).not.toMatch(/status in \([^)]*approved/);
    expect(hardening).toMatch(/subject_user_id <> \(select auth\.uid\(\)\)/);
    expect(hardening.match(/create policy kyc_cases_update/g)).toHaveLength(1);
    expect(migration).toMatch(/Members cannot approve or review KYC cases/);
    expect(pageSource).toMatch(/another authorized staff member/);
  });
});

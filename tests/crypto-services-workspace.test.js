import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const routeSource = readFileSync(new URL('../src/AppRoutes.jsx', import.meta.url), 'utf8');
const shellSource = readFileSync(new URL('../src/app/AppShell.jsx', import.meta.url), 'utf8');
const dashboardSource = readFileSync(new URL('../src/app/DashboardPage.jsx', import.meta.url), 'utf8');
const pageSource = readFileSync(new URL('../src/app/CryptoServicesPage.jsx', import.meta.url), 'utf8');
const migration = readFileSync(new URL('../supabase/migrations/20260903233148_crypto_services_workspace.sql', import.meta.url), 'utf8').toLowerCase();
const hardening = readFileSync(new URL('../supabase/migrations/20260903234000_harden_crypto_service_update_policy.sql', import.meta.url), 'utf8').toLowerCase();

describe('governed Crypto Services workspace', () => {
  it('is reachable from tenant routing, navigation and the dashboard', () => {
    expect(routeSource).toMatch(/path="crypto" element={<CryptoServicesPage\/>}/);
    expect(shellSource).toMatch(/Crypto Services/);
    expect(dashboardSource).toMatch(/Open Crypto Services/);
  });

  it('offers the client service journey and separate managed launch point', () => {
    expect(pageSource).toMatch(/Digital asset education/);
    expect(pageSource).toMatch(/Market intelligence/);
    expect(pageSource).toMatch(/Exchange connection/);
    expect(pageSource).toMatch(/Crypto signal service/);
    expect(pageSource).toMatch(/VITE_CRYPTO_SERVICE_URL/);
    expect(pageSource).toMatch(/Submit for review/);
  });

  it('never requests crypto secrets in IWW', () => {
    expect(pageSource).toMatch(/Never submit wallet recovery phrases, private keys or exchange secrets/);
    expect(migration).toContain('private keys and wallet recovery phrases must never be stored here');
  });

  it('forces tenant RLS and KYC-gated staff approval', () => {
    expect(migration).toContain('alter table public.crypto_service_requests force row level security');
    expect(migration).toContain("private.has_org_role(organization_id, array['owner','admin','operations_manager']");
    expect(migration).toContain("k.status = 'approved'");
    expect(migration).toContain('approved kyc is required before crypto services activation');
    expect(hardening).toContain('create policy crypto_service_requests_update');
    expect(hardening).toContain('requester_id <> (select auth.uid())');
  });

  it('prevents browser deletion and records governed changes', () => {
    expect(migration).toContain('revoke delete on public.crypto_service_requests from authenticated, anon');
    expect(migration).toContain('audit_crypto_service_requests_change');
    expect(migration).toContain('private.capture_governed_change()');
  });
});

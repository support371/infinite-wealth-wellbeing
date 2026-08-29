import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const routes = readFileSync(new URL('../src/AppRoutes.jsx', import.meta.url), 'utf8');
const shell = readFileSync(new URL('../src/app/AppShell.jsx', import.meta.url), 'utf8');
const connections = readFileSync(new URL('../src/app/ConnectedServicesPage.jsx', import.meta.url), 'utf8');
const onboarding = readFileSync(new URL('../src/auth/OnboardingPage.jsx', import.meta.url), 'utf8');

describe('GEM-managed IWW product boundary', () => {
  it('routes tenant integrations to scoped connections instead of the catalog marketplace', () => {
    expect(routes).toContain("import('./app/ConnectedServicesPage')");
    expect(routes).not.toContain("import('./app/IntegrationMarketplacePage')");
    expect(connections).toContain(".from('integration_connections')");
    expect(connections).not.toContain(".from('integration_catalog')");
  });

  it('keeps a clear route back to GEM Workspace OS', () => {
    expect(shell).toContain('VITE_GEM_WORKSPACE_URL');
    expect(shell).toContain('GEM Workspace OS');
    expect(shell).toContain('Connected services');
  });

  it('captures the managed engagement during owner onboarding', () => {
    expect(onboarding).toContain('engagementType');
    expect(onboarding).toContain('managementMode');
    expect(onboarding).toContain('Register your managed organization');
  });

  it('uses dedicated operational pages for people and appointments', () => {
    expect(routes).toContain("import('./app/MemberDirectoryPage')");
    expect(routes).toContain("import('./app/AppointmentsPage')");
    expect(routes).toContain('<Route path="appointments" element={<AppointmentsPage/>}/>');
    expect(routes).toContain('<Route path="team" element={<MemberDirectoryPage/>}/>');
  });
});

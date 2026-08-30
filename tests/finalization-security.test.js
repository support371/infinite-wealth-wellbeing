import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(new URL('../supabase/migrations/20260830180232_finalize_scheduling_and_integrations.sql', import.meta.url), 'utf8').toLowerCase();
const api = readFileSync(new URL('../services/api/src/index.js', import.meta.url), 'utf8');
const marketplace = readFileSync(new URL('../src/app/IntegrationMarketplacePage.jsx', import.meta.url), 'utf8');

describe('pre-production finalization boundaries', () => {
  it('protects availability and the reminder queue with forced RLS', () => {
    expect(migration).toContain('alter table public.availability_rules force row level security');
    expect(migration).toContain('alter table public.appointment_reminders force row level security');
    expect(migration).not.toContain('appointment_reminders_insert');
  });

  it('validates host windows and appointment overlap in the database', () => {
    expect(migration).toContain('create trigger validate_appointment_schedule');
    expect(migration).toContain('requested time is outside the host availability');
    expect(migration).toContain("tstzrange(a.starts_at, a.ends_at, '[)')");
  });

  it('routes connector mutations through the authenticated API', () => {
    expect(api).toContain("requirePermission('integration.manage')");
    expect(api).toContain("/integrations/:provider/request");
    expect(api).toContain("/integrations/:provider/revoke");
    expect(marketplace).toContain('apiRequest(`/integrations/${app.provider_key}/request`');
    expect(marketplace).not.toContain("from('integration_connections').upsert");
  });
});

# IWW Supabase / Postgres activation

## Current status

The migration in `supabase/migrations/20260809060000_iww_production_core.sql` is **prepared but not applied**.

Two existing healthy Supabase projects were inspected read-only during production completion. Their public schemas identify them as GEM/GemAssist systems, not as an Infinite Wealth & Well-being data store. This migration must not be applied to either project merely because capacity already exists there.

## Activation rule

Apply the migration only after one of these is true:

1. a dedicated IWW Supabase project is created, or
2. an existing project is explicitly approved as the IWW data boundary after ownership, backup, retention, security, and workload review.

## Intended trust model

- Public forms call server-side API functions; browser clients do not insert directly into intake/audit tables.
- `anon` receives no access to IWW core tables.
- Authenticated users may read their own linked profile/submission/membership rows where policies allow it.
- Staff role checks are performed through controlled RLS helpers.
- Role grants, submission mutation, audit writes, idempotency writes, notification writes, and intake creation remain server/service-role operations in v1.
- Service-role keys must exist only in protected server runtime configuration and must never be bundled into the browser.

## Before applying

- Confirm project ownership and legal/data boundary.
- Confirm production region and data-residency requirements.
- Configure backups and recovery expectations.
- Decide retention/deletion rules for inquiry, membership, consent, audit, and notification data.
- Verify the migration in a non-production project first.
- Run Supabase database/security advisors after migration.
- Seed the initial admin role through a controlled server/SQL operation; do not create a public self-service admin grant path.

## Required application environment after activation

The current webhook API remains independent of the migration. A later persistence adapter should use protected server-side values such as:

- `IWW_SUPABASE_URL`
- `IWW_SUPABASE_SERVICE_ROLE_KEY`

Do not add these values to Vite `VITE_*` variables or any other client-visible configuration.

## Verification

At minimum confirm:

- every IWW public table has RLS enabled;
- `anon` has no core-table privileges;
- authenticated access matches the documented policies;
- staff helper functions cannot be altered/called through an exposed unsafe path;
- role tables cannot be written by ordinary authenticated clients;
- service-role writes create the expected consent/status/audit records;
- backup and restore procedures have been exercised.

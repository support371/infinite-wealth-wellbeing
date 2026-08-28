# IWW Production Implementation Status

## Isolation boundary

- Repository: `support371/infinite-wealth-wellbeing`
- Supabase target: `fepfnzrpftxpxlgyujev`
- Vercel target: `infinite-wealth-wellbeing` (`prj_jGTfkgIDvRud6bGaDgCuZPlSCy1S`)
- No GEM database, session, user, source or deployment dependency is used.

## Implemented

- Supabase password auth, PKCE recovery, session restoration, sign-out and protected routes.
- Profile and organization onboarding with owner membership creation.
- Owner, admin, operations manager, advisor, practitioner, member and family delegate authorization.
- Responsive SaaS shell with organization context, role-aware navigation, command search, notification badge and account menu.
- Supabase-backed wealth, wellbeing, programmes, appointments, documents, messages, tasks, resources, community, team, governance, reporting, integration-reference and billing-reference modules.
- Server-authoritative bearer-token verification and active-membership lookup for privileged API routes.
- Complete IWW schema, explicit Data API grants, RLS/forced RLS, care assignments, scoped family delegation, participant-only messages, explicit document permissions and private document storage.
- Append-only audit events plus database-level capture for governed changes.
- Loading, empty, validation, error, retry and permission-denied states.
- Security headers, deterministic lockfile, tests, lint, build and secret scan.

## Environment variable contract

Public browser values:

- `VITE_APP_NAME`
- `VITE_APP_URL`
- `VITE_API_BASE_URL`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Server-only values:

- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY`
- `APP_ORIGINS`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `HUBSPOT_ACCESS_TOKEN`
- `CALENDAR_CLIENT_ID`
- `CALENDAR_CLIENT_SECRET`
- `EMAIL_PROVIDER_API_KEY`
- `MEDIA_STORAGE_BUCKET`

## External activation gate

The connected Supabase account does not currently expose project `fepfnzrpftxpxlgyujev`; it returns permission denied and lists only different project references. The migration must not be applied to any substitute project. Production auth/RLS smoke tests and security-advisor output remain blocked until the dedicated IWW project is reconnected or shared with the active Supabase connection.

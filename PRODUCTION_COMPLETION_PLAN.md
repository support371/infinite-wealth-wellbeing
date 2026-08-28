# Infinite Wealth & Well-being — Production Completion Plan

## Current verified position

The release candidate now defaults to safe, evidence-gated public surfaces. Operational launch remains blocked until the required external data, identity, workflow, policy, claim-review, and verification dependencies are real.

The repository also contains a machine-readable source of truth at `config/release-gates.json`. Use:

```bash
npm run release:status
npm run release:strict
```

`release:strict` is expected to fail until every required P0 gate is genuinely launch-clear.

## Implemented or prepared in `feat/production-completion`

### Safe public surface

- Unreviewed legacy SPA routes fail safely to `prelaunch.html`.
- `/contact` is a dedicated operational intake surface.
- `/membership/apply` is a dedicated membership-interest application surface with no payment or automatic provisioning.
- `/donate` is a payment-disabled status gate; it collects no card/bank data.
- `/trust-center` reports implemented controls and unresolved launch blockers instead of displaying unpublished policy/credential claims as complete.
- Legacy `index.html` is marked pre-launch and direct indexing is restricted by deployment headers.

### Public intake security and correctness

- Shared frontend/backend contracts for contact subjects, membership tiers, interests, and field limits.
- Input normalization and server-side validation.
- Explicit consent requirement.
- Sensitive-data warning on public forms.
- Honeypot abuse signal.
- Browser-origin enforcement.
- Mandatory bounded `Idempotency-Key` for valid public submissions.
- Client retains the same idempotency key across unchanged retries and rotates it when form content changes.
- No-store API responses and defensive browser headers.

### Durable persistence architecture

Prepared but **not applied**:

- `supabase/migrations/20260809060000_iww_production_core.sql`
- `supabase/migrations/20260809061000_iww_atomic_intake.sql`

The prepared data model includes:

- user profiles and controlled staff roles;
- inquiries;
- membership applications;
- explicit consent records;
- submission status history;
- memberships;
- notification-delivery history;
- idempotency records;
- audit events;
- indexes, updated-at triggers, RLS, and service-role boundaries.

Atomic service-role intake RPCs claim an idempotency key before creating the submission, write consent/status/audit evidence in the same transaction, return a stable database-generated reference, and reject reuse of the same key for different content.

The server adapter in `api/_lib/persistence.js` is prepared to call those RPCs only through protected server-side Supabase credentials.

### Persist-first workflow semantics

Once a dedicated IWW database is activated, public intake follows:

1. validate and normalize the request;
2. require idempotency key;
3. atomically persist the submission, consent, initial status, and audit evidence;
4. check whether a successful staff webhook has already been recorded;
5. send the signed staff workflow only when needed;
6. record notification success/failure;
7. return the durable database reference.

A staff webhook outage does **not** erase a successfully stored submission. The API returns the durable reference and marks staff notification as degraded. A retry will not resend a webhook already recorded as successful.

### Runtime readiness contract

`/api/health` reports `ready` only when all of the following protected configuration is present:

- `PUBLIC_APP_ORIGIN`
- `INQUIRY_WEBHOOK_URL`
- `MEMBERSHIP_WEBHOOK_URL`
- `WORKFLOW_WEBHOOK_SECRET`
- `IWW_SUPABASE_URL`
- `IWW_SUPABASE_SERVICE_ROLE_KEY`

This is configuration readiness only; it does not replace migration, live-delivery, backup, policy, claim, accessibility, or end-to-end evidence.

### Automated regression coverage

`npm run test:production` covers:

- public validation and honeypot behavior;
- origin restrictions;
- health readiness semantics;
- persistence configuration and server-only credential usage;
- request hashing and idempotency errors;
- persist-first workflow ordering;
- successful-notification deduplication;
- shared frontend/backend contracts;
- safe release routing;
- donation/trust/prelaunch gates;
- RLS/anonymous-access invariants;
- atomic intake RPC permissions and idempotency behavior;
- machine-readable release-gate discipline.

Vercel is configured to run production tests before the Vite build.

## Confirmed external or architectural blockers

### 1. Dedicated IWW data and identity boundary

A dedicated IWW Supabase project has not been selected. Existing healthy connected Supabase projects were inspected read-only and contain GEM/GemAssist schemas, so this branch intentionally does **not** mix IWW applicant/member records into them.

Required before activation:

- create or explicitly approve the production IWW database/auth project;
- apply migrations in a non-production test project first, then production;
- run database/security advisors;
- seed initial admin role through a controlled server/SQL action;
- configure auth and role lifecycle;
- establish backup, restore, retention, deletion, and recovery procedures;
- verify RLS and service-role behavior with live integration tests.

### 2. Staff workflow configuration

Protected webhook endpoints and signing secret must be configured and live delivery verified. Durable intake may survive a notification outage once the database exists, but production health remains degraded until staff-delivery configuration is complete.

### 3. Authenticated administrative review

The database model is prepared for reviewer/admin roles and assignment/status history, but the authenticated staff review application remains blocked on the approved IWW auth/database boundary.

### 4. Policy, legal, credential, and public-claim review

The following must be authored/reviewed and approved before they are represented as complete:

- Privacy Policy and retention/deletion notice;
- Terms of Use;
- Membership Agreement;
- Refund/Cancellation Policy;
- medical/well-being disclaimer;
- financial-information/advisory disclaimer;
- credential and practitioner verification;
- testimonial authorization/substantiation;
- numerical impact substantiation;
- ministry/tax/PHA statements;
- fiduciary/advisory claims and service promises.

`PUBLIC_CLAIM_AUDIT.md` defines the evidence gates. Unreviewed legacy routes remain behind the pre-launch fallback.

### 5. Payments and donations

Charging is intentionally disabled and is not required for the initial non-payment release candidate. Before later activation:

- hosted/tokenized provider selection;
- approved prices/donation treatment;
- signed/idempotent payment webhooks;
- receipt and reconciliation records;
- refund/cancellation handling;
- verified tax/receipt language.

Raw card data must never be accepted or stored by this application.

### 6. Transactional email

Provider, verified sender domain, templates, delivery/retry behavior, and audit linkage remain unresolved. The data model already has notification-delivery history for the eventual implementation.

### 7. CI/deployment infrastructure

GitHub Actions has been failing at the runner/job level without useful step logs. Recent Vercel production-branch previews have also been blocked by provider build-rate limits. These are tracked as infrastructure blockers rather than treated as proof that the application code failed.

## Remaining P0 launch work

1. Select/create the dedicated IWW database/authentication project.
2. Apply and verify the prepared migrations outside production, then in production.
3. Connect the persist-first API adapter to the live IWW database and run integration tests.
4. Configure signed staff workflows and verify real delivery/retry history.
5. Build the authenticated reviewer/admin queue on the approved auth boundary.
6. Publish reviewed legal/policy/disclaimer surfaces.
7. Resolve the public-claim evidence gates and re-enable legacy routes one domain at a time.
8. Add transactional email with verified sender identity and delivery audit.
9. Exercise backup/restore/retention/deletion procedures.
10. Complete live accessibility, mobile, route, performance, security, and end-to-end journey verification.
11. Restore reliable CI/deployment evidence.
12. Run `npm run release:strict` and require zero uncleared required gates before production launch.

## P1 — complete platform experience

- Member dashboard and profile management.
- Membership tier provisioning and subscription status.
- Program registration and capacity controls.
- Appointment/practitioner booking only after credentials, scope, consent, and safeguarding processes are verified.
- Resource publishing workflow and content review.
- Analytics with appropriate privacy/consent controls.
- Custom production domain, verified sender domain, sitemap, robots.txt, canonical URLs, and social-preview assets.
- Hosted/tokenized payment and donation checkout after approval.

## Verification commands

```bash
npm run test:production
npm run build
npm run release:status
npm run release:strict
```

## Release rule

The project is not launch-ready merely because code exists. Required gates clear only when the code, provider configuration, policy/claim review, live behavior, and operational evidence all agree. Missing evidence remains a blocker rather than becoming a public promise.

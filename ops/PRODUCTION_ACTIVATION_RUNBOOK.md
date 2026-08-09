# IWW Production Activation Runbook

## Rule

Do not activate against the connected GEM/GemAssist databases. Activation begins only after a dedicated or explicitly approved IWW Supabase project exists.

Do not merge or release because the UI looks complete. Each phase below requires evidence.

## Phase 1 — Establish the IWW data boundary

1. Create/select the dedicated IWW Supabase project.
2. Record project owner, region, environment, and responsible operators.
3. Configure backup/recovery capability before storing live applicant/member data.
4. Confirm that the project is not shared with an unrelated GEM/GemAssist workload unless that sharing has been explicitly approved.

**Evidence:** project identifier, owner, region, backup configuration, approval record.

## Phase 2 — Apply the prepared migrations in order

Apply in a non-production IWW environment first:

1. `20260809060000_iww_production_core.sql`
2. `20260809061000_iww_atomic_intake.sql`
3. `20260809062000_iww_staff_review.sql`
4. `20260809063000_iww_idempotency_maintenance.sql`
5. `20260809064000_iww_notification_outbox.sql`
6. `20260809065000_iww_outbox_delivery_guard.sql`
7. `20260809066000_iww_staff_role_management.sql`

Then verify:

- all IWW tables exist;
- RLS is enabled on exposed public-schema tables;
- `anon` cannot read/write IWW core tables;
- ordinary authenticated users cannot mutate roles/audit/idempotency/outbox data;
- service-role-only RPCs reject browser roles;
- atomic intake returns a stable reference and writes consent/status/audit evidence;
- idempotency replay returns the same acknowledgement;
- same key + changed content is rejected;
- staff status transition state machine rejects invalid jumps;
- outbox claim uses concurrency-safe locking;
- delivered outbox state requires successful delivery evidence.

Run database/security advisors after migration and resolve findings before proceeding.

**Evidence:** migration history, advisor output, verification queries/tests.

## Phase 3 — Create Auth users and bootstrap staff governance

1. Create the first authorized administrator in the dedicated IWW Auth project through a controlled administrative process.
2. Execute `iww_bootstrap_admin(user_id)` once using the protected service/admin path.
3. Verify a second bootstrap attempt is rejected.
4. Add at least one additional admin before testing admin revocation.
5. Grant reviewer roles through the admin-only role-management flow.
6. Verify the last active admin cannot be revoked.
7. Verify ordinary authenticated users receive 403 from staff APIs.

There is no public admin/reviewer self-registration path.

**Evidence:** Auth user IDs, role rows, role audit events, negative-access tests.

## Phase 4 — Configure runtime boundaries

Use `ops/PRODUCTION_ENVIRONMENT.md` as the source of truth.

Server/runtime:

- `PUBLIC_APP_ORIGIN`
- `IWW_SUPABASE_URL`
- `IWW_SUPABASE_SERVICE_ROLE_KEY`
- `INQUIRY_WEBHOOK_URL`
- `MEMBERSHIP_WEBHOOK_URL`
- `WORKFLOW_WEBHOOK_SECRET`
- `IWW_NOTIFICATION_WORKER_SECRET`

Browser-safe staff build:

- `VITE_IWW_SUPABASE_URL`
- `VITE_IWW_SUPABASE_PUBLISHABLE_KEY`

Verify no protected value is present in the client bundle.

**Evidence:** environment inventory without secret values, bundle secret scan, origin test.

## Phase 5 — Configure staff workflow destinations

1. Configure inquiry and membership webhook destinations.
2. Configure the matching webhook signing secret at both sender and receiver.
3. Reject unsigned and incorrectly signed requests at the receiving workflow.
4. Send one controlled test of each event type.
5. Verify the reference/submission ID received by staff matches the durable database record.

**Evidence:** successful signed test, receiver log/reference match.

## Phase 6 — Activate the durable outbox worker

The protected worker endpoint is:

`POST /api/internal/notification-worker`

Authentication:

`Authorization: Bearer <IWW_NOTIFICATION_WORKER_SECRET>`

Use an approved scheduler with a cadence appropriate to the staff-notification SLA. Do not expose the secret in the URL.

Worker behavior:

- atomically claims a bounded batch;
- recovers stale processing locks;
- skips already-successful deliveries;
- reconstructs the notification from durable data;
- records every delivery attempt;
- retries with bounded exponential backoff;
- dead-letters after repeated failure;
- cannot mark delivered without durable successful-delivery evidence.

**Evidence:** scheduler configuration, successful worker invocation, retry/dead-letter drill.

## Phase 7 — Run deep readiness

Protected endpoint:

`GET /api/internal/readiness`

Use the worker/internal bearer secret.

The probe verifies both protected configuration and live access to required IWW tables including intake, roles, audit, and notification outbox.

A 200 response is necessary but not sufficient for launch.

**Evidence:** saved readiness response with timestamp, secrets removed.

## Phase 8 — Execute public-intake failure drills

### Normal inquiry

- submit `/contact`;
- verify durable reference;
- verify inquiry row;
- verify two consent records;
- verify initial status event;
- verify audit event;
- verify staff notification record.

### Exact retry

- replay the same payload with the same idempotency key;
- confirm same durable reference;
- confirm no duplicate submission;
- confirm no duplicate successful staff webhook.

### Changed-content retry

- reuse the key with changed content;
- confirm conflict/rejection.

### Workflow outage

- temporarily make the workflow unavailable in a controlled non-production environment;
- submit a valid request;
- confirm the request is accepted only after durable persistence;
- confirm notification is degraded/queued;
- restore workflow;
- run worker;
- confirm eventual delivery and evidence history.

### Membership application

Repeat equivalent checks for `/membership/apply`; verify no payment/subscription activation occurs.

**Evidence:** references, row counts, status/audit/delivery history, screenshots/logs where appropriate.

## Phase 9 — Exercise staff review

1. Sign in as reviewer.
2. Confirm queue visibility.
3. Move `received → triaged → in_review → approved/rejected/closed` only through allowed transitions.
4. Attempt an invalid jump and verify conflict.
5. Inspect status/audit/notification history.
6. Verify reviewer cannot manage staff roles.
7. Sign in as admin and verify role-management permissions.

**Evidence:** transition audit history and negative-access tests.

## Phase 10 — Backup, restore, retention, and deletion

Before live data:

- approve the retention/deletion policy;
- configure provider backup/recovery;
- restore a non-production backup and verify IWW tables/RLS/functions;
- define deletion/anonymization rules for inquiries, applications, consent, audit, and memberships;
- do not delete audit or consent evidence merely to simplify implementation without policy review.

The only automated deletion currently prepared is expired idempotency-key cleanup, because those rows carry an explicit `expires_at`.

**Evidence:** approved policy, restore drill, recovery time/result, deletion test.

## Phase 11 — Policy and public-claim release

Use `PUBLIC_CLAIM_AUDIT.md`.

Do not re-enable legacy health, financial/advisory, ministry/tax/PHA, credential, testimonial, impact-metric, pricing, or service-promise routes until each claim has evidence and applicable review.

Re-enable public domains one at a time; do not globally remove the pre-launch gate.

**Evidence:** claim inventory, substantiation, reviewer/owner, route approval.

## Phase 12 — Final technical evidence

Complete:

- all repository tests;
- production build;
- live route smoke tests;
- mobile layout checks;
- keyboard/screen-reader/accessibility review;
- performance review;
- security review;
- origin/auth/role negative tests;
- backup/recovery evidence;
- provider CI/deployment evidence.

Run:

```bash
npm run release:status
npm run release:strict
```

Do not launch while `release:strict` has required blockers.

## Phase 13 — Release decision

Release only when:

- required machine-readable gates are `implemented` or `verified`;
- protected production configuration exists;
- durable persistence and staff operations are live-tested;
- policy/claim release is approved;
- monitoring/recovery ownership is assigned;
- production deploy evidence is saved.

Keep payments disabled unless the separate payment gate is later approved and verified.

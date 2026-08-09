# Infinite Wealth & Well-being — Production Completion Plan

## Current verified position

The public presentation layer is substantially built, but operational launch remains gated. This branch now separates features that can be safely implemented without external infrastructure from features that require verified providers, dedicated data ownership, policy review, or credentials.

### Completed in `feat/production-completion`

- Production build workflow and serverless API structure.
- `/api/health` readiness endpoint.
- Validated inquiry and membership application endpoints.
- Shared frontend/backend contracts for contact subjects, membership tiers, interests, and field limits.
- Mandatory signed webhook forwarding; unsigned workflow delivery fails closed.
- Browser-origin enforcement for public form POSTs.
- Honeypot abuse signal, input normalization, bounded fields, safe failure responses, and no-store API responses.
- Operational `/contact` entrypoint with consent, validation states, staff-workflow failure handling, and submission references.
- Operational `/membership/apply` entrypoint that explicitly does not charge or provision paid membership.
- `/donate` production gate that collects no payment data until hosted/tokenized checkout and receipt treatment are verified.
- Evidence-based `/trust-center` production gate that distinguishes implemented controls from unpublished/unverified policies and claims.
- Production API regression tests covering validation, signed delivery, degraded/ready health, honeypot behavior, origin policy, and shared contracts.
- Vercel build command configured to run production API tests before building.

## Confirmed external or architectural blockers

### Dedicated data and identity

A dedicated IWW persistence/authentication project has not been selected. Existing healthy Supabase projects were inspected read-only and contain GEM/GemAssist schemas rather than an identifiable IWW schema, so this branch intentionally does not mix IWW applicant/member records into them.

Required before durable operational intake:

- Dedicated managed database or an explicitly approved existing project.
- Migrations for inquiries, membership applications, consent records, status history, programs, payments, and audit events.
- Authentication and role-based authorization for members, administrators, reviewers, and approved practitioners.
- Row-level access controls and security-advisor review.
- Backup, retention, deletion, and recovery rules.

### Workflow environment configuration

The implemented inquiry and membership endpoints require protected runtime configuration:

- `PUBLIC_APP_ORIGIN`
- `INQUIRY_WEBHOOK_URL`
- `MEMBERSHIP_WEBHOOK_URL`
- `WORKFLOW_WEBHOOK_SECRET`

Until those exist in the target environment, forms fail closed rather than pretending delivery occurred.

### Payments and donations

No charging is enabled. Required before activation:

- Hosted/tokenized payment provider selection.
- Verified price/donation configuration.
- Signed and idempotent webhook handling.
- Receipt/reconciliation records.
- Refund/cancellation handling.
- Verified tax/receipt language.

Raw card data must never be accepted or stored by this application.

### Policy, legal, credential, and public-claim review

The following must be authored/reviewed and published before they are represented as complete:

- Privacy Policy and data-retention/deletion notice.
- Terms of Use.
- Membership Agreement.
- Refund/Cancellation Policy.
- Medical/well-being disclaimer.
- Financial-information/advisory disclaimer.
- Credential and practitioner verification.
- Testimonial and numerical impact substantiation.
- Ministry/tax-status statements.
- Fiduciary/advisory statements and service promises.

The production Trust Center now reports these as blocked rather than displaying placeholder documents as completed evidence.

## Remaining P0 launch work

1. Select and connect dedicated production database/authentication.
2. Replace webhook-only intake with durable persistence plus auditable delivery/status history.
3. Configure protected workflow environment variables and verify live staff delivery.
4. Build authenticated administrative review queues for inquiries and applications.
5. Publish reviewed legal/policy/disclaimer surfaces.
6. Complete evidence review of public health, financial, credential, tax/ministry, testimonial, and impact claims.
7. Select and integrate hosted/tokenized payments only after policy and pricing approval.
8. Add production transactional email and auditable notification records.
9. Complete accessibility, route, mobile, performance, security, backup/recovery, and end-to-end journey testing.
10. Produce a signed release checklist with evidence for every P0 gate.

## P1 — complete platform experience

- Member dashboard and profile management.
- Membership tier provisioning and subscription status.
- Program registration and capacity controls.
- Appointment/practitioner booking only after credentials, scope, consent, and safeguarding processes are verified.
- Resource publishing workflow and content review.
- WCAG review and assistive-technology testing.
- Analytics with appropriate privacy/consent controls.
- Custom production domain, verified sender domain, sitemap, robots.txt, canonical URLs, and social-preview assets.

## Verification commands

```bash
npm run test:production
npm run build
```

Vercel is configured to execute both through its build gate.

## Release rule

The platform may remain viewable while completion work continues, but it must not be represented as a fully operational membership, donation, advisory, healthcare, or ministry-services platform until every applicable P0 gate is implemented and verified with evidence.

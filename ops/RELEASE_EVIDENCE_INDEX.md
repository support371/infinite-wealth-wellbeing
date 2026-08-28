# IWW Production Release Evidence Index

This index maps each required launch domain to the source artifacts and the **live evidence still required** before the gate can be marked verified.

Code or documentation alone is not launch evidence when a provider, legal/policy decision, or live operational drill is required.

## 1. Safe public routing

Repository evidence:

- `vercel.json`
- `prelaunch.html`
- `trust-center.html`
- `donate.html`
- `api/release-config.test.js`

Live evidence:

- deployed route smoke test proving unreviewed legacy routes resolve to the pre-launch shell;
- noindex/noarchive verification for legacy/admin surfaces.

## 2. Public intake validation and durable acceptance

Repository evidence:

- `api/inquiries.js`
- `api/membership-applications.js`
- `shared/submission-contracts.js`
- `src/production/submission.jsx`
- `server/persistence.js`
- `20260809061000_iww_atomic_intake.sql`
- `api/production.test.js`
- `api/persistence.test.js`

Live evidence:

- controlled inquiry and membership submissions;
- stable DB references;
- consent/status/audit rows;
- exact-retry stable response;
- changed-content idempotency conflict.

## 3. Dedicated IWW database/Auth boundary

Repository evidence:

- `supabase/MIGRATION_ORDER.md`
- `supabase/migrations/*`
- `supabase/README.md`
- `ops/PRODUCTION_ACTIVATION_RUNBOOK.md`

Live evidence:

- dedicated/approved project ID, owner, region;
- migration history for the complete ordered set;
- RLS/privilege advisor evidence;
- confirmation that no GEM/GemAssist database is used for IWW applicant/member records.

## 4. Staff workflow notification reliability

Repository evidence:

- `api/internal/notification-worker.js`
- `20260809064000_iww_notification_outbox.sql`
- `20260809065000_iww_outbox_delivery_guard.sql`
- `api/worker.test.js`
- `api/outbox-evidence.test.js`

Live evidence:

- signed receiver negative/positive tests;
- scheduled worker invocation;
- failure/retry/dead-letter drill;
- durable successful-delivery record and actual retry attempt evidence.

## 5. Transactional email

Repository evidence:

- `20260809069000_iww_transactional_email_outbox.sql`
- `server/email-adapter.js`
- `api/internal/email-worker.js`
- `api/email-worker.test.js`
- `ops/TRANSACTIONAL_EMAIL_CONTRACT.md`

Live evidence:

- verified sender domain/address;
- approved template versions;
- signed adapter rejection/acceptance tests;
- stable adapter idempotency-key behavior;
- successful controlled delivery with provider message ID;
- provider outage/retry/dead-letter drill;
- adapter-success/ledger-failure drill proving no false completion.

## 6. Staff authentication, MFA, roles, and review governance

Repository evidence:

- `server/staff-auth.js`
- `src/admin/StaffMfaGate.jsx`
- `src/admin/AdminApp.jsx`
- `src/admin/HistoryApp.jsx`
- `api/admin/submissions.js`
- `api/admin/history.js`
- `api/admin/staff.js`
- `20260809066000_iww_staff_role_management.sql`
- `20260809067000_iww_staff_role_evidence_guard.sql`
- `20260809071000_iww_terminal_review_reason_guard.sql`
- `20260809072000_iww_staff_mfa_guard.sql`
- `20260809073000_iww_operational_mfa_integrity.sql`
- `20260809074000_iww_staff_access_state.sql`
- `api/admin.test.js`
- `api/history.test.js`
- `api/staff-management.test.js`
- `api/staff-mfa.test.js`
- `api/review-reason-guard.test.js`
- `ops/STAFF_MFA_RUNBOOK.md`

Live evidence:

- TOTP enabled in dedicated Auth project;
- first admin verified factor before bootstrap;
- AAL1 negative and AAL2 positive API tests;
- role grant denied without verified MFA;
- reviewer/admin positive/negative authorization tests;
- last-admin protection;
- terminal-decision rationale evidence;
- factor-loss/recovery drill;
- restored privileged-role MFA integrity check.

## 7. Operational readiness and monitoring

Repository evidence:

- `api/internal/readiness.js`
- `20260809070000_iww_operational_snapshot.sql`
- `20260809073000_iww_operational_mfa_integrity.sql`
- `api/readiness.test.js`
- `api/operational-snapshot.test.js`
- `api/operational-mfa-integrity.test.js`

Live evidence:

- protected readiness 200 in the activated environment;
- zero unexplained dead-letter work;
- zero stale processing locks;
- operational snapshot contains aggregate/non-PII data only;
- readiness degrades during controlled dead-letter/stuck/MFA-integrity drills.

## 8. Abuse protection

Repository evidence:

- public input bounds/honeypot/origin controls;
- `20260809068000_iww_intake_throttle.sql`
- `api/intake-throttle.test.js`
- `api/origin-contracts.test.js`

Live evidence:

- provider edge/WAF rate limiting;
- abuse/load testing;
- 4xx/5xx/intake-volume monitoring;
- spend/usage safeguards where applicable.

## 9. Backup, restore, retention, and deletion

Repository evidence:

- `ops/BACKUP_RECOVERY_RUNBOOK.md`
- `supabase/verification/restore_acceptance.sql`
- `api/recovery-contract.test.js`
- `api/recovery-mfa.test.js`

Live evidence:

- approved RPO/RTO/retention decisions;
- provider backup/PITR configuration;
- isolated restore drill;
- restore acceptance output;
- observed recovery point/time;
- zero active privileged roles without verified MFA after restore.

## 10. Incident response

Repository evidence:

- `ops/INCIDENT_RESPONSE_RUNBOOK.md`
- `SECURITY_THREAT_MODEL.md`
- `api/incident-response-contract.test.js`

Live evidence:

- named incident owner/escalation contacts;
- secret-rotation drill with old-key rejection;
- staff/MFA containment drill;
- delivery dead-letter/stuck recovery drill;
- unsafe-public-claim takedown drill;
- legal/privacy escalation path confirmed for actual entity/jurisdictions/contracts.

## 11. Legal, privacy, agreements, disclaimers, and public claims

Repository evidence:

- `PUBLIC_CLAIM_AUDIT.md`
- `trust-center.html`
- pre-launch routing gate.

Still externally required:

- reviewed Privacy Policy;
- Terms of Use;
- Membership Agreement;
- Refund/Cancellation Policy where applicable;
- medical/well-being and financial/advisory disclaimers;
- entity/ministry/tax status evidence;
- practitioner/credential evidence;
- testimonial/impact-metric substantiation;
- claim-by-claim approval before route re-enable.

## 12. Payments

Current state:

- intentionally disabled;
- not required for the initial non-payment release candidate.

Repository evidence:

- `donate.html` safe gate;
- release tests proving no raw payment collection.

A later payment release requires a separate provider, hosted/tokenized checkout, price/donation treatment, signed webhooks, idempotency, receipts/reconciliation, refund/cancellation, and tax-language review.

## 13. Dependency/build/deployment reproducibility

Repository evidence:

- `.github/workflows/production-completion-ci.yml`
- `vercel.json`
- `api/function-budget.test.js`
- source function budget below the Hobby ceiling.

Still required:

- fresh successful Vercel deployment proving provider-side function counting;
- functioning GitHub CI jobs with step-level evidence;
- deterministic dependency resolution/lockfile evidence rather than floating `latest` dependencies;
- saved production build/deploy identifiers.

## 14. Accessibility, mobile, performance, and end-to-end release validation

Repository evidence:

- contract/unit tests and defensive entrypoint design.

Live/manual evidence still required:

- keyboard-only review;
- screen-reader review;
- focus/label/error-state verification;
- mobile/responsive route review;
- performance and runtime error review;
- public-intake, staff-review, MFA, worker, recovery, and incident journeys end to end.

## Final release record

Before launch, archive:

1. `npm run test:production` output;
2. `npm run build` output;
3. `npm run release:status` and successful `npm run release:strict` output;
4. provider deployment identifiers;
5. database migration/advisor/restore evidence;
6. worker/email delivery drills;
7. staff Auth/MFA/role evidence;
8. incident-response drill evidence;
9. policy/claim approvals;
10. accessibility/mobile/performance/E2E evidence.

A gate is not verified because a file exists. It is verified only when the applicable code **and** real environment/provider/policy evidence agree.

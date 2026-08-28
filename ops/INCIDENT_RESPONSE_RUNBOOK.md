# IWW Incident Response Runbook

This runbook defines technical incident handling for the IWW release candidate. It does not invent statutory notification deadlines, contractual response SLAs, or regulator-specific obligations. Applicable legal/privacy notification duties must be determined from the actual entity, affected data, jurisdiction, contracts, and approved policy at incident time.

## Incident categories

### Critical integrity or access incident

Examples:

- suspected Supabase service-role or worker/signing-secret exposure;
- unauthorized reviewer/admin access;
- unexpected role grant/revocation;
- evidence that submission/audit/consent records were modified outside approved paths;
- public production environment connected to the wrong/shared database;
- confirmed exposure of applicant/member data.

### Critical availability/delivery incident

Examples:

- durable intake unavailable;
- dead-letter records in either staff-notification or email outbox;
- worker locks remain stuck beyond the database recovery window;
- dedicated database unavailable or restored from an uncertain point;
- deployment introduces broken public intake or admin review.

### Content/compliance incident

Examples:

- an unsubstantiated health, financial/advisory, ministry/tax, credential, testimonial, or impact claim becomes publicly reachable;
- payment collection becomes reachable before payment gate approval;
- an unapproved policy/template version is published or sent.

## Detection sources

Primary technical signals:

- protected `GET /api/internal/readiness`;
- `iww_operational_snapshot()` aggregate queue health;
- staff/email outbox dead-letter and stale-processing counts;
- notification delivery failure history;
- database audit/status/role evidence;
- Vercel deployment/build/runtime errors;
- Supabase Auth/database/security logs and advisors;
- workflow/email-adapter provider logs;
- user/staff reports.

Do not copy raw secrets, full inquiry/application content, medical information, payment data, or other unnecessary personal data into incident tickets or public chat channels.

## Initial response sequence

1. Record incident start time, detector, affected environment, incident owner, and known symptoms.
2. Preserve relevant immutable/provider logs and database audit evidence before destructive remediation where feasible.
3. Determine whether confidentiality, integrity, availability, public claims, or multiple dimensions are affected.
4. Contain the smallest boundary that prevents additional harm.
5. Rotate credentials immediately when exposure is plausible; do not wait for proof of misuse when a high-privilege secret is known exposed.
6. Keep an operator decision log with timestamps and evidence references. Do not paste secret values into the log.
7. Do not declare recovery solely because the UI loads. Use the technical recovery checks below.

## Containment playbooks

### Service-role or signing/worker secret exposure

- revoke/rotate the affected provider credential or application secret;
- verify the previous value is rejected;
- update protected runtime configuration only;
- redeploy/restart affected server functions as required by the provider;
- scan browser bundles/source history/log destinations for the exposed value;
- review database/provider access logs for suspicious use;
- rotate adjacent credentials if compromise scope is uncertain;
- preserve evidence of rotation and negative old-key test.

Never create a temporary `VITE_*` copy of a server secret as a workaround.

### Unauthorized staff/admin access

- disable/revoke the Auth identity/session through the dedicated IWW Auth provider;
- revoke active reviewer/admin role through controlled admin/service operations;
- preserve role audit events and Auth logs;
- inspect submission status changes and other actions attributable to the identity;
- confirm at least one authorized active admin remains before revocation operations;
- rotate related credentials if account compromise is suspected.

### Persistence or data-integrity failure

- stop or gate public writes if persistence acknowledgements cannot be trusted;
- pause outbound staff/email workers if they could amplify inconsistent/restored data;
- do not redirect writes into an unrelated GEM/GemAssist database;
- use the approved provider recovery path and `ops/BACKUP_RECOVERY_RUNBOOK.md` if restoration is required;
- run `supabase/verification/restore_acceptance.sql` before resuming external delivery;
- compare audit/status/consent evidence against the expected recovery point.

### Staff notification dead-letter/stuck work

- use protected readiness/operational snapshot to confirm affected queue;
- verify workflow destination/signing configuration;
- inspect delivery attempts without exposing payload unnecessarily;
- fix destination/configuration before manually replaying;
- invoke the protected notification worker and verify durable delivery evidence;
- do not manually mark an outbox row delivered to silence the alert.

### Transactional email dead-letter/stuck work

- verify sender/provider adapter health and signing configuration;
- verify approved template version mapping;
- preserve adapter/provider message IDs and failure codes;
- use the email worker after remediation;
- rely on the stable outbox idempotency key to prevent deliberate duplicate sends;
- never mark the email outbox delivered without the matching durable email delivery record.

### Unsafe public claim or policy exposure

- restore the route/content to the pre-launch/evidence-gated state;
- preserve the exact published version and exposure window for review;
- do not rewrite the evidence record to make the incident disappear;
- route substantiation/legal questions to the designated evidence/policy owner;
- re-enable only after the applicable release gate has evidence and approval.

### Accidental payment collection exposure

- disable the payment/donation interaction immediately;
- do not collect or copy raw card data during investigation;
- preserve provider-side transaction identifiers if any transaction actually occurred;
- determine refund/receipt/tax obligations through the approved payment/legal process;
- keep the payment gate blocked until the incident and provider controls are reviewed.

## Technical recovery checks

Before declaring a technical incident recovered where applicable:

- public intake either fails closed or writes to the dedicated IWW database with stable reference;
- `GET /api/internal/readiness` returns expected healthy state;
- both durable outboxes have zero stuck-processing and zero unexplained dead-letter items;
- service-role/worker/signing secrets pass new-key and old-key-negative checks after rotation;
- ordinary users cannot access staff APIs;
- reviewer/admin controls and last-admin guard still work;
- RLS/anon access checks remain intact;
- public routing still gates unreviewed claims;
- payment collection remains disabled unless separately approved;
- recovered/restored data passes the restore acceptance suite if restoration occurred.

A readiness 200 is supporting evidence, not the sole recovery decision.

## Evidence handling

Preserve only what is necessary for investigation and review:

- timestamps/request/deployment/provider identifiers;
- audit/status/role events;
- aggregate operational snapshot values;
- bounded delivery error codes and provider message IDs;
- configuration names and rotation events without secret values;
- relevant source/deployment commit identifiers.

Avoid duplicating submission content or personal data into incident artifacts when a stable submission/reference ID is sufficient.

## Communications and legal/privacy assessment

For any incident involving personal data, regulated/professional claims, payments, or contractual commitments:

- identify the entity/data/controller roles actually involved;
- identify jurisdictions and contracts actually applicable;
- obtain appropriate legal/privacy review for notification or preservation duties;
- do not invent statutory notification deadlines in engineering code/runbooks;
- do not make public statements about impact until the affected scope is supported by evidence.

## Closure and follow-up

Incident closure requires:

1. containment/recovery evidence;
2. documented root cause or clearly documented remaining uncertainty;
3. affected release gates updated if new work is required;
4. credentials rotated where required;
5. backlog/dead-letter cleanup evidenced, not manually hidden;
6. corrective test/control added when the failure could reasonably recur;
7. post-incident owner and follow-up items recorded;
8. any public/legal communication reviewed through the appropriate process.

If a fix changes architecture, data handling, claims, or provider boundaries, update the threat model, environment contract, activation runbook, and machine-readable release gates in the same change set.

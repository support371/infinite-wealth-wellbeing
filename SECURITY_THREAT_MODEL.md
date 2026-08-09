# Infinite Wealth & Well-being — Production Threat Model

## Scope

This threat model covers the release-candidate public intake, dedicated IWW persistence/auth boundary, staff review APIs, staff browser consoles, signed staff workflows, staff-notification and transactional-email outboxes, internal workers/readiness/maintenance, aggregate operational monitoring, and gated public content.

It does not claim that external providers or legal/compliance obligations are verified merely because code exists.

## Protected assets

Highest-sensitivity assets include:

- Supabase service-role key;
- staff workflow signing secret;
- notification/email worker secrets;
- email-delivery adapter signing secret and any provider credential behind that adapter;
- applicant/member contact information;
- inquiry/application content;
- consent evidence;
- staff Auth access tokens;
- reviewer/admin role assignments;
- submission status and audit history;
- notification/email delivery and outbox history;
- any future payment/provider secrets.

## Trust boundaries

### Public browser → public API

Public browser inputs are untrusted.

Controls:

- allowlisted field values and maximum lengths;
- server-side validation and normalization;
- explicit consent;
- honeypot field;
- exact browser-origin restriction;
- mandatory bounded idempotency key;
- database-level repeated-email throttle;
- no raw payment-card collection;
- sensitive-data warning;
- no-store responses.

Important limitation: CORS/origin restrictions are browser controls, not server-client authentication. A direct attacker can omit `Origin`. Database throttling reduces repeated-address abuse but does not replace provider edge/WAF controls against distributed attacks.

### Public API → IWW database

Only server runtime uses the service-role key.

Controls:

- HTTPS remote database URL required;
- browser never receives service-role key;
- atomic intake RPCs are service-role only;
- idempotency key is claimed before record creation;
- same key + changed content conflicts;
- consent/status/audit evidence written transactionally;
- RLS enabled on exposed tables;
- `anon` has no IWW core-table access;
- ordinary authenticated users cannot mutate staff/audit/idempotency/outbox records.

### Public API → staff workflow

Controls:

- webhook URL and signing secret are server-only;
- unsigned delivery fails closed;
- durable submission exists before notification attempt;
- delivery result is recorded with real attempt number;
- successful delivery is deduplicated on retry;
- notification outbox provides eventual retry path.

### Staff notification outbox → worker

Controls:

- worker endpoint requires timing-safe bearer-secret comparison;
- worker claims bounded batches;
- `FOR UPDATE SKIP LOCKED` prevents concurrent double-claim;
- stale processing locks can be reclaimed;
- successful prior delivery suppresses repeat webhook;
- failed attempts use bounded exponential backoff;
- repeated failure dead-letters;
- outbox delivered state requires durable successful delivery evidence.

### Transactional email outbox → IWW email worker

Controls:

- separate worker bearer secret;
- queue stores template identifiers rather than rendered email copy;
- bounded `SKIP LOCKED` claim and stale-lock recovery;
- worker sends no original inquiry/application text to the email adapter;
- durable email ledger records actual attempt number and provider message ID where available;
- database refuses delivered state without matching email delivery evidence;
- retry/dead-letter behavior mirrors the evidence-first staff delivery pattern.

### IWW email worker → email delivery adapter/provider

Controls:

- adapter URL and signing secret are server-only;
- every request has a stable outbox-derived idempotency key;
- payload is limited to template key, recipient, stable reference, submission kind/ID, and event type;
- adapter/provider credentials never enter the browser bundle;
- provider/template mapping is external to durable submission records;
- adapter non-2xx is treated as delivery failure and queued retry.

Residual risk: if an external adapter accepts a send but the IWW delivery-ledger write fails, the worker may retry. The stable idempotency key is therefore a mandatory adapter requirement, not an optional optimization.

### Staff browser → Supabase Auth

The staff browser may use only:

- dedicated IWW Supabase URL;
- browser-safe publishable key.

It must never receive service-role/signing/worker/email/payment secrets.

A valid Auth session is not sufficient for staff authorization.

### Staff browser → staff API

Controls:

- user bearer token validated against Supabase Auth server-side;
- active reviewer/admin role checked server-side;
- database RPC independently verifies staff actor for status changes;
- reviewers cannot manage staff roles;
- only active admins may grant/revoke reviewer/admin roles;
- last active admin cannot be revoked;
- bootstrap admin is one-time and system-attributed in audit evidence.

### Internal operator → internal APIs

Internal readiness, maintenance, and workers require protected bearer secrets.

Controls:

- no secret in URL;
- timing-safe local bearer comparison;
- no-store responses;
- maintenance operation is narrowly scoped to expired idempotency rows;
- deep readiness exposes operational detail only to authenticated internal caller;
- aggregate operational snapshot returns counts/timestamps, not submission content or personal details;
- readiness degrades on unexplained dead-letter work or stale processing locks.

## Principal threats and treatment

### Duplicate submission / double processing

Treatment:

- client reuses idempotency key for unchanged retries;
- database owns idempotency key uniqueness;
- stable response stored in idempotency record;
- staff/email successful-delivery lookup suppresses duplicate processing;
- outbox unique submission/event or template key;
- email adapter receives a stable outbox-derived idempotency key.

Residual risk: cross-device/user-generated duplicate submissions with different keys remain possible and should be handled operationally.

### Submission accepted but staff never notified

Treatment:

- persistence precedes notification;
- outbox is created from durable submission insert;
- worker retries queued/missed delivery;
- dead-letter state makes repeated failure visible;
- history API exposes delivery evidence;
- protected readiness reports dead-letter/stuck work as degraded.

### Confirmation email accepted but evidence lost

Treatment:

- provider-adapter request is idempotent by outbox ID;
- delivery ledger write is separate evidence;
- email queue cannot finalize without that ledger evidence;
- failed ledger write returns the outbox to retry rather than manufacturing delivered state.

### Forged staff request

Treatment:

- Supabase access token validation;
- reviewer/admin role lookup;
- DB role verification for transitions;
- exact browser-origin policy;
- no browser service key.

### Privilege escalation

Treatment:

- no public staff signup path;
- staff roles server-controlled;
- reviewer cannot alter roles;
- admin mutation RPC checks active admin actor;
- last-admin guard;
- role changes audited.

### Secret exfiltration

Treatment:

- explicit browser/server environment boundary;
- build tests check admin source for forbidden service-role variable;
- shared server helpers live outside Vercel `/api` function discovery;
- service/worker/signing/email secrets remain server runtime only;
- internal endpoint secrets use Authorization header, not URL.

Residual requirement: run secret scanning on produced bundles and rotate any exposed value.

### Data overcollection

Treatment:

- public forms warn against highly sensitive data;
- bounded fields;
- no payment-card fields;
- database intake throttle stores no IP address;
- operational snapshot exposes aggregates only;
- transactional email adapter does not receive inquiry/application content.

Residual requirement: approved retention/deletion/privacy policy before live data.

### Unsafe public claims

Treatment:

- unreviewed SPA routes resolve to pre-launch shell;
- Trust Center names unresolved claims/policies;
- public-claim evidence audit blocks health, financial/advisory, ministry/tax/PHA, credential, testimonial, metric, and service-promise claims until reviewed.

### Destructive maintenance

Treatment:

- only expired idempotency records have automated purge behavior;
- cleanup is bounded;
- purge action is audited;
- substantive records are not deleted until retention/deletion policy is approved.

### Hidden operational failure

Treatment:

- service-role-only aggregate snapshot counts queue state, stale locks, open review backlog, and recent delivery failures;
- readiness treats dead-letter/stale processing as degraded;
- incident runbook forbids manually editing delivered state to silence an alert;
- restore acceptance checks both outboxes, critical RPCs, triggers, RLS, and anon privileges.

### Distributed abuse / denial of service

Current controls:

- bounded input;
- honeypot;
- browser-origin policy;
- repeated-email database throttle.

Still required for production hardening:

- provider edge/WAF rate limiting or equivalent;
- monitoring of 4xx/5xx and intake volume;
- provider spend/usage limits where applicable;
- live abuse/load testing against the approved environment.

## Incident response

`ops/INCIDENT_RESPONSE_RUNBOOK.md` is the technical incident-response source of truth. It requires evidence preservation, containment, credential rotation when exposure is plausible, recovery checks beyond UI availability, and appropriate legal/privacy review without inventing statutory deadlines.

## Security release evidence required

Before launch, save evidence for:

1. service-role/email/worker/signing secrets absent from browser bundle;
2. unauthorized staff API calls rejected;
3. reviewer role cannot manage staff;
4. last-admin revocation rejected;
5. same-key replay stable and changed-content reuse rejected;
6. workflow outage queues/retries rather than losing submission;
7. staff outbox delivered state requires delivery record;
8. email adapter idempotency and email evidence guard work under retry/failure;
9. deep readiness reaches dedicated IWW schema and operational snapshot;
10. dead-letter/stale-lock conditions degrade readiness;
11. RLS/database advisors pass or findings are resolved;
12. edge abuse controls configured and exercised;
13. backup/restore tested with read-only acceptance suite;
14. incident-response drill completed;
15. public-claim/policy release approved.

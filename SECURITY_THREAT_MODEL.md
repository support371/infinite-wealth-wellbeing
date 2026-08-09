# Infinite Wealth & Well-being — Production Threat Model

## Scope

This threat model covers the release-candidate public intake, dedicated IWW persistence/auth boundary, staff review APIs, staff browser console, signed staff workflows, notification outbox, internal worker/readiness/maintenance endpoints, and gated public content.

It does not claim that external providers or legal/compliance obligations are verified merely because code exists.

## Protected assets

Highest-sensitivity assets include:

- Supabase service-role key;
- staff workflow signing secret;
- internal worker secret;
- applicant/member contact information;
- inquiry/application content;
- consent evidence;
- staff Auth access tokens;
- reviewer/admin role assignments;
- submission status and audit history;
- notification delivery/outbox history;
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
- delivery result is recorded;
- successful delivery is deduplicated on retry;
- notification outbox provides eventual retry path.

### Notification outbox → worker

Controls:

- worker endpoint requires timing-safe bearer-secret comparison;
- worker claims bounded batches;
- `FOR UPDATE SKIP LOCKED` prevents concurrent double-claim;
- stale processing locks can be reclaimed;
- successful prior delivery suppresses repeat webhook;
- failed attempts use bounded exponential backoff;
- repeated failure dead-letters;
- outbox delivered state requires durable successful delivery evidence.

### Staff browser → Supabase Auth

The staff browser may use only:

- dedicated IWW Supabase URL;
- browser-safe publishable key.

It must never receive service-role/signing/worker/payment secrets.

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

Internal readiness, maintenance, and notification worker endpoints require the protected internal bearer secret.

Controls:

- no secret in URL;
- timing-safe comparison;
- no-store response;
- maintenance operation is narrowly scoped to expired idempotency rows;
- deep readiness exposes operational detail only to authenticated internal caller.

## Principal threats and treatment

### Duplicate submission / double processing

Treatment:

- client reuses idempotency key for unchanged retries;
- database owns idempotency key uniqueness;
- stable response stored in idempotency record;
- staff successful-delivery lookup suppresses duplicate webhook;
- outbox unique submission/event key.

Residual risk: cross-device/user-generated duplicate submissions with different keys remain possible and should be handled operationally.

### Submission accepted but staff never notified

Treatment:

- persistence precedes notification;
- outbox is created from durable submission insert;
- worker retries queued/missed delivery;
- dead-letter state makes repeated failure visible;
- history API exposes delivery evidence.

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
- service keys remain server runtime only;
- internal endpoint secrets use Authorization header, not URL.

Residual requirement: run secret scanning on produced bundles and rotate any exposed value.

### Data overcollection

Treatment:

- public forms warn against highly sensitive data;
- bounded fields;
- no payment-card fields;
- database intake throttle stores no IP address.

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

### Distributed abuse / denial of service

Current controls:

- bounded input;
- honeypot;
- browser-origin policy;
- repeated-email database throttle.

Still required for production hardening:

- provider edge/WAF rate limiting or equivalent;
- monitoring of 4xx/5xx and intake volume;
- alerting on outbox backlog/dead-letter growth;
- provider spend/usage limits where applicable.

## Security release evidence required

Before launch, save evidence for:

1. service-role secret absent from browser bundle;
2. unauthorized staff API calls rejected;
3. reviewer role cannot manage staff;
4. last-admin revocation rejected;
5. same-key replay stable and changed-content reuse rejected;
6. workflow outage queues/retries rather than losing submission;
7. outbox delivered state requires delivery record;
8. deep readiness reaches dedicated IWW schema;
9. RLS/database advisors pass or findings are resolved;
10. edge abuse controls configured and exercised;
11. backup/restore tested;
12. public-claim/policy release approved.

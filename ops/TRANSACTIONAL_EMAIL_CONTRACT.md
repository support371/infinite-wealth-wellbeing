# IWW Transactional Email Contract

Transactional email is **prepared but disabled** until a provider, verified sender domain, approved templates, and live delivery evidence exist.

## Purpose

The initial email surface is intentionally narrow. It confirms that a public submission was received; it does not market services, make health/financial claims, activate membership, promise response times, or represent legal/ministry/tax status.

## Durable queue

`public.iww_email_outbox` stores only:

- submission kind and ID;
- a versioned template key;
- recipient email;
- queue/retry state;
- timestamps and bounded error metadata.

Rendered subject/body copy is **not** persisted in the migration. This prevents unreviewed or superseded legal/marketing copy from becoming part of the durable data model.

Initial template keys:

- `inquiry_received_v1`
- `membership_application_received_v1`

## Required template semantics

### `inquiry_received_v1`

Must communicate only that:

- the inquiry was received;
- the stable IWW reference can be retained;
- submission does not constitute professional financial, medical, legal, or emergency advice;
- the recipient should not reply with passwords, payment-card details, Social Security numbers, medical records, or other highly sensitive information.

### `membership_application_received_v1`

Must communicate only that:

- the membership-interest application was received;
- the stable IWW reference can be retained;
- submission does not activate a paid membership or charge a payment method;
- application submission does not guarantee approval or access to regulated/professional services;
- the recipient should not send sensitive credentials, payment-card data, Social Security numbers, or medical records by reply.

## Provider adapter requirements

A production email adapter must:

1. claim work only through the server-only `iww_claim_email_batch` RPC;
2. render an **approved version** of the queue item's `template_key`;
3. send only through a verified IWW sender identity/domain;
4. never log credentials or full message bodies unnecessarily;
5. record every attempt in `iww_notification_deliveries` with `channel = 'email'`;
6. store provider message ID when available;
7. call `iww_finish_email_attempt` after recording delivery evidence;
8. respect retry/backoff and dead-letter behavior;
9. be idempotent so a retried job cannot intentionally produce duplicate successful confirmations;
10. expose no provider secret to browser code.

The database refuses to finalize an email outbox item as delivered unless a matching durable email delivery record already exists.

## Environment values — future activation

Exact secret names should be chosen with the provider, but the following classes are required:

- provider API/server credential — server only;
- verified sender address/domain configuration;
- email worker authentication secret if the worker is invoked over HTTP;
- approved template version mapping.

Do not create `VITE_*` versions of any provider secret.

## Activation evidence

Before this gate can become `verified`:

- sender domain ownership/authentication is verified;
- both initial template versions have approved copy;
- test delivery succeeds to controlled mailboxes;
- provider message IDs are recorded;
- duplicate/retry behavior is exercised;
- forced provider failure queues a retry and eventually dead-letters at the configured limit;
- successful delivery causes the matching outbox row to become delivered only after durable evidence exists;
- unsubscribe/marketing rules are reviewed separately if promotional email is ever introduced.

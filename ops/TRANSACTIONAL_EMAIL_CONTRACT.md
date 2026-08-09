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

## Worker and provider-adapter boundary

The IWW worker, not the external provider adapter, owns queue state.

`POST /api/internal/email-worker` must:

1. authenticate with `IWW_EMAIL_WORKER_SECRET`;
2. claim work only through the server-only `iww_claim_email_batch` RPC;
3. check the durable delivery ledger before requesting another send;
4. load only the stable submission reference needed by the confirmation message;
5. send a provider-neutral request through `server/email-adapter.js`;
6. record every attempt in `iww_notification_deliveries` with `channel = 'email'` and the real retry number;
7. store a provider message ID when the adapter returns one;
8. call `iww_finish_email_attempt` only after the delivery-ledger write attempt;
9. rely on the database evidence guard so a queue row cannot become delivered without matching durable email-delivery evidence;
10. expose no provider or worker secret to browser code.

The configured delivery adapter behind `IWW_EMAIL_DELIVERY_URL` must:

1. accept only correctly signed requests using `IWW_EMAIL_DELIVERY_SECRET`;
2. honor the stable `Idempotency-Key` sent by IWW (`iww-email-<outbox-id>`);
3. map the approved `templateKey` to approved provider/template content;
4. send only through a verified IWW sender identity/domain;
5. never require the IWW browser to contact the email provider;
6. never require IWW to send the original inquiry message or membership introduction as email payload content;
7. return a provider message identifier when available;
8. return a non-2xx response if the send request was not accepted safely.

The worker payload to the adapter is intentionally limited to:

- event type;
- template key;
- recipient email;
- stable IWW reference;
- submission kind;
- submission ID.

## Server-only environment values

- `IWW_EMAIL_WORKER_SECRET` — authenticates the protected worker endpoint.
- `IWW_EMAIL_DELIVERY_URL` — server-to-server adapter endpoint.
- `IWW_EMAIL_DELIVERY_SECRET` — signs the worker's request to the adapter.

Any actual mail-provider API key remains behind the adapter and must also remain server-only.

Do not create `VITE_*` versions of any email/provider secret.

## Activation evidence

Before this gate can become `verified`:

- sender domain ownership/authentication is verified;
- both initial template versions have approved copy;
- unsigned and incorrectly signed adapter requests are rejected;
- test delivery succeeds to controlled mailboxes;
- provider message IDs are recorded;
- adapter idempotency behavior is exercised;
- forced provider/adapter failure queues a retry and eventually dead-letters at the configured limit;
- successful delivery causes the matching outbox row to become delivered only after durable evidence exists;
- an adapter-success / ledger-write-failure drill demonstrates the queue does not falsely finalize;
- unsubscribe/marketing rules are reviewed separately if promotional email is ever introduced.

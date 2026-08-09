# IWW Production Environment Boundary

This file defines which runtime values belong on the server, which values may be embedded in the browser bundle, and which values must never cross that boundary.

## Server-only protected values

Configure these only in protected server/runtime secret storage:

| Variable | Purpose | Browser exposure |
|---|---|---|
| `IWW_SUPABASE_SERVICE_ROLE_KEY` | Server access to IWW persistence, audit, staff, and outbox operations | **Never** |
| `WORKFLOW_WEBHOOK_SECRET` | Signs outbound staff workflow webhook requests | **Never** |
| `IWW_NOTIFICATION_WORKER_SECRET` | Authenticates notification worker and protected deep-readiness calls | **Never** |
| `INQUIRY_WEBHOOK_URL` | Staff inquiry workflow endpoint | Do not expose unless provider explicitly requires it |
| `MEMBERSHIP_WEBHOOK_URL` | Staff membership workflow endpoint | Do not expose unless provider explicitly requires it |

## Server runtime configuration

| Variable | Purpose |
|---|---|
| `PUBLIC_APP_ORIGIN` | Exact browser origin accepted by public/admin API origin checks |
| `IWW_SUPABASE_URL` | Dedicated/approved IWW Supabase project URL |

## Browser-safe build values

These are required only for the protected staff browser console:

| Variable | Purpose |
|---|---|
| `VITE_IWW_SUPABASE_URL` | Dedicated IWW Supabase URL used by Supabase Auth client |
| `VITE_IWW_SUPABASE_PUBLISHABLE_KEY` | Browser-safe Supabase publishable key for authentication |

The staff console must never use a service-role key. Authentication in the browser yields a user access token; all privileged queue/history/role operations still pass through server APIs, where the server validates the Auth user and checks active reviewer/admin roles.

## Explicitly forbidden browser values

Do not create or use any of the following:

- `VITE_IWW_SUPABASE_SERVICE_ROLE_KEY`
- `VITE_WORKFLOW_WEBHOOK_SECRET`
- `VITE_IWW_NOTIFICATION_WORKER_SECRET`
- any `VITE_*` variable containing a private signing secret, database admin/service key, provider API secret, or payment secret

## Rotation rules

Rotate a protected secret if:

- it is committed to source control;
- it appears in browser code/build output;
- it is pasted into a public ticket/chat/log;
- a team member or integration that possessed it no longer requires access;
- the provider reports compromise or suspicious use.

After rotation, verify both old-key rejection and new-key operation before closing the incident.

## Release verification

Before launch, confirm:

1. browser bundle contains no server secret values;
2. `/api/internal/*` endpoints reject missing/incorrect worker secret;
3. ordinary Auth users without reviewer/admin role receive 403 from staff APIs;
4. reviewers cannot manage staff roles;
5. service-role key is present only in server runtime configuration;
6. `PUBLIC_APP_ORIGIN` exactly matches the intended production origin;
7. deep readiness confirms the dedicated IWW schema is reachable.

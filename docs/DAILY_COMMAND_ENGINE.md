# Daily Command Engine

The Daily Command Engine is the internal operator kernel for turning principles into visible, evidence-backed daily execution.

## Operating invariant

**Principle → Decision → Method → Evidence**

- **Principle** defines what should remain stable.
- **Decision** interprets the present facts.
- **Method** adapts to energy, environment, and pressure.
- **Evidence** proves that a required outcome became real.

The system changes method before it changes principle.

## Core rules

1. Only one open work item may occupy `NOW`.
2. A second attempted `NOW` item is placed in `NEXT`.
3. New exploratory ideas enter the incubator and cannot be promoted while a `NOW` item is active.
4. Work cannot be completed without written evidence.
5. Deferring the active command requires a written override reason. It moves to `LATER`; another available obligation may be promoted.
6. A genuinely impossible task may enter `BLOCKED` only with a recorded dependency/reason. Blocked work is excluded from execution until explicitly unblocked.
7. A principle cannot be changed through the normal task flow. Principle review requires both a reason and supporting evidence.
8. The day has an explicit opening and closing gate. Closed sessions become continuity records.
9. If a new day opens while the previous day was never closed, the earlier session is preserved as `interrupted` rather than silently discarded.

## Work states

- `NOW` — the single active result.
- `NEXT` — ordered work eligible to become active after `NOW` resolves.
- `LATER` — intentionally deferred work that remains visible but does not own the present moment.
- `BLOCKED` — work prevented by a real dependency; a reason is mandatory and it must be explicitly unblocked.
- `DONE` — work closed with evidence.
- `INCUBATOR` — exploratory possibilities that are preserved but cannot interrupt active execution.

## Daily lifecycle

1. Open the day and state what must remain true.
2. Record current energy, environmental support, pressure, and relevant facts.
3. Execute the single `NOW` command using the method generated for current capacity.
4. Resolve it through one of three explicit paths: complete with evidence, defer with reason, or block with dependency evidence.
5. Allow another eligible obligation to become `NOW`, or deliberately activate a queued result when no active item exists.
6. Capture new ideas in the incubator instead of switching context.
7. Close the day with a short continuity note.

## Local-first storage

The v1/v2 kernel stores state in browser `localStorage`. The console provides JSON export and restore so the state can be backed up or moved manually. Restore also repairs invalid queue state, including multiple simultaneous `NOW` items.

No secrets should be stored in command notes, evidence, mission text, block reasons, or backups.

## Explicitly not implemented in this kernel

These require a later authenticated service layer and should not be simulated in the browser-only implementation:

- cross-device/cloud synchronization
- calendar or task-provider ingestion
- push/SMS/email notification delivery
- multi-user roles and permissions
- agent-triggered external actions
- remote audit retention
- encrypted server-side journal storage

## Verification

Run:

```bash
npm test
npm run build
```

Vercel is configured to run both automatically through:

```bash
npm test && npm run build
```

The test suite protects queue exclusivity, daily gating, stale-session recovery, evidence requirements, override behavior, blocked dependency behavior, exploration lockout, principle governance, continuity history, and backup repair behavior.

## Deployment surface

The operator console is built as a separate Vite entrypoint and routed to `/operator`. It is intentionally absent from public navigation and marked `noindex,nofollow`.

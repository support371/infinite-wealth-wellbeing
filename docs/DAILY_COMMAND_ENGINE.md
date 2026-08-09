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
5. Deferring the active command requires a written override reason. The override is retained in the audit ledger and the next obligation is promoted.
6. A principle cannot be changed through the normal task flow. Principle review requires both a reason and supporting evidence.
7. The day has an explicit opening and closing gate. Closed sessions become continuity records.

## Daily lifecycle

1. Open the day and state what must remain true.
2. Record current energy, environmental support, pressure, and relevant facts.
3. Execute the single `NOW` command using the method generated for current capacity.
4. Finish with evidence, or explicitly defer with an override reason.
5. Allow the queue to promote the next obligation automatically.
6. Capture new ideas in the incubator instead of switching context.
7. Close the day with a short continuity note.

## Local-first storage

The v1/v2 kernel stores state in browser `localStorage`. The console provides JSON export and restore so the state can be backed up or moved manually.

No secrets should be stored in command notes, evidence, mission text, or backups.

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

The test suite protects queue exclusivity, daily gating, evidence requirements, override behavior, exploration lockout, principle governance, continuity history, and backup repair behavior.

## Deployment surface

The operator console is built as a separate Vite entrypoint and routed to `/operator`. It is intentionally absent from public navigation and marked `noindex,nofollow`.

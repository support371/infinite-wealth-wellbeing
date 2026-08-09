# IWW Backup, Restore, Retention & Recovery Runbook

This runbook is **prepared but not verified**. It must not be marked complete until a dedicated IWW production data project exists and a restore drill has been executed against provider-backed backups.

## Unresolved service objectives

The project does **not** currently claim an approved recovery point objective (RPO) or recovery time objective (RTO).

Before launch, the system owner must approve:

- required RPO;
- required RTO;
- backup frequency and retention supported by the selected provider/plan;
- who may initiate a restore;
- who must approve production recovery;
- retention/deletion periods for submissions, consent, audit, notification, and membership records.

Do not invent these values in code or documentation.

## Backup prerequisites

Before accepting production data:

1. confirm the database is a dedicated or explicitly approved IWW project;
2. confirm provider backup/PITR capability and plan limits;
3. record the provider/project identifier in the private operational inventory;
4. restrict restore privileges to approved administrators;
5. verify MFA and account-recovery protections for provider administrators where supported;
6. verify the migration set applied to the database matches the release candidate;
7. verify `api/internal/readiness` reports the expected schema as reachable.

## Restore drill procedure

Perform the drill in an isolated non-production environment unless a real incident requires production recovery.

1. Record drill timestamp, operator, approver, source backup identifier, source environment, and target restore environment.
2. Restore the selected backup/PITR point using the provider-supported recovery mechanism.
3. Do not point public production traffic, workers, webhooks, or email providers at the restored environment during validation.
4. Configure only the minimum temporary credentials needed to inspect the restore.
5. Run `supabase/verification/restore_acceptance.sql` against the restored database.
6. Confirm every required table exists and has RLS enabled.
7. Confirm the anonymous privilege query returns zero rows.
8. Confirm all critical intake, review, outbox, and email RPCs exist.
9. Confirm all critical triggers exist and are enabled.
10. Inspect stuck notification/email work reported by the acceptance suite; do not automatically replay it against real external providers during a drill.
11. Compare informational evidence-table counts with the expected source backup window. Explain material differences.
12. Exercise a controlled test Auth user and verify ordinary users cannot obtain reviewer/admin access.
13. Exercise a controlled reviewer/admin path only with non-sensitive test records.
14. Record elapsed restore time and data-recovery point observed. These measurements inform future RTO/RPO approval; they are not promises by themselves.
15. Destroy or lock down the temporary restored environment after evidence is captured, according to provider controls and approved data-handling policy.

## Production incident recovery

During a real recovery:

- preserve incident timestamps and decision/audit evidence;
- stop or isolate writers when required to avoid split-brain or duplicate processing;
- disable outbound staff/email workers until restored data integrity is confirmed;
- validate the restore using the same acceptance SQL before resuming external delivery;
- re-enable public intake only after persistence, Auth, role, outbox, and readiness checks pass;
- re-enable workers in a controlled order and monitor retry/dead-letter queues;
- rotate any credential suspected of exposure during the incident;
- document the final restored point, observed data loss (if any), downtime, and follow-up actions.

## Retention and deletion

No business-data retention period is approved yet. Until policy/legal approval exists:

- do not add automated deletion of inquiries, applications, consent records, audit events, membership history, or delivery evidence;
- expired idempotency records may be purged because their explicit expiry is part of the technical replay-control design;
- test/temporary restore environments must not become unofficial long-term archives;
- deletion requests must not be implemented ad hoc without defining identity verification, legal holds, audit evidence, and scope.

## Evidence required to mark the release gate verified

Capture and retain, outside public source code where sensitive:

- provider backup/PITR configuration screenshot or export;
- approved RPO/RTO and retention decisions;
- restore source identifier and restore target;
- restore start/end timestamps;
- complete output from `restore_acceptance.sql`;
- evidence of zero anonymous IWW table privileges;
- evidence that staff authorization still works after restore;
- observed recovery point and elapsed restore time;
- evidence restored environment was destroyed or re-secured after the drill;
- incident/recovery sign-off by the designated approver.

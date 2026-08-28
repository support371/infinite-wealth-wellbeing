# IWW Database Migration Order

Apply these migrations only to a dedicated or explicitly approved IWW Supabase/Postgres project, in lexical/timestamp order.

1. `20260809060000_iww_production_core.sql`
2. `20260809061000_iww_atomic_intake.sql`
3. `20260809062000_iww_staff_review.sql`
4. `20260809063000_iww_idempotency_maintenance.sql`
5. `20260809064000_iww_notification_outbox.sql`
6. `20260809065000_iww_outbox_delivery_guard.sql`
7. `20260809066000_iww_staff_role_management.sql`
8. `20260809067000_iww_staff_role_evidence_guard.sql`
9. `20260809068000_iww_intake_throttle.sql`
10. `20260809069000_iww_transactional_email_outbox.sql`
11. `20260809070000_iww_operational_snapshot.sql`
12. `20260809071000_iww_terminal_review_reason_guard.sql`
13. `20260809072000_iww_staff_mfa_guard.sql`
14. `20260809073000_iww_operational_mfa_integrity.sql`

## Replacement-function semantics

Several later migrations intentionally replace earlier function definitions without changing their public signatures. Do not skip the intermediate migrations or apply only the newest file manually.

- `670` replaces staff role-management behavior from `660` to preserve no-op/audit evidence.
- `710` replaces the review transition RPC from `620` to require a durable rationale for terminal decisions.
- `720` replaces staff bootstrap/role-management RPCs again, preserving `670` evidence semantics while requiring verified MFA before privileged role activation.
- `730` replaces the aggregate operational snapshot from `700` so live readiness fails if an active reviewer/admin loses all verified MFA factors.

The final schema state therefore depends on the complete ordered migration history, not merely the latest definition of each function.

## Post-apply verification

After applying the full set:

- run database/security advisors;
- run the repository migration contract tests;
- run `supabase/verification/restore_acceptance.sql` against an isolated restored environment during the recovery drill;
- verify `iww_operational_snapshot()` succeeds only when privileged MFA integrity and both delivery queues are healthy;
- verify all service-role-only functions remain unavailable to `anon` and `authenticated` browser roles;
- verify the dedicated project—not a GEM/GemAssist database—is the migration target.

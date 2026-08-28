# IWW Privileged Staff MFA Runbook

All IWW reviewer/admin access is designed around **two independent conditions**:

1. the Supabase Auth session must be validated and carry `aal2`; and
2. the user must have an active IWW reviewer/admin role.

Role activation also requires the target Auth user to have a verified MFA factor. Password-only staff access is not an accepted operating mode.

## Enrollment before role activation

For a new reviewer/admin candidate:

1. Create the Auth identity in the dedicated IWW Auth project through the approved administrative process.
2. Do **not** grant an IWW reviewer/admin role yet.
3. Have the user sign in to the protected staff surface with the first factor.
4. Enroll TOTP through the IWW MFA gate.
5. Verify the six-digit code and confirm the session reaches `aal2`.
6. Confirm the database sees a verified Auth MFA factor for that user.
7. Only then bootstrap/grant the reviewer/admin role.
8. Verify an `aal1` session is rejected and the `aal2` session succeeds only within the granted role.

## Normal sign-in

1. User signs in with the configured Supabase Auth first factor.
2. Staff UI evaluates authenticator assurance.
3. If current level is not `aal2`, the UI requires an enrolled TOTP challenge.
4. Review/history content is not rendered until the session is upgraded.
5. Every privileged server API independently rejects a validated session whose JWT assurance level is not `aal2`.

The browser MFA gate is convenience and guidance; the server check is authoritative.

## Lost or compromised authenticator

If a privileged user's authenticator is lost, replaced, or suspected compromised:

1. Treat any active privileged session as potentially sensitive.
2. Use the dedicated Auth provider's administrative controls to revoke/terminate affected sessions where supported.
3. Revoke the user's active IWW reviewer/admin role when continued privileged access cannot be trusted.
4. Preserve role/audit/Auth evidence needed for investigation without copying secrets or unnecessary submission data.
5. Remove or replace the compromised factor through the approved Auth recovery process.
6. Require a newly verified factor before privileged role activation/re-activation.
7. Confirm a fresh first-factor-only session is rejected by staff APIs.
8. Confirm the newly challenged `aal2` session works only after the role is active again.

Do not bypass the role/MFA guards with a temporary service-role browser key or direct database edit.

## Factor removal or drift

An active privileged role without a verified MFA factor is an invalid state.

Detection mechanisms:

- role-grant RPC rejects activation without verified MFA;
- restore acceptance queries active reviewer/admin roles that lack a verified factor and expects zero rows;
- security/incident reviews should treat any such row as a privilege-integrity incident.

If detected:

1. revoke or quarantine the privileged role;
2. terminate affected sessions where supported;
3. determine how the factor disappeared while the role remained active;
4. re-enroll/verify MFA before restoring privileged access;
5. document the corrective control.

## First-admin bootstrap

The first admin is special only because no existing IWW admin can grant the role.

Required order:

1. create Auth user;
2. enroll and verify MFA;
3. confirm no active IWW admin exists;
4. invoke the one-time `iww_bootstrap_admin(user_id)` through the protected service/admin path;
5. verify system-attributed bootstrap audit evidence;
6. create a second MFA-verified admin before exercising admin revocation/recovery scenarios.

Never bootstrap a password-only account.

## Recovery assurance

After database restore:

- run `supabase/verification/restore_acceptance.sql`;
- confirm the privileged-role-without-MFA query returns zero rows;
- perform an AAL1 negative test and AAL2 positive test against the restored non-production environment;
- confirm last-admin protection and staff-role audit evidence remain intact.

## Release evidence

Before the staff MFA gate can be marked verified, retain evidence for:

- MFA enabled for the dedicated Auth project;
- first admin factor verified before bootstrap;
- reviewer/admin grant without verified MFA rejected;
- AAL1 rejected before role/evidence access;
- AAL2 reviewer and admin positive tests;
- TOTP enrollment and challenge from both staff surfaces;
- lost-factor/recovery drill;
- restore-time privileged-role MFA integrity check;
- named owner for staff identity/factor recovery operations.

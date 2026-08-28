# IWW Supabase migration order

Target project only: `fepfnzrpftxpxlgyujev` (`infinite-world-of-wellbeing`, US East 1).

Do not apply these migrations to any GEM, GemAssist, crypto, or unrelated Supabase project.

1. `20260828050000_iww_saas_core.sql` — identity, organization tenancy, wellbeing, wealth, collaboration, commercial reference records, secure RPC workflows and indexes.
2. `20260828051000_iww_rls.sql` — RLS on every exposed application table, role/assignment/delegation isolation, participant-only messaging, read-only billing references.
3. `20260828052000_iww_storage.sql` — private `iww-documents` bucket and storage object policies.
4. `20260828053000_iww_audit_guards.sql` — append-only audit history and sensitive-change audit triggers.

After applying all four migrations, run the Supabase Security Advisor and resolve every critical/high-confidence security finding before using production identities. Then run the verification queries in `supabase/verification/iww_security_verification.sql` using two separate organizations and all seven roles.

The migration files are the schema source of truth. `prisma/schema.prisma` is retained only as a legacy scaffold and must not be used as a second production datastore for the SaaS application.

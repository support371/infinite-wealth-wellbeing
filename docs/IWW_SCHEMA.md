# IWW Schema and Authorization Model

All user-accessible application records live in the dedicated IWW Supabase project. Organization tables carry `organization_id`; member-domain tables also carry `member_id`.

Authorization resolves in this order:

1. Supabase Auth verifies the IWW user.
2. An active `memberships` row establishes organization access and the authoritative role.
3. Organization administrators and operations managers receive their defined operational scope.
4. Advisors and practitioners see only members in `care_assignments`.
5. Members see their own member-domain records.
6. Family delegates see only explicitly delegated members and named scopes before expiry.
7. Conversations require explicit participant membership; private documents require ownership or an unexpired access grant.

`audit_events` has select and insert policies only. There are no authenticated update or delete policies. Database triggers record governed changes to memberships, consents, policies, integrations, approvals, document access, delegation and billing references.

The `iww-private-documents` bucket is private. Object paths use `organization_id/user_id/file-name`; storage policies verify organization membership and owner/grantee access.

# RBAC Matrix

Release 2A introduces action-oriented permissions.

## Roles

| Role | Scope |
| --- | --- |
| member | Member profile, benefits, support and service requests |
| practitioner | Practitioner profile, availability, assigned bookings and credentials |
| admin | Day-to-day operations, content, memberships, events and support |
| trustee | Governance approvals, grievances, compliance review and audit viewing |
| super_admin | Roles, domains, integrations, feature flags, audit exports and platform controls |

## Permission examples

- profile.update
- membership.review
- practitioner.approve
- policy.approve
- compliance.review
- role.assign
- audit.export
- system.lockdown

Sensitive actions require human approval and must write audit events.

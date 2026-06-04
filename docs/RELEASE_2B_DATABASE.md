# Release 2B - Database and Persistent Workflow Storage

This release moves the platform from in-memory/demo workflow concepts toward persistent storage.

## Goals

- Add a relational database schema for core operating records.
- Prepare persistence contracts for users, roles, permissions, members, practitioners, compliance records, workflow events and audit logs.
- Add seed definitions for baseline roles and permissions.
- Document migration and deployment steps.

## Production rule

Every sensitive workflow must be persisted and auditable before production launch.

## Tables planned

- users
- roles
- permissions
- user_roles
- role_permissions
- member_profiles
- practitioner_profiles
- compliance_records
- workflow_events
- audit_logs
- media_assets
- notification_events

## Next implementation stage

Release 2C should connect API endpoints to the database client and replace placeholder responses with stored records.

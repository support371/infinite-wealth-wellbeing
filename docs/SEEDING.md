# Seed Data

Release 2B defines baseline seed data for the platform.

## Roles

- member
- practitioner
- admin
- trustee
- super_admin

## Permissions

- profile.read
- profile.update
- membership.review
- practitioner.review
- practitioner.approve
- content.manage
- policy.approve
- compliance.review
- audit.view
- audit.export
- role.assign
- domain.update
- integration.manage
- feature_flag.manage

## Notes

Create the seed script after the database connection is available in the target environment. Do not seed real users, emails, API keys, or credentials from source control.

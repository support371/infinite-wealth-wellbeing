# Release 2C - API Persistence Wiring

This release connects API behavior to persistence-ready controller, repository and validation layers.

## Goals

- Standardize API responses.
- Add request validation contracts.
- Add repository functions for future Prisma persistence.
- Add controllers for membership, practitioner, inquiry and compliance workflows.
- Add audit and workflow event hooks.

## Production rule

Controllers must validate input, write workflow events, write audit logs and return consistent response envelopes.

## Routes covered

- POST /api/inquiries
- POST /api/membership/applications
- POST /api/practitioners/applications
- POST /api/compliance/records

## Next release

Release 2D should replace scaffold repositories with generated Prisma Client calls and add integration tests.

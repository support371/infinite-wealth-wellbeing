# API Persistence Wiring

Release 2C introduces controller, validation and repository layers for the main intake workflows.

## Controller files

- services/api/src/controllers.js
- services/api/src/validation.js
- services/api/src/repositories.js
- services/api/src/httpResponses.js

## Workflows covered

- Inquiry intake
- Membership application intake
- Practitioner application intake
- Compliance record intake

## Persistence mode

The current repository layer is a memory scaffold so the controller behavior is reviewable before Prisma Client wiring. Release 2D should replace memory storage with Prisma Client calls.

## Required behavior

Every intake flow should:

1. Validate the request body.
2. Create the primary record.
3. Create a workflow event.
4. Create an audit event.
5. Return a standard response envelope.

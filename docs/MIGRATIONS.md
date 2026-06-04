# Database Migration Instructions

Release 2B prepares the database layer for PostgreSQL and Prisma.

## Local setup

1. Configure `DATABASE_URL` in a local `.env` file.
2. Install Prisma dependencies.
3. Generate Prisma client.
4. Run the first migration.

Example commands:

```bash
npm install prisma @prisma/client --save-dev
npx prisma generate
npx prisma migrate dev --name init_core_platform
```

## Production guidance

- Run migrations through CI/CD or a controlled release process.
- Back up production data before schema changes.
- Never commit database credentials.
- Apply migrations to staging before production.
- Verify audit and workflow tables before enabling sensitive operations.

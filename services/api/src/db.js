// Database client placeholder.
// Install @prisma/client and generate Prisma client after DATABASE_URL is configured.

export function getDatabaseStatus() {
  return {
    configured: Boolean(process.env.DATABASE_URL),
    provider: 'postgresql',
    note: 'Persistent storage is ready to wire after Prisma client generation.'
  };
}

export async function persistWorkflowEvent(event) {
  // Replace with prisma.workflowEvent.create({ data: event }) after Prisma is enabled.
  return {
    persisted: false,
    mode: 'scaffold',
    event
  };
}

export async function persistAuditLog(event) {
  // Replace with prisma.auditLog.create({ data: event }) after Prisma is enabled.
  return {
    persisted: false,
    mode: 'scaffold',
    event
  };
}

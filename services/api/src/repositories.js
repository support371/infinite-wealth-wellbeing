const memoryStore = {
  inquiries: [],
  membershipApplications: [],
  practitionerApplications: [],
  complianceRecords: [],
  workflowEvents: [],
  auditLogs: []
};

function createRecord(collection, data) {
  const record = {
    id: crypto.randomUUID(),
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  memoryStore[collection].push(record);
  return record;
}

export const repositories = {
  inquiries: {
    create: (data) => createRecord('inquiries', data)
  },
  membershipApplications: {
    create: (data) => createRecord('membershipApplications', data)
  },
  practitionerApplications: {
    create: (data) => createRecord('practitionerApplications', data)
  },
  complianceRecords: {
    create: (data) => createRecord('complianceRecords', data)
  },
  workflowEvents: {
    create: (data) => createRecord('workflowEvents', data)
  },
  auditLogs: {
    create: (data) => createRecord('auditLogs', data)
  }
};

export function getPersistenceMode() {
  return {
    mode: 'memory-scaffold',
    next: 'Replace repository functions with Prisma Client calls in Release 2D.'
  };
}

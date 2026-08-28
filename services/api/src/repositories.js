function repository(table) {
  return {
    async create(req, data) {
      const { data: record, error } = await req.supabase.from(table).insert({ ...data, organization_id: req.organizationId, created_by: req.user.id }).select().single();
      if (error) throw error;
      return record;
    },
    async list(req, { limit = 100 } = {}) {
      const { data, error } = await req.supabase.from(table).select('*').eq('organization_id', req.organizationId).limit(Math.min(limit, 100));
      if (error) throw error;
      return data;
    }
  };
}

export const repositories = {
  programmes: repository('programmes'), reports: repository('reports'), tasks: repository('tasks'), resources: repository('resource_library_items')
};

export function getPersistenceMode() {
  return { mode: 'supabase-production', tenantIsolation: 'organization_id + RLS', audit: 'append-only' };
}

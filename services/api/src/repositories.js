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
  programmes: repository('programmes'), reports: repository('reports'), tasks: repository('tasks'), resources: repository('resource_library_items'),
  integrations: {
    async request(req, provider) {
      const { data: application, error: catalogError } = await req.supabase
        .from('integration_catalog')
        .select('provider_key,display_name,status')
        .eq('provider_key', provider)
        .eq('status', 'active')
        .maybeSingle();
      if (catalogError) throw catalogError;
      if (!application) {
        const error = new Error('integration_not_available');
        error.statusCode = 404;
        throw error;
      }

      const { data: current, error: currentError } = await req.supabase
        .from('integration_connections')
        .select('id,status')
        .eq('organization_id', req.organizationId)
        .eq('provider', provider)
        .maybeSingle();
      if (currentError) throw currentError;
      if (current?.status === 'connected') {
        const error = new Error('connected_integration_cannot_be_re_requested');
        error.statusCode = 409;
        throw error;
      }

      const { data, error } = await req.supabase.from('integration_connections').upsert({
        organization_id: req.organizationId,
        provider,
        status: 'pending',
        connected_by: req.user.id,
        configuration: { catalog_request: true, requested_via: 'iww_api' }
      }, { onConflict: 'organization_id,provider' }).select('id,provider,status,created_at,updated_at').single();
      if (error) throw error;
      return { ...data, display_name: application.display_name };
    },
    async revoke(req, provider) {
      const { data, error } = await req.supabase.from('integration_connections')
        .update({ status: 'revoked', configuration: { revoked_via: 'iww_api' } })
        .eq('organization_id', req.organizationId)
        .eq('provider', provider)
        .select('id,provider,status,created_at,updated_at')
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        const notFound = new Error('integration_connection_not_found');
        notFound.statusCode = 404;
        throw notFound;
      }
      return data;
    }
  }
};

export function getPersistenceMode() {
  return { mode: 'supabase-production', tenantIsolation: 'organization_id + RLS', audit: 'append-only' };
}

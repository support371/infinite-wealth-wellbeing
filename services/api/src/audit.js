export function createAuditEvent({ organizationId, actorId, action, targetType, targetId = null, reason = null, requestId = null, metadata = {} }) {
  return { organization_id: organizationId, actor_id: actorId, action, target_type: targetType, target_id: targetId, reason, request_id: requestId, metadata };
}

export async function persistAuditEvent(req, event) {
  if (!req.supabase) throw new Error('audit_persistence_unavailable');
  const { data, error } = await req.supabase.from('audit_events').insert(event).select('id,created_at').single();
  if (error) throw error;
  return data;
}

export function auditAfter(action, targetType) {
  return async (req, res, next) => {
    res.on('finish', () => {
      if (res.statusCode >= 200 && res.statusCode < 400 && req.user) {
        persistAuditEvent(req, createAuditEvent({ organizationId:req.organizationId, actorId:req.user.id, action, targetType, targetId:req.params?.id, requestId:req.id, metadata:{method:req.method,path:req.path,status:res.statusCode} })).catch((error)=>console.error('[audit-persistence-failed]', req.id, error.message));
      }
    });
    next();
  };
}

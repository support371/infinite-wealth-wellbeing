export function createAuditEvent({ actorId = null, action, targetType, targetId = null, reason = null, metadata = {} }) {
  return {
    id: crypto.randomUUID(),
    actorId,
    action,
    targetType,
    targetId,
    reason,
    metadata,
    createdAt: new Date().toISOString()
  };
}

export function auditMiddleware(action, targetType) {
  return (req, _res, next) => {
    req.auditEvent = createAuditEvent({
      actorId: req.user?.id || null,
      action,
      targetType,
      targetId: req.params?.id || null,
      metadata: {
        method: req.method,
        path: req.path
      }
    });
    next();
  };
}

export function logAuditEvent(event) {
  // Replace this with persistent database logging in production.
  console.info('[audit]', JSON.stringify(event));
  return event;
}

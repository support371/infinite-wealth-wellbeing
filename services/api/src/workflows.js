export const workflowStates = {
  membership: ['lead', 'applicant', 'active', 'grace_period', 'expired', 'reactivated', 'cancelled'],
  practitioner: ['draft', 'submitted', 'under_review', 'approved', 'rejected', 'onboarded', 'suspended', 'archived'],
  booking: ['created', 'payment_pending', 'confirmed', 'fulfilled', 'completed', 'no_show', 'cancelled', 'refunded_if_applicable'],
  content: ['draft', 'review', 'approved', 'scheduled', 'published', 'revised', 'retired'],
  compliance: ['submitted', 'triaged', 'under_review', 'approved', 'requires_update', 'archived']
};

export function isValidTransition(workflow, from, to) {
  const states = workflowStates[workflow] || [];
  const fromIndex = states.indexOf(from);
  const toIndex = states.indexOf(to);
  return fromIndex >= 0 && toIndex >= 0 && toIndex >= fromIndex;
}

export function createWorkflowEvent({ workflow, entityType, entityId, from, to, actorId, payload = {} }) {
  if (!isValidTransition(workflow, from, to)) {
    throw new Error(`Invalid ${workflow} transition from ${from} to ${to}`);
  }
  return {
    id: crypto.randomUUID(),
    workflow,
    entityType,
    entityId,
    from,
    to,
    actorId,
    payload,
    createdAt: new Date().toISOString()
  };
}

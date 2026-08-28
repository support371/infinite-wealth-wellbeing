export const roles = Object.freeze({
  owner: ['organization.manage','team.manage','billing.manage','integration.manage','programme.manage','report.view','audit.view','member.read','care.manage'],
  admin: ['organization.manage','team.manage','billing.read','integration.manage','programme.manage','report.view','audit.view','member.read','care.manage'],
  operations_manager: ['programme.manage','operations.manage','appointment.manage','task.manage','report.view','member.read'],
  advisor: ['assigned_member.read','wealth_plan.manage','document.manage_assigned','appointment.manage_assigned','message.assigned','member.read'],
  practitioner: ['assigned_member.read','wellbeing_plan.manage','coaching.manage_assigned','appointment.manage_assigned','message.assigned','member.read'],
  member: ['self.read','self.update','plan.self','appointment.self','message.self','document.self','billing.self','member.read'],
  family_delegate: ['delegated.read','delegated.appointment','delegated.message','member.read']
});

export function hasPermission(role, action) {
  return Boolean(roles[role]?.includes(action));
}

export function requirePermission(action) {
  return (req, res, next) => {
    const role = req.membership?.role;
    if (!hasPermission(role, action)) return res.status(403).json({ error: 'permission_denied', requiredPermission: action });
    return next();
  };
}

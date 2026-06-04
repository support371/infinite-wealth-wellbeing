export const roles = {
  member: [
    'profile.read',
    'profile.update',
    'membership.read',
    'booking.request',
    'support.create'
  ],
  practitioner: [
    'profile.read',
    'profile.update',
    'practitioner.profile.update',
    'practitioner.availability.update',
    'booking.manage_assigned'
  ],
  admin: [
    'content.manage',
    'membership.review',
    'practitioner.review',
    'event.manage',
    'support.manage',
    'report.view'
  ],
  trustee: [
    'policy.approve',
    'grievance.review',
    'practitioner.approve',
    'compliance.review',
    'audit.view'
  ],
  super_admin: [
    'role.assign',
    'domain.update',
    'integration.manage',
    'feature_flag.manage',
    'audit.export',
    'system.lockdown'
  ]
};

export function hasPermission(userRoles = [], action) {
  return userRoles.some((role) => roles[role]?.includes(action));
}

export function requirePermission(action) {
  return (req, res, next) => {
    const userRoles = req.user?.roles || [];
    if (!hasPermission(userRoles, action)) {
      return res.status(403).json({ error: 'forbidden', requiredPermission: action });
    }
    return next();
  };
}

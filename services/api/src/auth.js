export function attachDemoUser(req, _res, next) {
  // Development-only placeholder. Replace with real session/JWT validation before production.
  req.user = {
    id: req.headers['x-demo-user-id'] || 'anonymous',
    roles: String(req.headers['x-demo-roles'] || 'member').split(',').map((role) => role.trim())
  };
  next();
}

export function requireAuthenticated(req, res, next) {
  if (!req.user || req.user.id === 'anonymous') {
    return res.status(401).json({ error: 'authentication_required' });
  }
  next();
}

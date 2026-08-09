import {
  supabaseServiceRequest,
  validateSupabaseAccessToken,
} from './supabase-server.js';

const STAFF_ROLES = new Set(['reviewer', 'admin']);

function bearerToken(req) {
  const authorization = req?.headers?.authorization;
  if (typeof authorization !== 'string') return '';
  const [scheme, token] = authorization.trim().split(/\s+/, 2);
  if (scheme?.toLowerCase() !== 'bearer' || !token) return '';
  return token;
}

export async function authenticateStaff(req) {
  const token = bearerToken(req);
  if (!token) {
    return { ok: false, status: 401, error: 'authentication_required' };
  }

  const authenticated = await validateSupabaseAccessToken(token);
  if (!authenticated.ok) return authenticated;

  const query = new URLSearchParams({
    user_id: `eq.${authenticated.user.id}`,
    revoked_at: 'is.null',
    select: 'role',
  });
  const rolesResult = await supabaseServiceRequest(`/rest/v1/iww_user_roles?${query.toString()}`);
  if (!rolesResult.ok) {
    return { ok: false, status: 502, error: 'authorization_unavailable' };
  }

  const roles = Array.isArray(rolesResult.data)
    ? rolesResult.data.map((entry) => entry.role).filter((role) => STAFF_ROLES.has(role))
    : [];

  if (!roles.length) {
    return { ok: false, status: 403, error: 'staff_role_required' };
  }

  return {
    ok: true,
    user: authenticated.user,
    roles,
    token,
  };
}

export function sendStaffAuthError(res, result) {
  return res.status(result.status || 401).json({ error: result.error || 'authentication_failed' });
}

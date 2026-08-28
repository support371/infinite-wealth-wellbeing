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

function validatedJwtClaims(token, expectedUserId) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const claims = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    if (!claims || typeof claims !== 'object') return null;
    if (claims.sub !== expectedUserId) return null;
    return claims;
  } catch {
    return null;
  }
}

export async function authenticateStaff(req) {
  const token = bearerToken(req);
  if (!token) return { ok: false, status: 401, error: 'authentication_required' };

  // Supabase Auth validates the token first. Only after successful validation do
  // we read its standard AAL claim for the privileged API policy.
  const authenticated = await validateSupabaseAccessToken(token);
  if (!authenticated.ok) return authenticated;

  const claims = validatedJwtClaims(token, authenticated.user.id);
  if (!claims) return { ok: false, status: 401, error: 'invalid_access_token' };
  if (claims.aal !== 'aal2') {
    return { ok: false, status: 403, error: 'mfa_required' };
  }

  const query = new URLSearchParams({
    user_id: `eq.${authenticated.user.id}`,
    revoked_at: 'is.null',
    select: 'role',
  });
  const rolesResult = await supabaseServiceRequest(`/rest/v1/iww_user_roles?${query.toString()}`);
  if (!rolesResult.ok) return { ok: false, status: 502, error: 'authorization_unavailable' };

  const roles = Array.isArray(rolesResult.data)
    ? rolesResult.data.map((entry) => entry.role).filter((role) => STAFF_ROLES.has(role))
    : [];

  if (!roles.length) return { ok: false, status: 403, error: 'staff_role_required' };

  return {
    ok: true,
    user: authenticated.user,
    roles,
    token,
    assuranceLevel: claims.aal,
  };
}

export function sendStaffAuthError(res, result) {
  return res.status(result.status || 401).json({ error: result.error || 'authentication_failed' });
}

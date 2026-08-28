import { applySecurityHeaders, cleanText, getBody, handleOptions, requireAllowedOrigin } from '../../server/http.js';
import { authenticateStaff, sendStaffAuthError } from '../../server/staff-auth.js';
import { supabaseServiceRequest } from '../../server/supabase-server.js';

const STAFF_ROLES = new Set(['reviewer', 'admin']);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function mapRoleError(result) {
  const message = String(result?.data?.message || '');
  if (message.includes('admin_role_required')) return { status: 403, error: 'admin_role_required' };
  if (message.includes('auth_user_not_found')) return { status: 404, error: 'auth_user_not_found' };
  if (message.includes('verified_mfa_required')) return { status: 409, error: 'verified_mfa_required' };
  if (message.includes('last_admin_required')) return { status: 409, error: 'last_admin_required' };
  if (message.includes('invalid_staff_role')) return { status: 400, error: 'invalid_staff_role' };
  return { status: result?.status || 502, error: 'staff_role_update_failed' };
}

async function listStaff(res) {
  const query = new URLSearchParams({
    select: 'user_id,role,granted_by,granted_at,revoked_at',
    order: 'role.asc,granted_at.asc',
    limit: '200',
  });
  const result = await supabaseServiceRequest(`/rest/v1/iww_user_roles?${query.toString()}`);
  if (!result.ok) return res.status(502).json({ error: 'staff_roles_unavailable' });

  const items = Array.isArray(result.data)
    ? result.data.filter((entry) => ['reviewer', 'admin'].includes(entry.role))
    : [];
  return res.status(200).json({ count: items.length, items });
}

async function updateStaff(req, res, staff) {
  const body = getBody(req);
  if (!body) return res.status(400).json({ error: 'invalid_json' });

  const targetUserId = cleanText(body.targetUserId, 80);
  const role = cleanText(body.role, 30);
  const active = body.active;

  if (!UUID_RE.test(targetUserId)) return res.status(400).json({ error: 'invalid_target_user_id' });
  if (!STAFF_ROLES.has(role)) return res.status(400).json({ error: 'invalid_staff_role' });
  if (typeof active !== 'boolean') return res.status(400).json({ error: 'invalid_active_value' });

  const result = await supabaseServiceRequest('/rest/v1/rpc/iww_set_staff_role', {
    method: 'POST',
    body: {
      p_actor_user_id: staff.user.id,
      p_target_user_id: targetUserId,
      p_role: role,
      p_active: active,
    },
  });

  if (!result.ok) {
    const mapped = mapRoleError(result);
    return res.status(mapped.status).json({ error: mapped.error });
  }

  return res.status(200).json({ status: 'updated', result: result.data });
}

export default async function handler(req, res) {
  applySecurityHeaders(req, res);
  if (handleOptions(req, res)) return;
  if (!requireAllowedOrigin(req, res)) return;

  if (!['GET', 'PATCH'].includes(req.method)) {
    res.setHeader('Allow', 'GET, PATCH, OPTIONS');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const staff = await authenticateStaff(req);
  if (!staff.ok) return sendStaffAuthError(res, staff);
  if (!staff.roles.includes('admin')) return res.status(403).json({ error: 'admin_role_required' });

  if (req.method === 'GET') return listStaff(res);
  return updateStaff(req, res, staff);
}

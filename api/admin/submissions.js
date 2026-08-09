import { applySecurityHeaders, cleanText, getBody, handleOptions, requireAllowedOrigin } from '../../server/http.js';
import { authenticateStaff, sendStaffAuthError } from '../../server/staff-auth.js';
import { supabaseServiceRequest } from '../../server/supabase-server.js';

const KINDS = new Set(['inquiry', 'membership_application']);
const STATUSES = new Set(['received', 'triaged', 'in_review', 'approved', 'rejected', 'closed', 'spam']);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function queryValue(req, name) {
  const direct = req?.query?.[name];
  if (Array.isArray(direct)) return direct[0] || '';
  if (typeof direct === 'string') return direct;
  if (typeof req?.url === 'string') {
    try {
      return new URL(req.url, 'https://iww.local').searchParams.get(name) || '';
    } catch {
      return '';
    }
  }
  return '';
}

function tableFor(kind) {
  return kind === 'membership_application' ? 'iww_membership_applications' : 'iww_inquiries';
}

function selectFor(kind) {
  if (kind === 'membership_application') {
    return 'id,reference,first_name,last_name,email,requested_tier,primary_interest,introduction,status,assigned_to,created_at,updated_at';
  }
  return 'id,reference,first_name,last_name,email,subject,message,status,assigned_to,created_at,updated_at';
}

function mapTransitionError(result) {
  const message = String(result?.data?.message || '');
  if (message.includes('submission_not_found')) return { status: 404, error: 'submission_not_found' };
  if (message.includes('invalid_status_transition')) return { status: 409, error: 'invalid_status_transition' };
  if (message.includes('invalid_submission_kind')) return { status: 400, error: 'invalid_submission_kind' };
  if (message.includes('actor_not_staff')) return { status: 403, error: 'staff_role_required' };
  return { status: result?.status || 502, error: 'review_update_failed' };
}

async function listSubmissions(req, res) {
  const kind = cleanText(queryValue(req, 'kind') || 'inquiry', 40);
  const status = cleanText(queryValue(req, 'status'), 40);
  const requestedLimit = Number(queryValue(req, 'limit') || 25);
  const limit = Number.isFinite(requestedLimit) ? Math.max(1, Math.min(50, Math.trunc(requestedLimit))) : 25;

  if (!KINDS.has(kind)) return res.status(400).json({ error: 'invalid_submission_kind' });
  if (status && !STATUSES.has(status)) return res.status(400).json({ error: 'invalid_status' });

  const query = new URLSearchParams({
    select: selectFor(kind),
    order: 'created_at.desc',
    limit: String(limit),
  });
  if (status) query.set('status', `eq.${status}`);

  const result = await supabaseServiceRequest(`/rest/v1/${tableFor(kind)}?${query.toString()}`);
  if (!result.ok) {
    return res.status(result.status || 502).json({ error: 'review_queue_unavailable' });
  }

  return res.status(200).json({
    kind,
    status: status || null,
    count: Array.isArray(result.data) ? result.data.length : 0,
    items: Array.isArray(result.data) ? result.data : [],
  });
}

async function transitionSubmission(req, res, staff) {
  const body = getBody(req);
  if (!body) return res.status(400).json({ error: 'invalid_json' });

  const kind = cleanText(body.kind, 40);
  const submissionId = cleanText(body.submissionId, 80);
  const toStatus = cleanText(body.toStatus, 40);
  const reason = cleanText(body.reason, 1000);

  if (!KINDS.has(kind)) return res.status(400).json({ error: 'invalid_submission_kind' });
  if (!UUID_RE.test(submissionId)) return res.status(400).json({ error: 'invalid_submission_id' });
  if (!STATUSES.has(toStatus)) return res.status(400).json({ error: 'invalid_status' });

  const result = await supabaseServiceRequest('/rest/v1/rpc/iww_transition_submission', {
    method: 'POST',
    body: {
      p_submission_kind: kind,
      p_submission_id: submissionId,
      p_to_status: toStatus,
      p_actor_user_id: staff.user.id,
      p_reason: reason || null,
    },
  });

  if (!result.ok) {
    const mapped = mapTransitionError(result);
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

  if (req.method === 'GET') return listSubmissions(req, res);
  return transitionSubmission(req, res, staff);
}

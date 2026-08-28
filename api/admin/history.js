import { applySecurityHeaders, cleanText, handleOptions, requireAllowedOrigin } from '../../server/http.js';
import { authenticateStaff, sendStaffAuthError } from '../../server/staff-auth.js';
import { supabaseServiceRequest } from '../../server/supabase-server.js';

const KINDS = new Set(['inquiry', 'membership_application']);
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

export default async function handler(req, res) {
  applySecurityHeaders(req, res);
  if (handleOptions(req, res)) return;
  if (!requireAllowedOrigin(req, res)) return;

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET, OPTIONS');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const staff = await authenticateStaff(req);
  if (!staff.ok) return sendStaffAuthError(res, staff);

  const kind = cleanText(queryValue(req, 'kind'), 40);
  const submissionId = cleanText(queryValue(req, 'submissionId'), 80);
  if (!KINDS.has(kind)) return res.status(400).json({ error: 'invalid_submission_kind' });
  if (!UUID_RE.test(submissionId)) return res.status(400).json({ error: 'invalid_submission_id' });

  const statusQuery = new URLSearchParams({
    submission_kind: `eq.${kind}`,
    submission_id: `eq.${submissionId}`,
    select: 'id,from_status,to_status,changed_by,reason,created_at',
    order: 'created_at.asc',
    limit: '200',
  });
  const auditQuery = new URLSearchParams({
    entity_kind: `eq.${kind}`,
    entity_id: `eq.${submissionId}`,
    select: 'id,actor_user_id,action,details,created_at',
    order: 'created_at.asc',
    limit: '200',
  });
  const deliveryQuery = new URLSearchParams({
    submission_kind: `eq.${kind}`,
    submission_id: `eq.${submissionId}`,
    select: 'id,channel,provider,provider_message_id,attempt,status,error_code,created_at',
    order: 'created_at.asc',
    limit: '200',
  });

  const [statusEvents, auditEvents, deliveries] = await Promise.all([
    supabaseServiceRequest(`/rest/v1/iww_submission_status_events?${statusQuery.toString()}`),
    supabaseServiceRequest(`/rest/v1/iww_audit_events?${auditQuery.toString()}`),
    supabaseServiceRequest(`/rest/v1/iww_notification_deliveries?${deliveryQuery.toString()}`),
  ]);

  if (![statusEvents, auditEvents, deliveries].every((result) => result.ok)) {
    return res.status(502).json({ error: 'history_unavailable' });
  }

  return res.status(200).json({
    kind,
    submissionId,
    statusEvents: Array.isArray(statusEvents.data) ? statusEvents.data : [],
    auditEvents: Array.isArray(auditEvents.data) ? auditEvents.data : [],
    deliveries: Array.isArray(deliveries.data) ? deliveries.data : [],
  });
}

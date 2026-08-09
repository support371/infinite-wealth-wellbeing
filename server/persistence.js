import { createHash } from 'node:crypto';

const RPC_TIMEOUT_MS = 8000;

function configuration() {
  const rawUrl = process.env.IWW_SUPABASE_URL;
  const serviceRoleKey = process.env.IWW_SUPABASE_SERVICE_ROLE_KEY;
  if (!rawUrl || !serviceRoleKey) return null;

  try {
    const parsed = new URL(rawUrl);
    const local = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
    if (parsed.protocol !== 'https:' && !local) return null;
    return { baseUrl: parsed.origin, serviceRoleKey };
  } catch {
    return null;
  }
}

function serviceHeaders(serviceRoleKey, extra = {}) {
  return {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    'Content-Type': 'application/json',
    ...extra,
  };
}

function mapPersistenceError(data = {}) {
  const message = String(data.message || data.error || '');
  if (message.includes('idempotency_key_reused')) {
    return { status: 409, error: 'idempotency_conflict' };
  }
  if (message.includes('idempotency_in_progress')) {
    return { status: 409, error: 'idempotency_in_progress' };
  }
  if (message.includes('invalid_idempotency_key')) {
    return { status: 400, error: 'invalid_idempotency_key' };
  }
  return { status: 502, error: 'persistence_failed' };
}

async function request(path, { method = 'GET', body, headers = {} } = {}) {
  const config = configuration();
  if (!config) {
    return { ok: false, status: 503, error: 'persistence_not_configured' };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), RPC_TIMEOUT_MS);

  try {
    const response = await fetch(`${config.baseUrl}${path}`, {
      method,
      headers: serviceHeaders(config.serviceRoleKey, headers),
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      signal: controller.signal,
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return { ok: false, ...mapPersistenceError(data) };
    }

    return { ok: true, data };
  } catch {
    return { ok: false, status: 502, error: 'persistence_unavailable' };
  } finally {
    clearTimeout(timeout);
  }
}

function post(path, body, extraHeaders = {}) {
  return request(path, { method: 'POST', body, headers: extraHeaders });
}

export function hashSubmission(payload) {
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

export function readIdempotencyKey(req) {
  const raw = req?.headers?.['idempotency-key'];
  if (typeof raw !== 'string') return '';
  const value = raw.trim();
  return value.length >= 8 && value.length <= 200 ? value : '';
}

export async function persistInquiry({ idempotencyKey, person, subject, message, metadata }) {
  const canonical = {
    firstName: person.firstName,
    lastName: person.lastName,
    email: person.email,
    subject,
    message,
    consentStatementVersion: 'web-v1',
  };

  return post('/rest/v1/rpc/iww_accept_inquiry', {
    p_idempotency_key: idempotencyKey,
    p_request_hash: hashSubmission(canonical),
    p_first_name: person.firstName,
    p_last_name: person.lastName,
    p_email: person.email,
    p_subject: subject,
    p_message: message,
    p_request_id: metadata.requestId,
    p_metadata: {
      userAgent: metadata.userAgent,
      submittedAt: metadata.submittedAt,
    },
    p_consent_statement_version: 'web-v1',
  });
}

export async function persistMembershipApplication({ idempotencyKey, person, requestedTier, primaryInterest, introduction, metadata }) {
  const canonical = {
    firstName: person.firstName,
    lastName: person.lastName,
    email: person.email,
    requestedTier,
    primaryInterest,
    introduction,
    consentStatementVersion: 'web-v1',
  };

  return post('/rest/v1/rpc/iww_accept_membership_application', {
    p_idempotency_key: idempotencyKey,
    p_request_hash: hashSubmission(canonical),
    p_first_name: person.firstName,
    p_last_name: person.lastName,
    p_email: person.email,
    p_requested_tier: requestedTier,
    p_primary_interest: primaryInterest,
    p_introduction: introduction,
    p_request_id: metadata.requestId,
    p_metadata: {
      userAgent: metadata.userAgent,
      submittedAt: metadata.submittedAt,
    },
    p_consent_statement_version: 'web-v1',
  });
}

export async function hasSuccessfulNotification({ submissionKind, submissionId }) {
  if (!submissionId) return { ok: false, status: 400, error: 'submission_id_required' };
  const query = new URLSearchParams({
    submission_kind: `eq.${submissionKind}`,
    submission_id: `eq.${submissionId}`,
    channel: 'eq.webhook',
    status: 'eq.sent',
    select: 'id',
    limit: '1',
  });
  const result = await request(`/rest/v1/iww_notification_deliveries?${query.toString()}`);
  if (!result.ok) return result;
  return {
    ok: true,
    sent: Array.isArray(result.data) && result.data.length > 0,
  };
}

export async function recordNotificationDelivery({ submissionKind, submissionId, delivered }) {
  if (!submissionId) return { ok: false, status: 400, error: 'submission_id_required' };
  return post('/rest/v1/iww_notification_deliveries', {
    submission_kind: submissionKind,
    submission_id: submissionId,
    channel: 'webhook',
    provider: 'workflow-webhook',
    attempt: 1,
    status: delivered.ok ? 'sent' : 'failed',
    error_code: delivered.ok ? null : delivered.error,
  }, {
    Prefer: 'return=minimal',
  });
}

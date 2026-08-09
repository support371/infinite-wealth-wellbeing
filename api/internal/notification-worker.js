import { timingSafeEqual } from 'node:crypto';
import { applySecurityHeaders, forwardWebhook } from '../../server/http.js';
import {
  hasSuccessfulNotification,
  recordNotificationDelivery,
} from '../../server/persistence.js';
import { supabaseServiceRequest } from '../../server/supabase-server.js';

function secretMatches(req) {
  const configured = process.env.IWW_NOTIFICATION_WORKER_SECRET;
  const authorization = req?.headers?.authorization;
  if (!configured || typeof authorization !== 'string') return false;
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  if (!match) return false;
  const supplied = match[1];
  const expectedBuffer = Buffer.from(configured);
  const suppliedBuffer = Buffer.from(supplied);
  return expectedBuffer.length === suppliedBuffer.length
    && timingSafeEqual(expectedBuffer, suppliedBuffer);
}

function tableFor(kind) {
  return kind === 'membership_application' ? 'iww_membership_applications' : 'iww_inquiries';
}

function selectFor(kind) {
  if (kind === 'membership_application') {
    return 'id,reference,first_name,last_name,email,requested_tier,primary_interest,introduction,request_id,metadata,created_at';
  }
  return 'id,reference,first_name,last_name,email,subject,message,request_id,metadata,created_at';
}

async function loadSubmission(kind, submissionId) {
  const query = new URLSearchParams({
    id: `eq.${submissionId}`,
    select: selectFor(kind),
    limit: '1',
  });
  const result = await supabaseServiceRequest(`/rest/v1/${tableFor(kind)}?${query.toString()}`);
  if (!result.ok) return result;
  const row = Array.isArray(result.data) ? result.data[0] : null;
  return row
    ? { ok: true, data: row }
    : { ok: false, status: 404, error: 'submission_not_found' };
}

function payloadFor(kind, row) {
  const metadata = {
    requestId: row.request_id || null,
    userAgent: row.metadata?.userAgent || '',
    submittedAt: row.metadata?.submittedAt || row.created_at,
    replayedByOutbox: true,
  };
  const person = {
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
  };

  if (kind === 'membership_application') {
    return {
      type: 'membership.application.received',
      reference: row.reference,
      submissionId: row.id,
      person,
      requestedTier: row.requested_tier,
      primaryInterest: row.primary_interest,
      introduction: row.introduction,
      consent: {
        applicationProcessing: true,
        contactPermission: true,
      },
      metadata,
    };
  }

  return {
    type: 'inquiry.received',
    reference: row.reference,
    submissionId: row.id,
    person,
    subject: row.subject,
    message: row.message,
    consent: {
      submissionProcessing: true,
      contactPermission: true,
    },
    metadata,
  };
}

async function finishAttempt(outboxId, delivered, error = null) {
  return supabaseServiceRequest('/rest/v1/rpc/iww_finish_notification_attempt', {
    method: 'POST',
    body: {
      p_outbox_id: outboxId,
      p_delivered: delivered,
      p_error: error,
    },
  });
}

async function processItem(item) {
  const previous = await hasSuccessfulNotification({
    submissionKind: item.submission_kind,
    submissionId: item.submission_id,
  });
  if (previous.ok && previous.sent) {
    await finishAttempt(item.outbox_id, true, null);
    return { outboxId: item.outbox_id, outcome: 'already-sent' };
  }

  const loaded = await loadSubmission(item.submission_kind, item.submission_id);
  if (!loaded.ok) {
    await finishAttempt(item.outbox_id, false, loaded.error || 'submission_load_failed');
    return { outboxId: item.outbox_id, outcome: 'retry', error: loaded.error || 'submission_load_failed' };
  }

  const payload = payloadFor(item.submission_kind, loaded.data);
  const delivered = await forwardWebhook(
    item.submission_kind === 'membership_application'
      ? process.env.MEMBERSHIP_WEBHOOK_URL
      : process.env.INQUIRY_WEBHOOK_URL,
    payload,
    process.env.WORKFLOW_WEBHOOK_SECRET,
  );

  await recordNotificationDelivery({
    submissionKind: item.submission_kind,
    submissionId: item.submission_id,
    delivered,
  });
  await finishAttempt(item.outbox_id, delivered.ok, delivered.ok ? null : delivered.error);

  return {
    outboxId: item.outbox_id,
    outcome: delivered.ok ? 'sent' : 'retry',
    ...(delivered.ok ? {} : { error: delivered.error }),
  };
}

export default async function handler(req, res) {
  applySecurityHeaders(req, res);
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  if (!secretMatches(req)) {
    return res.status(401).json({ error: 'worker_authentication_required' });
  }

  const claimed = await supabaseServiceRequest('/rest/v1/rpc/iww_claim_notification_batch', {
    method: 'POST',
    body: { p_limit: 25 },
  });
  if (!claimed.ok) {
    return res.status(claimed.status || 502).json({ error: 'outbox_claim_failed' });
  }

  const items = Array.isArray(claimed.data) ? claimed.data : [];
  const results = [];
  for (const item of items) {
    results.push(await processItem(item));
  }

  return res.status(200).json({
    status: 'processed',
    claimed: items.length,
    sent: results.filter((item) => item.outcome === 'sent').length,
    alreadySent: results.filter((item) => item.outcome === 'already-sent').length,
    retry: results.filter((item) => item.outcome === 'retry').length,
    results,
  });
}

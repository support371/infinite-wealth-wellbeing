import { applySecurityHeaders } from '../../server/http.js';
import { internalBearerMatches } from '../../server/internal-auth.js';
import { sendTransactionalEmailRequest } from '../../server/email-adapter.js';
import {
  hasSuccessfulEmailDelivery,
  recordEmailDelivery,
} from '../../server/persistence.js';
import { supabaseServiceRequest } from '../../server/supabase-server.js';

function tableFor(kind) {
  return kind === 'membership_application' ? 'iww_membership_applications' : 'iww_inquiries';
}

async function loadReference(kind, submissionId) {
  const query = new URLSearchParams({
    id: `eq.${submissionId}`,
    select: 'id,reference',
    limit: '1',
  });
  const result = await supabaseServiceRequest(`/rest/v1/${tableFor(kind)}?${query.toString()}`);
  if (!result.ok) return result;
  const row = Array.isArray(result.data) ? result.data[0] : null;
  return row
    ? { ok: true, data: row }
    : { ok: false, status: 404, error: 'submission_not_found' };
}

async function finishAttempt(outboxId, delivered, error = null) {
  return supabaseServiceRequest('/rest/v1/rpc/iww_finish_email_attempt', {
    method: 'POST',
    body: {
      p_outbox_id: outboxId,
      p_delivered: delivered,
      p_error: error,
    },
  });
}

function finishStatus(result) {
  const raw = Array.isArray(result?.data) ? result.data[0] : result?.data;
  return typeof raw?.status === 'string' ? raw.status : null;
}

async function processItem(item) {
  const previous = await hasSuccessfulEmailDelivery({
    submissionKind: item.submission_kind,
    submissionId: item.submission_id,
  });
  if (previous.ok && previous.sent) {
    const finished = await finishAttempt(item.outbox_id, true, null);
    return {
      outboxId: item.outbox_id,
      outcome: finished.ok && finishStatus(finished) === 'delivered' ? 'already-sent' : 'retry',
    };
  }

  const loaded = await loadReference(item.submission_kind, item.submission_id);
  if (!loaded.ok) {
    await finishAttempt(item.outbox_id, false, loaded.error || 'submission_load_failed');
    return { outboxId: item.outbox_id, outcome: 'retry', error: loaded.error || 'submission_load_failed' };
  }

  const delivery = await sendTransactionalEmailRequest({
    outboxId: item.outbox_id,
    payload: {
      type: 'iww.transactional_email.requested',
      templateKey: item.template_key,
      recipientEmail: item.recipient_email,
      reference: loaded.data.reference,
      submissionKind: item.submission_kind,
      submissionId: item.submission_id,
    },
  });

  const recorded = await recordEmailDelivery({
    submissionKind: item.submission_kind,
    submissionId: item.submission_id,
    delivered: delivery,
    attempt: item.attempt_count,
    provider: delivery.provider || 'email-adapter-webhook',
    providerMessageId: delivery.providerMessageId || null,
  });

  const evidenceReady = delivery.ok && recorded.ok;
  const error = delivery.ok
    ? (recorded.ok ? null : 'email_delivery_record_failed')
    : delivery.error;
  const finished = await finishAttempt(item.outbox_id, evidenceReady, error);
  const status = finishStatus(finished);

  return {
    outboxId: item.outbox_id,
    outcome: finished.ok && status === 'delivered' ? 'sent' : 'retry',
    ...(error ? { error } : {}),
  };
}

export default async function handler(req, res) {
  applySecurityHeaders(req, res);
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  if (!internalBearerMatches(req, 'IWW_EMAIL_WORKER_SECRET')) {
    return res.status(401).json({ error: 'email_worker_authentication_required' });
  }

  const claimed = await supabaseServiceRequest('/rest/v1/rpc/iww_claim_email_batch', {
    method: 'POST',
    body: { p_limit: 25 },
  });
  if (!claimed.ok) return res.status(claimed.status || 502).json({ error: 'email_outbox_claim_failed' });

  const items = Array.isArray(claimed.data) ? claimed.data : [];
  const results = [];
  for (const item of items) results.push(await processItem(item));

  return res.status(200).json({
    status: 'processed',
    claimed: items.length,
    sent: results.filter((item) => item.outcome === 'sent').length,
    alreadySent: results.filter((item) => item.outcome === 'already-sent').length,
    retry: results.filter((item) => item.outcome === 'retry').length,
    results,
  });
}

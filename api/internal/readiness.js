import { applySecurityHeaders } from '../../server/http.js';
import { internalBearerMatches } from '../../server/internal-auth.js';
import { emailDeliveryConfigured } from '../../server/email-adapter.js';
import { getSupabaseServerConfig, supabaseServiceRequest } from '../../server/supabase-server.js';

async function tableReachable(table, select) {
  const query = new URLSearchParams({ select, limit: '1' });
  const result = await supabaseServiceRequest(`/rest/v1/${table}?${query.toString()}`);
  return { ok: result.ok, status: result.status || null, error: result.ok ? null : result.error };
}

function count(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric >= 0 ? numeric : 0;
}

function normalizedOperations(result) {
  const raw = Array.isArray(result?.data) ? result.data[0] : result?.data;
  if (!result?.ok || !raw || typeof raw !== 'object') {
    return {
      ok: false,
      error: result?.error || 'operational_snapshot_invalid',
      notificationOutbox: { queued: 0, processing: 0, deadLetter: 0, stuckProcessing: 0, oldestQueuedAt: null },
      emailOutbox: { queued: 0, processing: 0, deadLetter: 0, stuckProcessing: 0, oldestQueuedAt: null },
      reviewQueue: { inquiriesOpen: 0, membershipApplicationsOpen: 0 },
      deliveryFailures24h: 0,
      capturedAt: null,
    };
  }
  return {
    ok: true,
    error: null,
    notificationOutbox: {
      queued: count(raw.notificationOutbox?.queued),
      processing: count(raw.notificationOutbox?.processing),
      deadLetter: count(raw.notificationOutbox?.deadLetter),
      stuckProcessing: count(raw.notificationOutbox?.stuckProcessing),
      oldestQueuedAt: raw.notificationOutbox?.oldestQueuedAt || null,
    },
    emailOutbox: {
      queued: count(raw.emailOutbox?.queued),
      processing: count(raw.emailOutbox?.processing),
      deadLetter: count(raw.emailOutbox?.deadLetter),
      stuckProcessing: count(raw.emailOutbox?.stuckProcessing),
      oldestQueuedAt: raw.emailOutbox?.oldestQueuedAt || null,
    },
    reviewQueue: {
      inquiriesOpen: count(raw.reviewQueue?.inquiriesOpen),
      membershipApplicationsOpen: count(raw.reviewQueue?.membershipApplicationsOpen),
    },
    deliveryFailures24h: count(raw.deliveryFailures24h),
    capturedAt: raw.capturedAt || null,
  };
}

export default async function handler(req, res) {
  applySecurityHeaders(req, res);
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  if (!internalBearerMatches(req)) {
    return res.status(401).json({ error: 'internal_authentication_required' });
  }

  const configChecks = {
    publicOriginConfigured: Boolean(process.env.PUBLIC_APP_ORIGIN),
    inquiryWorkflowConfigured: Boolean(process.env.INQUIRY_WEBHOOK_URL),
    membershipWorkflowConfigured: Boolean(process.env.MEMBERSHIP_WEBHOOK_URL),
    workflowSigningConfigured: Boolean(process.env.WORKFLOW_WEBHOOK_SECRET),
    persistenceConfigured: Boolean(getSupabaseServerConfig()),
    notificationWorkerSecretConfigured: Boolean(process.env.IWW_NOTIFICATION_WORKER_SECRET),
    emailDeliveryConfigured: emailDeliveryConfigured(),
    emailWorkerSecretConfigured: Boolean(process.env.IWW_EMAIL_WORKER_SECRET),
  };

  const databaseChecks = configChecks.persistenceConfigured
    ? {
        inquiries: await tableReachable('iww_inquiries', 'id'),
        membershipApplications: await tableReachable('iww_membership_applications', 'id'),
        roles: await tableReachable('iww_user_roles', 'user_id'),
        auditEvents: await tableReachable('iww_audit_events', 'id'),
        notificationOutbox: await tableReachable('iww_notification_outbox', 'id'),
        emailOutbox: await tableReachable('iww_email_outbox', 'id'),
      }
    : {
        inquiries: { ok: false, status: null, error: 'persistence_not_configured' },
        membershipApplications: { ok: false, status: null, error: 'persistence_not_configured' },
        roles: { ok: false, status: null, error: 'persistence_not_configured' },
        auditEvents: { ok: false, status: null, error: 'persistence_not_configured' },
        notificationOutbox: { ok: false, status: null, error: 'persistence_not_configured' },
        emailOutbox: { ok: false, status: null, error: 'persistence_not_configured' },
      };

  const operationsResult = configChecks.persistenceConfigured
    ? await supabaseServiceRequest('/rest/v1/rpc/iww_operational_snapshot', { method: 'POST', body: {} })
    : { ok: false, error: 'persistence_not_configured' };
  const operations = normalizedOperations(operationsResult);

  const configReady = Object.values(configChecks).every(Boolean);
  const schemaReady = Object.values(databaseChecks).every((check) => check.ok);
  const operationsReady = operations.ok
    && operations.notificationOutbox.deadLetter === 0
    && operations.notificationOutbox.stuckProcessing === 0
    && operations.emailOutbox.deadLetter === 0
    && operations.emailOutbox.stuckProcessing === 0;
  const ready = configReady && schemaReady && operationsReady;

  return res.status(ready ? 200 : 503).json({
    status: ready ? 'ready' : 'degraded',
    checks: { configuration: configChecks, database: databaseChecks, operations },
    timestamp: new Date().toISOString(),
  });
}

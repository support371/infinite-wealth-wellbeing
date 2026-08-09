import { applySecurityHeaders } from '../../server/http.js';
import { internalBearerMatches } from '../../server/internal-auth.js';
import { getSupabaseServerConfig, supabaseServiceRequest } from '../../server/supabase-server.js';

async function tableReachable(table, select) {
  const query = new URLSearchParams({ select, limit: '1' });
  const result = await supabaseServiceRequest(`/rest/v1/${table}?${query.toString()}`);
  return {
    ok: result.ok,
    status: result.status || null,
    error: result.ok ? null : result.error,
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

  const configReady = Object.values(configChecks).every(Boolean);
  const schemaReady = Object.values(databaseChecks).every((check) => check.ok);
  const ready = configReady && schemaReady;

  return res.status(ready ? 200 : 503).json({
    status: ready ? 'ready' : 'degraded',
    checks: {
      configuration: configChecks,
      database: databaseChecks,
    },
    timestamp: new Date().toISOString(),
  });
}

import { applySecurityHeaders } from '../server/http.js';
import { emailDeliveryConfigured } from '../server/email-adapter.js';

export default function handler(req, res) {
  applySecurityHeaders(req, res);

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const checks = {
    inquiryWorkflowConfigured: Boolean(process.env.INQUIRY_WEBHOOK_URL),
    membershipWorkflowConfigured: Boolean(process.env.MEMBERSHIP_WEBHOOK_URL),
    workflowSigningConfigured: Boolean(process.env.WORKFLOW_WEBHOOK_SECRET),
    publicOriginConfigured: Boolean(process.env.PUBLIC_APP_ORIGIN),
    persistenceUrlConfigured: Boolean(process.env.IWW_SUPABASE_URL),
    persistenceServiceRoleConfigured: Boolean(process.env.IWW_SUPABASE_SERVICE_ROLE_KEY),
    notificationWorkerSecretConfigured: Boolean(process.env.IWW_NOTIFICATION_WORKER_SECRET),
    emailDeliveryConfigured: emailDeliveryConfigured(),
    emailWorkerSecretConfigured: Boolean(process.env.IWW_EMAIL_WORKER_SECRET),
  };

  const ready = Object.values(checks).every(Boolean);

  return res.status(ready ? 200 : 503).json({
    status: ready ? 'ready' : 'degraded',
    service: 'infinite-wealth-wellbeing-api',
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'unknown',
    checks,
    timestamp: new Date().toISOString(),
  });
}

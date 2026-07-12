import { applySecurityHeaders } from './_lib/http.js';

export default function handler(req, res) {
  applySecurityHeaders(req, res);

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const checks = {
    inquiryWorkflowConfigured: Boolean(process.env.INQUIRY_WEBHOOK_URL),
    membershipWorkflowConfigured: Boolean(process.env.MEMBERSHIP_WEBHOOK_URL),
    publicOriginConfigured: Boolean(process.env.PUBLIC_APP_ORIGIN),
  };

  const ready = checks.inquiryWorkflowConfigured && checks.membershipWorkflowConfigured;

  return res.status(ready ? 200 : 503).json({
    status: ready ? 'ready' : 'degraded',
    service: 'infinite-wealth-wellbeing-api',
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'unknown',
    checks,
    timestamp: new Date().toISOString(),
  });
}

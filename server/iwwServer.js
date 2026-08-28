import { createClient } from '@supabase/supabase-js';

const adminRoles = new Set(['owner', 'admin']);

export function getServerSupabase() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function isSameOriginMutation(req) {
  const origin = req.headers.origin;
  if (!origin) return false;
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const requestOrigin = `${protocol}://${host}`;
  const configured = process.env.IWW_APP_ORIGIN?.replace(/\/$/, '');
  return origin === requestOrigin || (configured && origin === configured);
}

export async function authenticateIwwRequest(req) {
  const client = getServerSupabase();
  if (!client) return { ok: false, status: 503, error: 'iww_server_not_configured' };
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) return { ok: false, status: 401, error: 'authentication_required' };
  const { data, error } = await client.auth.getUser(token);
  if (error || !data?.user) return { ok: false, status: 401, error: 'invalid_session' };
  return { ok: true, client, user: data.user };
}

export async function requireOrganizationRole(auth, organizationId, allowedRoles = null) {
  if (!organizationId) return { ok: false, status: 400, error: 'organization_required' };
  const { data, error } = await auth.client
    .from('memberships')
    .select('id, organization_id, user_id, role, status')
    .eq('organization_id', organizationId)
    .eq('user_id', auth.user.id)
    .eq('status', 'active')
    .maybeSingle();
  if (error) return { ok: false, status: 500, error: 'membership_lookup_failed' };
  if (!data) return { ok: false, status: 403, error: 'organization_access_denied' };
  if (allowedRoles && !allowedRoles.includes(data.role)) return { ok: false, status: 403, error: 'role_not_authorized' };
  return { ok: true, membership: data };
}

export async function writeServerAudit(client, { organizationId, actorId, action, targetType, targetId = null, metadata = {} }) {
  await client.from('audit_events').insert({
    organization_id: organizationId,
    actor_user_id: actorId,
    action,
    target_type: targetType,
    target_id: targetId,
    metadata,
  });
}

export const IWW_ADMIN_ROLES = [...adminRoles];

export async function verifyHubSpot() {
  if (!process.env.HUBSPOT_ACCESS_TOKEN) return { ok: false, status: 'not_configured' };
  const response = await fetch('https://api.hubapi.com/account-info/v3/details', {
    headers: { Authorization: `Bearer ${process.env.HUBSPOT_ACCESS_TOKEN}` },
  });
  if (!response.ok) return { ok: false, status: 'verification_failed' };
  const body = await response.json();
  return { ok: true, status: 'connected', accountId: body.portalId ? String(body.portalId) : null };
}

export async function verifyStripe() {
  if (!process.env.STRIPE_SECRET_KEY) return { ok: false, status: 'not_configured' };
  const response = await fetch('https://api.stripe.com/v1/balance', {
    headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` },
  });
  return response.ok ? { ok: true, status: 'configured' } : { ok: false, status: 'verification_failed' };
}

export async function createStripeBillingPortal(customerId, returnUrl) {
  if (!process.env.STRIPE_SECRET_KEY) return { ok: false, error: 'stripe_not_configured' };
  const body = new URLSearchParams({ customer: customerId, return_url: returnUrl });
  const response = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.url) return { ok: false, error: payload?.error?.message || 'stripe_portal_failed' };
  return { ok: true, url: payload.url };
}

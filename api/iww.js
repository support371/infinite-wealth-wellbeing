import {
  IWW_ADMIN_ROLES,
  authenticateIwwRequest,
  createStripeBillingPortal,
  isSameOriginMutation,
  requireOrganizationRole,
  verifyHubSpot,
  verifyStripe,
  writeServerAudit,
} from '../server/iwwServer.js';

function send(res, status, payload) {
  res.status(status).setHeader('Cache-Control', 'no-store').json(payload);
}

function appOrigin(req) {
  if (process.env.IWW_APP_ORIGIN) return process.env.IWW_APP_ORIGIN.replace(/\/$/, '');
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return `${protocol}://${host}`;
}

async function upsertIntegration(client, organizationId, provider, patch) {
  const { data, error } = await client
    .from('integration_connections')
    .upsert({
      organization_id: organizationId,
      provider,
      ...patch,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'organization_id,provider' })
    .select('id, organization_id, provider, status, external_account_id, connected_at, revoked_at, updated_at')
    .single();
  if (error) throw error;
  return data;
}

async function handleIntegration(req, res, auth, membership, body) {
  const provider = String(body.provider || '').trim().toLowerCase();
  const operation = String(body.operation || '').trim().toLowerCase();
  const allowed = new Set(['hubspot', 'google_calendar', 'stripe']);
  if (!allowed.has(provider)) return send(res, 400, { error: 'unsupported_provider' });
  if (!['connect', 'revoke'].includes(operation)) return send(res, 400, { error: 'unsupported_operation' });

  if (operation === 'revoke') {
    const record = await upsertIntegration(auth.client, membership.organization_id, provider, {
      status: 'revoked',
      revoked_at: new Date().toISOString(),
      connected_at: null,
      external_account_id: null,
      connection_metadata: {},
    });
    await writeServerAudit(auth.client, {
      organizationId: membership.organization_id,
      actorId: auth.user.id,
      action: 'integration.revoked',
      targetType: 'integration_connection',
      targetId: record.id,
      metadata: { provider },
    });
    return send(res, 200, { ok: true, connection: record, message: `${provider.replaceAll('_', ' ')} connection revoked.` });
  }

  if (provider === 'google_calendar') {
    return send(res, 409, {
      error: 'human_authorization_required',
      provider,
      message: 'Google Calendar requires a user-consented OAuth flow before it can be represented as connected.',
    });
  }

  let verification;
  if (provider === 'hubspot') verification = await verifyHubSpot();
  if (provider === 'stripe') verification = await verifyStripe();

  if (!verification?.ok) {
    return send(res, verification?.status === 'not_configured' ? 503 : 502, {
      error: verification?.status || 'provider_verification_failed',
      provider,
      message: `${provider} has not passed server-side verification for this IWW deployment.`,
    });
  }

  const record = await upsertIntegration(auth.client, membership.organization_id, provider, {
    status: provider === 'stripe' ? 'configured' : 'connected',
    connected_at: new Date().toISOString(),
    revoked_at: null,
    external_account_id: verification.accountId || null,
    connection_metadata: { verified_at: new Date().toISOString() },
  });
  await writeServerAudit(auth.client, {
    organizationId: membership.organization_id,
    actorId: auth.user.id,
    action: 'integration.verified',
    targetType: 'integration_connection',
    targetId: record.id,
    metadata: { provider, status: record.status },
  });
  return send(res, 200, { ok: true, connection: record, message: `${provider.replaceAll('_', ' ')} server verification passed.` });
}

async function handleBillingPortal(req, res, auth, membership) {
  const { data: subscriptions, error } = await auth.client
    .from('subscriptions')
    .select('id, provider, provider_customer_id, user_id, status')
    .eq('organization_id', membership.organization_id)
    .eq('provider', 'stripe')
    .in('status', ['active', 'trialing', 'past_due'])
    .order('created_at', { ascending: false })
    .limit(10);
  if (error) return send(res, 500, { error: 'billing_lookup_failed' });

  const eligible = membership.role === 'member'
    ? subscriptions?.find((item) => item.user_id === auth.user.id)
    : subscriptions?.[0];
  if (!eligible?.provider_customer_id) {
    return send(res, 409, { error: 'billing_customer_not_configured', message: 'No eligible Stripe customer reference exists for this account.' });
  }

  const portal = await createStripeBillingPortal(eligible.provider_customer_id, `${appOrigin(req)}/app/billing`);
  if (!portal.ok) return send(res, 503, { error: portal.error || 'billing_portal_unavailable' });

  await writeServerAudit(auth.client, {
    organizationId: membership.organization_id,
    actorId: auth.user.id,
    action: 'billing.portal_requested',
    targetType: 'subscription',
    targetId: eligible.id,
  });
  return send(res, 200, { ok: true, url: portal.url });
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return send(res, 405, { error: 'method_not_allowed' });
  if (!isSameOriginMutation(req)) return send(res, 403, { error: 'origin_not_allowed' });

  const auth = await authenticateIwwRequest(req);
  if (!auth.ok) return send(res, auth.status, { error: auth.error });

  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const organizationId = String(body.organizationId || '').trim();
  const resource = String(req.query?.resource || '').trim();
  const allowedRoles = resource === 'billing-portal' ? [...IWW_ADMIN_ROLES, 'member'] : IWW_ADMIN_ROLES;
  const access = await requireOrganizationRole(auth, organizationId, allowedRoles);
  if (!access.ok) return send(res, access.status, { error: access.error });

  try {
    if (resource === 'integration') return await handleIntegration(req, res, auth, access.membership, body);
    if (resource === 'billing-portal') return await handleBillingPortal(req, res, auth, access.membership);
    return send(res, 404, { error: 'unknown_resource' });
  } catch (error) {
    console.error('[iww-api]', error instanceof Error ? error.message : error);
    return send(res, 500, { error: 'iww_server_operation_failed' });
  }
}

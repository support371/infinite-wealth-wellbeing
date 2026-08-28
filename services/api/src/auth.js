import { createClient } from '@supabase/supabase-js';

function serverClient() {
  const url = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secretKey) throw new Error('server_supabase_not_configured');
  return createClient(url, secretKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function authenticateRequest(req, res, next) {
  const authorization = req.headers.authorization || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (!token) return res.status(401).json({ error: 'authentication_required' });
  try {
    const client = serverClient();
    const { data: { user }, error: userError } = await client.auth.getUser(token);
    if (userError || !user) return res.status(401).json({ error: 'invalid_or_expired_session' });
    const organizationId = req.headers['x-iww-organization-id'];
    if (!organizationId) return res.status(400).json({ error: 'organization_context_required' });
    const { data: membership, error: membershipError } = await client.from('memberships').select('id,organization_id,user_id,role,status').eq('organization_id', organizationId).eq('user_id', user.id).eq('status', 'active').maybeSingle();
    if (membershipError || !membership) return res.status(403).json({ error: 'organization_access_denied' });
    req.user = user;
    req.membership = membership;
    req.organizationId = organizationId;
    req.supabase = client;
    return next();
  } catch {
    return res.status(503).json({ error: 'identity_service_unavailable', requestId: req.id });
  }
}

export function requireAuthenticated(req, res, next) {
  if (!req.user || !req.membership) return res.status(401).json({ error: 'authentication_required' });
  return next();
}

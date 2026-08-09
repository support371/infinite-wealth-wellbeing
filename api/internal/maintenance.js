import { applySecurityHeaders } from '../_lib/http.js';
import { internalBearerMatches } from '../_lib/internal-auth.js';
import { supabaseServiceRequest } from '../_lib/supabase-server.js';

export default async function handler(req, res) {
  applySecurityHeaders(req, res);
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  if (!internalBearerMatches(req)) {
    return res.status(401).json({ error: 'internal_authentication_required' });
  }

  const result = await supabaseServiceRequest('/rest/v1/rpc/iww_purge_expired_idempotency', {
    method: 'POST',
    body: { p_limit: 5000 },
  });

  if (!result.ok) {
    return res.status(result.status || 502).json({ error: 'maintenance_failed' });
  }

  const raw = Array.isArray(result.data) ? result.data[0] : result.data;
  const deleted = Number.isFinite(Number(raw)) ? Number(raw) : 0;

  return res.status(200).json({
    status: 'completed',
    expiredIdempotencyRecordsDeleted: deleted,
    substantiveRecordsDeleted: 0,
    timestamp: new Date().toISOString(),
  });
}

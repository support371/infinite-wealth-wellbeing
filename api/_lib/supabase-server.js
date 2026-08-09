const DEFAULT_TIMEOUT_MS = 8000;

export function getSupabaseServerConfig() {
  const rawUrl = process.env.IWW_SUPABASE_URL;
  const serviceRoleKey = process.env.IWW_SUPABASE_SERVICE_ROLE_KEY;
  if (!rawUrl || !serviceRoleKey) return null;

  try {
    const parsed = new URL(rawUrl);
    const local = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
    if (parsed.protocol !== 'https:' && !local) return null;
    return { baseUrl: parsed.origin, serviceRoleKey };
  } catch {
    return null;
  }
}

function serviceHeaders(serviceRoleKey, extra = {}) {
  return {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    'Content-Type': 'application/json',
    ...extra,
  };
}

export async function supabaseServiceRequest(path, { method = 'GET', body, headers = {}, timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  const config = getSupabaseServerConfig();
  if (!config) return { ok: false, status: 503, error: 'persistence_not_configured' };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${config.baseUrl}${path}`, {
      method,
      headers: serviceHeaders(config.serviceRoleKey, headers),
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      signal: controller.signal,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return {
        ok: false,
        status: response.status || 502,
        error: 'supabase_request_failed',
        data,
      };
    }
    return { ok: true, status: response.status || 200, data };
  } catch {
    return { ok: false, status: 502, error: 'persistence_unavailable' };
  } finally {
    clearTimeout(timeout);
  }
}

export async function validateSupabaseAccessToken(accessToken) {
  const config = getSupabaseServerConfig();
  if (!config) return { ok: false, status: 503, error: 'auth_not_configured' };
  if (!accessToken) return { ok: false, status: 401, error: 'authentication_required' };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  try {
    const response = await fetch(`${config.baseUrl}/auth/v1/user`, {
      method: 'GET',
      headers: {
        apikey: config.serviceRoleKey,
        Authorization: `Bearer ${accessToken}`,
      },
      signal: controller.signal,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data?.id) {
      return { ok: false, status: 401, error: 'invalid_access_token' };
    }
    return { ok: true, user: data };
  } catch {
    return { ok: false, status: 502, error: 'auth_unavailable' };
  } finally {
    clearTimeout(timeout);
  }
}

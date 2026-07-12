const DEFAULT_ALLOWED_ORIGIN = 'https://infinite-wealth-wellbeing.vercel.app';

export function applySecurityHeaders(req, res) {
  const configuredOrigin = process.env.PUBLIC_APP_ORIGIN || DEFAULT_ALLOWED_ORIGIN;
  const requestOrigin = req.headers.origin;

  if (requestOrigin && requestOrigin === configuredOrigin) {
    res.setHeader('Access-Control-Allow-Origin', requestOrigin);
    res.setHeader('Vary', 'Origin');
  }

  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Idempotency-Key');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options', 'DENY');
}

export function handleOptions(req, res) {
  if (req.method !== 'OPTIONS') return false;
  applySecurityHeaders(req, res);
  res.status(204).end();
  return true;
}

export function requirePost(req, res) {
  if (req.method === 'POST') return true;
  res.setHeader('Allow', 'POST, OPTIONS');
  res.status(405).json({ error: 'method_not_allowed' });
  return false;
}

export function getBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return null;
    }
  }
  return null;
}

export function cleanText(value, maxLength) {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/\s+/g, ' ').slice(0, maxLength);
}

export function cleanMultiline(value, maxLength) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLength);
}

export function isValidEmail(value) {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}

export function requestMetadata(req) {
  return {
    requestId: req.headers['x-vercel-id'] || null,
    userAgent: cleanText(req.headers['user-agent'] || '', 300),
    submittedAt: new Date().toISOString(),
  };
}

export async function forwardWebhook(url, payload, secret) {
  if (!url) {
    return { ok: false, status: 503, error: 'workflow_not_configured' };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(secret ? { 'X-IWW-Webhook-Secret': secret } : {}),
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      return { ok: false, status: 502, error: 'workflow_delivery_failed' };
    }

    return { ok: true };
  } catch {
    return { ok: false, status: 502, error: 'workflow_unavailable' };
  } finally {
    clearTimeout(timeout);
  }
}

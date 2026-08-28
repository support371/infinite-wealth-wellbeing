const EMAIL_TIMEOUT_MS = 8000;

function configuration() {
  const rawUrl = process.env.IWW_EMAIL_DELIVERY_URL;
  const secret = process.env.IWW_EMAIL_DELIVERY_SECRET;
  if (!rawUrl || !secret) return null;

  try {
    const parsed = new URL(rawUrl);
    const local = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
    if (parsed.protocol !== 'https:' && !local) return null;
    return { url: parsed.toString(), secret };
  } catch {
    return null;
  }
}

export function emailDeliveryConfigured() {
  return Boolean(configuration());
}

export async function sendTransactionalEmailRequest({ outboxId, payload }) {
  const config = configuration();
  if (!config) return { ok: false, status: 503, error: 'email_delivery_not_configured' };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), EMAIL_TIMEOUT_MS);
  try {
    const response = await fetch(config.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-IWW-Email-Delivery-Secret': config.secret,
        'Idempotency-Key': `iww-email-${outboxId}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return { ok: false, status: 502, error: 'email_delivery_failed' };
    }
    const providerMessageId = typeof data?.messageId === 'string'
      ? data.messageId.trim().slice(0, 200) || null
      : null;
    return { ok: true, provider: 'email-adapter-webhook', providerMessageId };
  } catch {
    return { ok: false, status: 502, error: 'email_delivery_unavailable' };
  } finally {
    clearTimeout(timeout);
  }
}

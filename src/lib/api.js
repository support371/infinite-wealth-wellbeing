import { requireSupabase } from './supabase';

export async function apiRequest(path, organizationId, options = {}) {
  const { data: { session }, error: sessionError } = await requireSupabase().auth.getSession();
  if (sessionError || !session?.access_token) throw new Error('Your session has expired. Please sign in again.');

  const response = await fetch(`/api/v1${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
      'X-IWW-Organization-Id': organizationId,
      ...options.headers
    }
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload.message || payload.error || `Request failed (${response.status})`;
    throw new Error(message.replaceAll('_', ' '));
  }
  return payload;
}

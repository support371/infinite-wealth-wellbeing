import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();

export const supabaseConfigured = Boolean(url && publishableKey);

export const supabase = supabaseConfigured
  ? createClient(url, publishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
      global: {
        headers: {
          'X-Client-Info': 'iww-web/2.0',
        },
      },
    })
  : null;

export function requireSupabase() {
  if (!supabase) {
    throw new Error('IWW Supabase is not configured for this deployment.');
  }
  return supabase;
}

export function getIwwAuthRedirect(path = '/auth/callback') {
  const base = import.meta.env.VITE_APP_URL?.trim() || window.location.origin;
  return new URL(path, base).toString();
}

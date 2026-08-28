import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const isSupabaseConfigured = Boolean(
  url && publishableKey && /^https:\/\/.+\.supabase\.co$/.test(url) && publishableKey.length > 20
);

export const supabase = isSupabaseConfigured
  ? createClient(url, publishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
      }
    })
  : null;

export function requireSupabase() {
  if (!supabase) {
    throw new Error('IWW data service is not configured. Add the dedicated IWW Supabase public variables.');
  }
  return supabase;
}

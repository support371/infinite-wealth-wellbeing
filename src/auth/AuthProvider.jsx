import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getIwwAuthRedirect, requireSupabase, supabaseConfigured } from '../lib/supabase.js';

const AuthContext = createContext(null);
const ACTIVE_ORG_KEY = 'iww:active-organization';

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [memberships, setMemberships] = useState([]);
  const [activeMembership, setActiveMembership] = useState(null);
  const [loading, setLoading] = useState(true);
  const [contextLoading, setContextLoading] = useState(false);
  const [error, setError] = useState(null);

  const refreshContext = useCallback(async (nextSession = session) => {
    if (!supabaseConfigured || !nextSession?.user) {
      setProfile(null);
      setMemberships([]);
      setActiveMembership(null);
      return;
    }
    setContextLoading(true);
    setError(null);
    try {
      const client = requireSupabase();
      const userId = nextSession.user.id;
      const [{ data: profileRow, error: profileError }, { data: membershipRows, error: membershipError }] = await Promise.all([
        client.from('profiles').select('*').eq('user_id', userId).maybeSingle(),
        client
          .from('memberships')
          .select('id, organization_id, user_id, role, status, created_at, organizations(id,name,slug,status)')
          .eq('user_id', userId)
          .eq('status', 'active')
          .order('created_at', { ascending: true }),
      ]);
      if (profileError) throw profileError;
      if (membershipError) throw membershipError;
      const rows = membershipRows || [];
      setProfile(profileRow || null);
      setMemberships(rows);
      const remembered = window.localStorage.getItem(ACTIVE_ORG_KEY);
      const selected = rows.find((item) => item.organization_id === remembered) || rows[0] || null;
      setActiveMembership(selected);
      if (selected) window.localStorage.setItem(ACTIVE_ORG_KEY, selected.organization_id);
    } catch (contextError) {
      setError(contextError instanceof Error ? contextError.message : 'Unable to load IWW account context.');
      setMemberships([]);
      setActiveMembership(null);
    } finally {
      setContextLoading(false);
    }
  }, [session]);

  useEffect(() => {
    let mounted = true;
    if (!supabaseConfigured) {
      setLoading(false);
      return undefined;
    }
    const client = requireSupabase();
    client.auth.getSession().then(({ data, error: sessionError }) => {
      if (!mounted) return;
      if (sessionError) setError(sessionError.message);
      setSession(data.session || null);
      return refreshContext(data.session || null);
    }).finally(() => mounted && setLoading(false));

    const { data: subscription } = client.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return;
      setSession(nextSession || null);
      refreshContext(nextSession || null);
    });
    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, [refreshContext]);

  const chooseOrganization = useCallback((organizationId) => {
    const membership = memberships.find((item) => item.organization_id === organizationId) || null;
    setActiveMembership(membership);
    if (membership) window.localStorage.setItem(ACTIVE_ORG_KEY, membership.organization_id);
  }, [memberships]);

  const signIn = useCallback(async (email, password) => {
    const client = requireSupabase();
    const { data, error: authError } = await client.auth.signInWithPassword({ email, password });
    if (authError) throw authError;
    return data;
  }, []);

  const signUp = useCallback(async (email, password, fullName) => {
    const client = requireSupabase();
    const { data, error: authError } = await client.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: getIwwAuthRedirect('/auth/callback'),
      },
    });
    if (authError) throw authError;
    return data;
  }, []);

  const sendPasswordReset = useCallback(async (email) => {
    const client = requireSupabase();
    const { error: authError } = await client.auth.resetPasswordForEmail(email, {
      redirectTo: getIwwAuthRedirect('/auth/reset-password'),
    });
    if (authError) throw authError;
  }, []);

  const updatePassword = useCallback(async (password) => {
    const client = requireSupabase();
    const { error: authError } = await client.auth.updateUser({ password });
    if (authError) throw authError;
  }, []);

  const signOut = useCallback(async () => {
    if (!supabaseConfigured) return;
    const client = requireSupabase();
    await client.auth.signOut();
    window.localStorage.removeItem(ACTIVE_ORG_KEY);
    setProfile(null);
    setMemberships([]);
    setActiveMembership(null);
  }, []);

  const value = useMemo(() => ({
    configured: supabaseConfigured,
    session,
    user: session?.user || null,
    profile,
    memberships,
    activeMembership,
    organization: activeMembership?.organizations || null,
    role: activeMembership?.role || null,
    loading,
    contextLoading,
    error,
    chooseOrganization,
    refreshContext,
    signIn,
    signUp,
    sendPasswordReset,
    updatePassword,
    signOut,
  }), [session, profile, memberships, activeMembership, loading, contextLoading, error, chooseOrganization, refreshContext, signIn, signUp, sendPasswordReset, updatePassword, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used within AuthProvider.');
  return value;
}

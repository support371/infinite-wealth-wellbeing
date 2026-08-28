import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { isSupabaseConfigured, requireSupabase, supabase } from '../lib/supabase';

const AuthContext = createContext(null);
const ACTIVE_ORG_KEY = 'iww.activeOrganization';

async function fetchIdentity(userId) {
  const client = requireSupabase();
  const [{ data: profile, error: profileError }, { data: memberships, error: membershipsError }, { data: platformStaff, error: platformError }] = await Promise.all([
    client.from('profiles').select('*').eq('id', userId).maybeSingle(),
    client
      .from('memberships')
      .select('id, organization_id, role, status, joined_at, organizations(id,name,slug,status,brand_settings)')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at'),
    client.from('platform_staff').select('id,role,status').eq('user_id', userId).eq('status', 'active').maybeSingle()
  ]);
  if (profileError) throw profileError;
  if (membershipsError) throw membershipsError;
  if (platformError && platformError.code !== '42P01') throw platformError;
  return { profile, memberships: memberships || [], platformStaff: platformStaff || null };
}

export function AuthProvider({ children }) {
  const [state, setState] = useState({ loading: true, user: null, profile: null, memberships: [], platformStaff: null, error: null });
  const [activeOrganizationId, setActiveOrganizationId] = useState(() => localStorage.getItem(ACTIVE_ORG_KEY));

  const loadUser = useCallback(async () => {
    if (!supabase) {
      setState({ loading: false, user: null, profile: null, memberships: [], platformStaff: null, error: null });
      return;
    }
    setState((current) => ({ ...current, loading: true, error: null }));
    try {
      const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
      if (claimsError || !claimsData?.claims?.sub) {
        setState({ loading: false, user: null, profile: null, memberships: [], platformStaff: null, error: null });
        return;
      }
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      const identity = await fetchIdentity(userData.user.id);
      setState({ loading: false, user: userData.user, ...identity, error: null });
    } catch (error) {
      setState({ loading: false, user: null, profile: null, memberships: [], platformStaff: null, error: error.message });
    }
  }, []);

  useEffect(() => {
    loadUser();
    if (!supabase) return undefined;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setState({ loading: false, user: null, profile: null, memberships: [], platformStaff: null, error: null });
      } else if (['SIGNED_IN', 'TOKEN_REFRESHED', 'USER_UPDATED'].includes(event)) {
        queueMicrotask(loadUser);
      }
    });
    return () => subscription.unsubscribe();
  }, [loadUser]);

  const activeMembership = useMemo(() => {
    if (!state.memberships.length) return null;
    return state.memberships.find((membership) => membership.organization_id === activeOrganizationId) || state.memberships[0];
  }, [activeOrganizationId, state.memberships]);

  useEffect(() => {
    if (activeMembership && activeMembership.organization_id !== activeOrganizationId) {
      setActiveOrganizationId(activeMembership.organization_id);
      localStorage.setItem(ACTIVE_ORG_KEY, activeMembership.organization_id);
    }
  }, [activeMembership, activeOrganizationId]);

  const selectOrganization = (organizationId) => {
    if (!state.memberships.some((membership) => membership.organization_id === organizationId)) return;
    localStorage.setItem(ACTIVE_ORG_KEY, organizationId);
    setActiveOrganizationId(organizationId);
  };

  const signIn = async (email, password) => requireSupabase().auth.signInWithPassword({ email, password });
  const signUp = async (email, password, fullName) => requireSupabase().auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName }, emailRedirectTo: `${window.location.origin}/auth/callback` }
  });
  const sendPasswordReset = async (email) => requireSupabase().auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`
  });
  const updatePassword = async (password) => requireSupabase().auth.updateUser({ password });
  const signOut = async () => requireSupabase().auth.signOut({ scope: 'local' });

  const completeProfile = async (values) => {
    const client = requireSupabase();
    const { error } = await client.from('profiles').upsert({
      id: state.user.id,
      full_name: values.fullName.trim(),
      display_name: values.displayName?.trim() || values.fullName.trim(),
      timezone: values.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      onboarding_completed: true
    });
    if (error) throw error;
    await loadUser();
  };

  const createOrganization = async ({ name, slug, engagementType, projectName, projectSummary, managementMode }) => {
    const client = requireSupabase();
    const normalizedSlug = slug.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const { data: organization, error } = await client
      .rpc('create_managed_organization_with_owner', {
        p_name: name.trim(),
        p_slug: normalizedSlug,
        p_engagement_type: engagementType,
        p_project_name: projectName.trim(),
        p_project_summary: projectSummary.trim(),
        p_management_mode: managementMode
      })
      .single();
    if (error) throw error;
    await loadUser();
    selectOrganization(organization.id);
    return organization;
  };

  const value = {
    ...state,
    configured: isSupabaseConfigured,
    activeMembership,
    organization: activeMembership?.organizations || null,
    role: activeMembership?.role || null,
    selectOrganization,
    signIn,
    signUp,
    sendPasswordReset,
    updatePassword,
    signOut,
    completeProfile,
    createOrganization,
    refreshIdentity: loadUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}

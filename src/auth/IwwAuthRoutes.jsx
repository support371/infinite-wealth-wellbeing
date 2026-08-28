import React, { useEffect, useState } from 'react';
import { Link, Navigate, Route, Routes, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, CheckCircle2, KeyRound, Loader2, LockKeyhole, ShieldCheck, UserPlus } from 'lucide-react';
import { useAuth } from './AuthProvider.jsx';
import { requireSupabase } from '../lib/supabase.js';
import { roleHome } from '../lib/iwwConfig.js';
import './auth.css';

function AuthShell({ title, subtitle, children }) {
  return (
    <main className="iww-auth-page">
      <section className="iww-auth-brand" aria-label="Infinite World of Well-Being">
        <Link to="/" className="iww-auth-logo" aria-label="Infinite World of Well-Being home">IW</Link>
        <p className="iww-auth-kicker">Infinite World of Well-Being</p>
        <h1>{title}</h1>
        <p>{subtitle}</p>
        <div className="iww-auth-trust"><ShieldCheck size={16}/> Dedicated IWW identity, data and organization access.</div>
      </section>
      <section className="iww-auth-card">{children}</section>
    </main>
  );
}

function ConfigurationRequired() {
  return (
    <AuthShell title="IWW setup is not connected" subtitle="This deployment does not yet contain the browser-safe IWW Supabase variables.">
      <div className="iww-auth-state iww-auth-state-warning">
        <LockKeyhole size={20}/>
        <div><strong>Configuration required</strong><p>Configure VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY for this IWW Vercel project. No GEM credentials are accepted here.</p></div>
      </div>
      <Link className="iww-auth-secondary" to="/">Return to public site</Link>
    </AuthShell>
  );
}

function SignIn() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!auth.loading && auth.user) {
      const requested = location.state?.from;
      navigate(requested || (auth.role ? roleHome[auth.role] : '/auth/onboarding'), { replace: true });
    }
  }, [auth.loading, auth.user, auth.role, location.state, navigate]);

  if (!auth.configured) return <ConfigurationRequired/>;

  async function submit(event) {
    event.preventDefault();
    setBusy(true); setMessage('');
    try {
      await auth.signIn(email.trim(), password);
      await auth.refreshContext();
      navigate(auth.role ? roleHome[auth.role] : '/auth/onboarding', { replace: true });
    } catch (error) {
      setMessage(error?.message || 'Sign-in failed.');
    } finally { setBusy(false); }
  }

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to your private wealth and wellbeing workspace.">
      <form onSubmit={submit} className="iww-auth-form">
        <label>Email<input autoComplete="email" type="email" required value={email} onChange={(e)=>setEmail(e.target.value)}/></label>
        <label>Password<input autoComplete="current-password" type="password" required minLength={8} value={password} onChange={(e)=>setPassword(e.target.value)}/></label>
        {message && <p role="alert" className="iww-auth-error">{message}</p>}
        <button disabled={busy} className="iww-auth-primary">{busy ? <Loader2 className="spin" size={16}/> : <KeyRound size={16}/>} Sign in</button>
      </form>
      <div className="iww-auth-links"><Link to="/auth/forgot-password">Forgot password?</Link><Link to="/auth/sign-up">Create IWW account</Link></div>
    </AuthShell>
  );
}

function SignUp() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName:'', email:'', password:'' });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  if (!auth.configured) return <ConfigurationRequired/>;

  async function submit(event) {
    event.preventDefault(); setBusy(true); setMessage('');
    try {
      const data = await auth.signUp(form.email.trim(), form.password, form.fullName.trim());
      if (data.session) navigate('/auth/onboarding', { replace:true });
      else setMessage('Check your email to confirm your IWW account, then return to sign in.');
    } catch (error) { setMessage(error?.message || 'Unable to create account.'); }
    finally { setBusy(false); }
  }

  return (
    <AuthShell title="Create your IWW account" subtitle="Start a standalone IWW organization or accept an invitation after sign-in.">
      <form onSubmit={submit} className="iww-auth-form">
        <label>Full name<input required value={form.fullName} onChange={(e)=>setForm({...form,fullName:e.target.value})}/></label>
        <label>Email<input type="email" autoComplete="email" required value={form.email} onChange={(e)=>setForm({...form,email:e.target.value})}/></label>
        <label>Password<input type="password" autoComplete="new-password" minLength={10} required value={form.password} onChange={(e)=>setForm({...form,password:e.target.value})}/></label>
        {message && <p role="status" className="iww-auth-message">{message}</p>}
        <button disabled={busy} className="iww-auth-primary">{busy ? <Loader2 className="spin" size={16}/> : <UserPlus size={16}/>} Create account</button>
      </form>
      <div className="iww-auth-links"><Link to="/auth/sign-in">Already have an account?</Link></div>
    </AuthShell>
  );
}

function ForgotPassword() {
  const auth = useAuth();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  if (!auth.configured) return <ConfigurationRequired/>;
  async function submit(event) {
    event.preventDefault(); setBusy(true); setMessage('');
    try { await auth.sendPasswordReset(email.trim()); setMessage('If the account exists, a secure password-reset message has been sent.'); }
    catch { setMessage('If the account exists, a secure password-reset message has been sent.'); }
    finally { setBusy(false); }
  }
  return <AuthShell title="Reset your password" subtitle="Request a private IWW password-reset link.">
    <form onSubmit={submit} className="iww-auth-form">
      <label>Email<input type="email" required value={email} onChange={(e)=>setEmail(e.target.value)}/></label>
      {message && <p role="status" className="iww-auth-message">{message}</p>}
      <button disabled={busy} className="iww-auth-primary">{busy ? <Loader2 className="spin" size={16}/> : <ArrowRight size={16}/>} Send reset link</button>
    </form><div className="iww-auth-links"><Link to="/auth/sign-in">Back to sign in</Link></div>
  </AuthShell>;
}

function ResetPassword() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  if (!auth.configured) return <ConfigurationRequired/>;
  async function submit(event) {
    event.preventDefault(); setBusy(true); setMessage('');
    try { await auth.updatePassword(password); setMessage('Password updated.'); setTimeout(()=>navigate('/auth/sign-in', {replace:true}), 800); }
    catch (error) { setMessage(error?.message || 'Password update failed.'); }
    finally { setBusy(false); }
  }
  return <AuthShell title="Choose a new password" subtitle="Update the password for this IWW identity only.">
    <form onSubmit={submit} className="iww-auth-form"><label>New password<input type="password" minLength={10} required value={password} onChange={(e)=>setPassword(e.target.value)}/></label>{message && <p role="status" className="iww-auth-message">{message}</p>}<button disabled={busy} className="iww-auth-primary">Save password</button></form>
  </AuthShell>;
}

function Onboarding() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [organizationName, setOrganizationName] = useState('');
  const [inviteToken, setInviteToken] = useState(params.get('invite') || '');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  if (auth.loading) return <AuthShell title="Loading your account" subtitle="Restoring your secure IWW session."><Loader2 className="spin"/></AuthShell>;
  if (!auth.user) return <Navigate to="/auth/sign-in" replace/>;
  if (auth.role) return <Navigate to={roleHome[auth.role]} replace/>;

  async function createOrganization(event) {
    event.preventDefault(); setBusy(true); setMessage('');
    try {
      const { error } = await requireSupabase().rpc('create_iww_organization', { p_name: organizationName.trim() });
      if (error) throw error;
      await auth.refreshContext();
      navigate('/app/overview', { replace:true });
    } catch (error) { setMessage(error?.message || 'Unable to create organization.'); }
    finally { setBusy(false); }
  }

  async function acceptInvitation(event) {
    event.preventDefault(); setBusy(true); setMessage('');
    try {
      const { error } = await requireSupabase().rpc('accept_iww_invitation', { p_token: inviteToken.trim() });
      if (error) throw error;
      await auth.refreshContext();
      navigate('/app/overview', { replace:true });
    } catch (error) { setMessage(error?.message || 'Invitation could not be accepted.'); }
    finally { setBusy(false); }
  }

  return <AuthShell title="Set up your IWW workspace" subtitle="Create an organization or accept a role-specific invitation.">
    {message && <p role="alert" className="iww-auth-error">{message}</p>}
    <div className="iww-onboarding-grid">
      <form onSubmit={createOrganization} className="iww-auth-form iww-onboarding-box"><h2>New organization</h2><p>Creates an IWW-only organization with you as owner.</p><label>Organization name<input required minLength={2} value={organizationName} onChange={(e)=>setOrganizationName(e.target.value)}/></label><button disabled={busy} className="iww-auth-primary">Create organization</button></form>
      <form onSubmit={acceptInvitation} className="iww-auth-form iww-onboarding-box"><h2>Accept invitation</h2><p>Use the one-time token supplied by your IWW administrator.</p><label>Invitation token<input required autoComplete="off" value={inviteToken} onChange={(e)=>setInviteToken(e.target.value)}/></label><button disabled={busy} className="iww-auth-primary">Accept invitation</button></form>
    </div>
  </AuthShell>;
}

function Callback() {
  const auth = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!auth.loading) navigate(auth.user ? (auth.role ? roleHome[auth.role] : '/auth/onboarding') : '/auth/sign-in', { replace:true });
  }, [auth.loading, auth.user, auth.role, navigate]);
  return <AuthShell title="Completing sign in" subtitle="Verifying your IWW authentication response."><Loader2 className="spin"/></AuthShell>;
}

export function IwwAuthRoutes() {
  return <Routes>
    <Route path="/auth/sign-in" element={<SignIn/>}/>
    <Route path="/auth/sign-up" element={<SignUp/>}/>
    <Route path="/auth/forgot-password" element={<ForgotPassword/>}/>
    <Route path="/auth/reset-password" element={<ResetPassword/>}/>
    <Route path="/auth/onboarding" element={<Onboarding/>}/>
    <Route path="/auth/callback" element={<Callback/>}/>
    <Route path="/auth" element={<Navigate to="/auth/sign-in" replace/>}/>
    <Route path="*" element={<Navigate to="/auth/sign-in" replace/>}/>
  </Routes>;
}

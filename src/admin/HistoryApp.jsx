import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';
import StaffMfaGate from './StaffMfaGate.jsx';
import './admin.css';

const supabaseUrl = import.meta.env.VITE_IWW_SUPABASE_URL;
const publishableKey = import.meta.env.VITE_IWW_SUPABASE_PUBLISHABLE_KEY;
const configured = Boolean(supabaseUrl && publishableKey);
const supabase = configured
  ? createClient(supabaseUrl, publishableKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null;

function initialQuery() {
  const params = new URLSearchParams(window.location.search);
  return {
    kind: params.get('kind') === 'membership_application' ? 'membership_application' : 'inquiry',
    submissionId: params.get('submissionId') || '',
  };
}

async function historyRequest(session, kind, submissionId) {
  const query = new URLSearchParams({ kind, submissionId });
  const response = await fetch(`/api/admin/history?${query.toString()}`, {
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || 'history_request_failed');
    error.status = response.status;
    error.code = data.error || 'history_request_failed';
    throw error;
  }
  return data;
}

function SignIn({ onSignedIn }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setError('');
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (signInError) {
      setError(signInError.message || 'Sign-in failed.');
      return;
    }
    if (data.session) onSignedIn(data.session);
  }

  return (
    <main className="admin-login-shell">
      <section className="admin-login-card">
        <span className="admin-eyebrow">IWW Audit History</span>
        <h1>Authorized staff only.</h1>
        {!configured ? (
          <div className="admin-alert admin-alert-warning">Audit history is prepared but not activated. Configure the dedicated IWW Supabase browser-safe authentication values first.</div>
        ) : (
          <form className="admin-form" onSubmit={submit}>
            <label>Email<input type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
            <label>Password<input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
            <button type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
            {error && <div className="admin-alert admin-alert-error" role="alert">{error}</div>}
          </form>
        )}
        <p className="admin-login-note">A valid Auth account must complete MFA and hold an active reviewer/admin role. Audit tables are never queried directly from the browser.</p>
        <a href="/admin">Back to review queue</a>
      </section>
    </main>
  );
}

function Timeline({ history }) {
  const rows = useMemo(() => {
    const statusRows = (history?.statusEvents || []).map((event) => ({
      at: event.created_at,
      type: 'status',
      title: `${event.from_status || 'new'} → ${event.to_status}`,
      detail: event.reason || 'Status transition recorded.',
      actor: event.changed_by,
    }));
    const auditRows = (history?.auditEvents || []).map((event) => ({
      at: event.created_at,
      type: 'audit',
      title: event.action,
      detail: event.details ? JSON.stringify(event.details) : 'Audit event recorded.',
      actor: event.actor_user_id,
    }));
    const deliveryRows = (history?.deliveries || []).map((event) => ({
      at: event.created_at,
      type: 'delivery',
      title: `${event.channel} · ${event.status}`,
      detail: event.error_code ? `Error: ${event.error_code}` : `${event.provider || 'provider'} delivery attempt ${event.attempt || 1}`,
      actor: null,
    }));
    return [...statusRows, ...auditRows, ...deliveryRows]
      .sort((left, right) => new Date(left.at) - new Date(right.at));
  }, [history]);

  if (!rows.length) return <div className="admin-empty">No audit history has been recorded for this submission.</div>;
  return (
    <section className="admin-list">
      {rows.map((row, index) => (
        <article className="admin-review-card" key={`${row.type}-${row.at}-${index}`}>
          <div className="admin-review-head">
            <div>
              <span className="admin-status">{row.type}</span>
              <h3>{row.title}</h3>
            </div>
            <div className="admin-reference">{row.at ? new Date(row.at).toLocaleString() : 'time unavailable'}</div>
          </div>
          <div className="admin-detail-grid">
            <div className="admin-message"><small>Evidence</small><p>{row.detail}</p></div>
            {row.actor && <div><small>Actor user ID</small><strong>{row.actor}</strong></div>}
          </div>
        </article>
      ))}
    </section>
  );
}

function HistoryConsole({ session, onSignOut }) {
  const initial = useMemo(initialQuery, []);
  const [kind, setKind] = useState(initial.kind);
  const [submissionId, setSubmissionId] = useState(initial.submissionId);
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function load(event) {
    event?.preventDefault();
    if (!submissionId.trim()) return;
    setLoading(true);
    setError('');
    try {
      const data = await historyRequest(session, kind, submissionId.trim());
      setHistory(data);
      const query = new URLSearchParams({ kind, submissionId: submissionId.trim() });
      window.history.replaceState(null, '', `/admin/history?${query.toString()}`);
    } catch (requestError) {
      setHistory(null);
      if (requestError.status === 401) {
        await supabase?.auth.signOut();
        onSignOut();
      } else if (requestError.code === 'mfa_required') {
        setError('This session must complete MFA before audit evidence can be accessed.');
      } else if (requestError.status === 403) {
        setError('This Auth account does not have an active reviewer/admin role.');
      } else if (requestError.status === 400) {
        setError('Enter a valid submission UUID and submission kind.');
      } else {
        setError('Audit history is unavailable. Check the production readiness gates and try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (initial.submissionId) load();
  }, []);

  async function signOut() {
    await supabase?.auth.signOut();
    onSignOut();
  }

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div>
          <span className="admin-eyebrow">IWW Staff Audit</span>
          <h1>Submission history</h1>
          <p>{session.user.email}</p>
        </div>
        <div className="admin-header-actions">
          <a href="/admin">Review queue</a>
          <a href="/trust-center">Trust status</a>
          <button className="admin-secondary" onClick={signOut}>Sign out</button>
        </div>
      </header>

      <form className="admin-toolbar" onSubmit={load}>
        <label>Record type
          <select value={kind} onChange={(event) => setKind(event.target.value)}>
            <option value="inquiry">Inquiry</option>
            <option value="membership_application">Membership application</option>
          </select>
        </label>
        <label>Submission UUID
          <input value={submissionId} onChange={(event) => setSubmissionId(event.target.value)} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" required />
        </label>
        <button className="admin-secondary" type="submit" disabled={loading}>{loading ? 'Loading…' : 'Load history'}</button>
      </form>

      {error && <div className="admin-alert admin-alert-error" role="alert">{error}</div>}
      {history && (
        <>
          <div className="admin-alert">Evidence history for <strong>{history.kind}</strong> · {history.submissionId}</div>
          <Timeline history={history} />
        </>
      )}
      {!history && !loading && !error && <div className="admin-empty">Enter a submission UUID to inspect status changes, audit events, and notification delivery history.</div>}
    </main>
  );
}

function App() {
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(!configured);

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active) {
        setSession(data.session || null);
        setReady(true);
      }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (active) setSession(nextSession || null);
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  if (!ready) return <main className="admin-login-shell"><div className="admin-empty">Checking staff session…</div></main>;
  if (!session) return <SignIn onSignedIn={setSession} />;
  return (
    <StaffMfaGate supabase={supabase} session={session} onSession={setSession}>
      <HistoryConsole session={session} onSignOut={() => setSession(null)} />
    </StaffMfaGate>
  );
}

createRoot(document.getElementById('root')).render(<App/>);

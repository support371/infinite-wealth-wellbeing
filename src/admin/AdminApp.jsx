import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';
import './admin.css';

const supabaseUrl = import.meta.env.VITE_IWW_SUPABASE_URL;
const publishableKey = import.meta.env.VITE_IWW_SUPABASE_PUBLISHABLE_KEY;
const configured = Boolean(supabaseUrl && publishableKey);
const supabase = configured
  ? createClient(supabaseUrl, publishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

const NEXT_STATUSES = {
  received: ['triaged', 'spam', 'closed'],
  triaged: ['in_review', 'spam', 'closed'],
  in_review: ['approved', 'rejected', 'closed'],
  approved: ['closed'],
  rejected: ['closed'],
  spam: ['closed'],
  closed: [],
};

const STATUS_OPTIONS = ['', 'received', 'triaged', 'in_review', 'approved', 'rejected', 'closed', 'spam'];

async function apiRequest(session, path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
      ...(options.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || 'request_failed');
    error.status = response.status;
    throw error;
  }
  return data;
}

function SignIn({ onSignedIn }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setStatus('');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      setStatus(error.message || 'Sign-in failed.');
      return;
    }
    if (data.session) onSignedIn(data.session);
  }

  return (
    <main className="admin-login-shell">
      <section className="admin-login-card">
        <span className="admin-eyebrow">IWW Staff Review</span>
        <h1>Authorized staff only.</h1>
        {!configured ? (
          <div className="admin-alert admin-alert-warning">
            Admin authentication is prepared but not activated. Configure the dedicated IWW Supabase URL and browser-safe publishable key before staff sign-in is enabled.
          </div>
        ) : (
          <form className="admin-form" onSubmit={submit}>
            <label>Email<input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
            <label>Password<input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
            <button type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
            {status && <div className="admin-alert admin-alert-error" role="alert">{status}</div>}
          </form>
        )}
        <p className="admin-login-note">There is no public sign-up path here. A valid Auth account is still insufficient unless the server confirms an active reviewer or admin role.</p>
        <a href="/">Return to release candidate</a>
      </section>
    </main>
  );
}

function ReviewCard({ item, kind, onTransition, busy }) {
  const options = NEXT_STATUSES[item.status] || [];
  const [toStatus, setToStatus] = useState(options[0] || '');
  const [reason, setReason] = useState('');

  useEffect(() => {
    const next = NEXT_STATUSES[item.status] || [];
    setToStatus(next[0] || '');
    setReason('');
  }, [item.status]);

  return (
    <article className="admin-review-card">
      <div className="admin-review-head">
        <div>
          <span className={`admin-status admin-status-${item.status}`}>{item.status.replace('_', ' ')}</span>
          <h3>{item.first_name} {item.last_name}</h3>
          <a href={`mailto:${item.email}`}>{item.email}</a>
        </div>
        <div className="admin-reference">{item.reference}</div>
      </div>

      {kind === 'inquiry' ? (
        <div className="admin-detail-grid">
          <div><small>Subject</small><strong>{item.subject}</strong></div>
          <div><small>Received</small><strong>{new Date(item.created_at).toLocaleString()}</strong></div>
          <div className="admin-message"><small>Message</small><p>{item.message}</p></div>
        </div>
      ) : (
        <div className="admin-detail-grid">
          <div><small>Requested tier</small><strong>{item.requested_tier}</strong></div>
          <div><small>Primary interest</small><strong>{item.primary_interest}</strong></div>
          <div><small>Received</small><strong>{new Date(item.created_at).toLocaleString()}</strong></div>
          {item.introduction && <div className="admin-message"><small>Introduction</small><p>{item.introduction}</p></div>}
        </div>
      )}

      {options.length > 0 ? (
        <div className="admin-transition">
          <select value={toStatus} onChange={(e) => setToStatus(e.target.value)}>
            {options.map((status) => <option key={status} value={status}>{status.replace('_', ' ')}</option>)}
          </select>
          <input value={reason} onChange={(e) => setReason(e.target.value)} maxLength="1000" placeholder="Reason / review note (optional)" />
          <button disabled={busy || !toStatus} onClick={() => onTransition(item, toStatus, reason)}>{busy ? 'Updating…' : 'Apply transition'}</button>
        </div>
      ) : (
        <p className="admin-terminal">This record is in a terminal review state.</p>
      )}
    </article>
  );
}

function ReviewConsole({ session, onSignOut }) {
  const [kind, setKind] = useState('inquiry');
  const [statusFilter, setStatusFilter] = useState('received');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');

  const query = useMemo(() => {
    const params = new URLSearchParams({ kind, limit: '50' });
    if (statusFilter) params.set('status', statusFilter);
    return params.toString();
  }, [kind, statusFilter]);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const data = await apiRequest(session, `/api/admin/submissions?${query}`);
      setItems(data.items || []);
    } catch (requestError) {
      if (requestError.status === 401) {
        await supabase?.auth.signOut();
        onSignOut();
        return;
      }
      if (requestError.status === 403) {
        setError('This Auth account does not have an active IWW reviewer/admin role.');
      } else {
        setError('The review queue is unavailable. Check the production readiness gates and try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [query]);

  async function transition(item, toStatus, reason) {
    setBusyId(item.id);
    setError('');
    try {
      await apiRequest(session, '/api/admin/submissions', {
        method: 'PATCH',
        body: JSON.stringify({
          kind,
          submissionId: item.id,
          toStatus,
          reason,
        }),
      });
      await load();
    } catch (requestError) {
      if (requestError.status === 409) {
        setError('That status transition is not allowed from the record’s current state. Refresh and review the latest status.');
      } else {
        setError('The review update could not be completed safely.');
      }
    } finally {
      setBusyId('');
    }
  }

  async function signOut() {
    await supabase?.auth.signOut();
    onSignOut();
  }

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div>
          <span className="admin-eyebrow">IWW Staff Review</span>
          <h1>Submission queue</h1>
          <p>{session.user.email}</p>
        </div>
        <div className="admin-header-actions">
          <a href="/trust-center">Trust status</a>
          <button className="admin-secondary" onClick={signOut}>Sign out</button>
        </div>
      </header>

      <section className="admin-toolbar">
        <label>Queue
          <select value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="inquiry">Inquiries</option>
            <option value="membership_application">Membership applications</option>
          </select>
        </label>
        <label>Status
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            {STATUS_OPTIONS.map((status) => <option key={status || 'all'} value={status}>{status ? status.replace('_', ' ') : 'All statuses'}</option>)}
          </select>
        </label>
        <button className="admin-secondary" onClick={load} disabled={loading}>Refresh</button>
      </section>

      {error && <div className="admin-alert admin-alert-error" role="alert">{error}</div>}
      {loading ? <div className="admin-empty">Loading review queue…</div> : items.length === 0 ? (
        <div className="admin-empty">No records match this queue.</div>
      ) : (
        <section className="admin-list">
          {items.map((item) => (
            <ReviewCard
              key={item.id}
              item={item}
              kind={kind}
              busy={busyId === item.id}
              onTransition={transition}
            />
          ))}
        </section>
      )}
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
  return <ReviewConsole session={session} onSignOut={() => setSession(null)} />;
}

createRoot(document.getElementById('root')).render(<App/>);

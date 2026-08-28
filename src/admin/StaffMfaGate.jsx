import React, { useEffect, useState } from 'react';

function qrSource(value) {
  if (!value) return '';
  if (value.startsWith('data:image/')) return value;
  if (value.trim().startsWith('<svg')) {
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(value)}`;
  }
  return value;
}

export default function StaffMfaGate({ supabase, session, onSession, children }) {
  const [phase, setPhase] = useState('checking');
  const [factorId, setFactorId] = useState('');
  const [enrollment, setEnrollment] = useState(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function assess() {
    setPhase('checking');
    setError('');

    const { data: assurance, error: assuranceError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (assuranceError) {
      setError('MFA assurance could not be checked. Sign out and try again.');
      setPhase('error');
      return;
    }

    if (assurance.currentLevel === 'aal2') {
      setPhase('ready');
      return;
    }

    const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
    if (factorsError) {
      setError('MFA factors could not be loaded.');
      setPhase('error');
      return;
    }

    const verifiedTotp = (factors?.totp || []).find((factor) => factor.status === 'verified');
    if (verifiedTotp) {
      setFactorId(verifiedTotp.id);
      setPhase('challenge');
      return;
    }

    setPhase('enroll');
  }

  useEffect(() => {
    if (!session?.access_token) return;
    assess();
  }, [session?.access_token]);

  async function beginEnrollment() {
    setBusy(true);
    setError('');
    const { data, error: enrollError } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: 'IWW Staff',
    });
    setBusy(false);
    if (enrollError || !data?.id) {
      setError(enrollError?.message || 'Authenticator enrollment could not be started.');
      return;
    }
    setEnrollment(data);
    setFactorId(data.id);
    setCode('');
    setPhase('enrollment-code');
  }

  async function verify(event) {
    event.preventDefault();
    const normalizedCode = code.replace(/\s+/g, '');
    if (!/^\d{6}$/.test(normalizedCode) || !factorId) {
      setError('Enter the current six-digit authenticator code.');
      return;
    }

    setBusy(true);
    setError('');
    const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
      factorId,
      code: normalizedCode,
    });
    if (verifyError) {
      setBusy(false);
      setError(verifyError.message || 'The authenticator code could not be verified.');
      return;
    }

    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    setBusy(false);
    if (sessionError || !sessionData?.session) {
      setError('MFA succeeded, but the upgraded staff session could not be loaded. Sign in again.');
      setPhase('error');
      return;
    }

    const { data: assurance } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (assurance?.currentLevel !== 'aal2') {
      setError('The session has not reached the required MFA assurance level.');
      setPhase('error');
      return;
    }

    setEnrollment(null);
    setCode('');
    setPhase('ready');
    onSession?.(sessionData.session);
  }

  if (phase === 'ready') return children;

  return (
    <main className="admin-login-shell">
      <section className="admin-login-card">
        <span className="admin-eyebrow">IWW Staff Security</span>
        <h1>Second factor required.</h1>
        <p className="admin-login-note">Privileged review and audit APIs require an AAL2 session. Password sign-in alone is not sufficient.</p>

        {phase === 'checking' && <div className="admin-empty">Checking authenticator assurance…</div>}

        {phase === 'enroll' && (
          <>
            <div className="admin-alert admin-alert-warning">No verified authenticator factor is available for this account. Enroll TOTP before a reviewer/admin role can be activated.</div>
            <button onClick={beginEnrollment} disabled={busy}>{busy ? 'Starting…' : 'Set up authenticator'}</button>
          </>
        )}

        {phase === 'enrollment-code' && enrollment && (
          <form className="admin-form" onSubmit={verify}>
            <p>Scan this code with an authenticator app, then enter its current six-digit code.</p>
            {enrollment.totp?.qr_code && (
              <img
                src={qrSource(enrollment.totp.qr_code)}
                alt="TOTP authenticator enrollment QR code"
                style={{ maxWidth: 240, width: '100%', background: 'white', padding: 10, borderRadius: 8 }}
              />
            )}
            {enrollment.totp?.secret && (
              <label>Manual setup secret
                <input value={enrollment.totp.secret} readOnly autoComplete="off" />
              </label>
            )}
            <label>Authenticator code
              <input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength="6" value={code} onChange={(event) => setCode(event.target.value)} required />
            </label>
            <button type="submit" disabled={busy}>{busy ? 'Verifying…' : 'Verify and continue'}</button>
          </form>
        )}

        {phase === 'challenge' && (
          <form className="admin-form" onSubmit={verify}>
            <p>Enter the six-digit code from your enrolled authenticator app.</p>
            <label>Authenticator code
              <input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength="6" value={code} onChange={(event) => setCode(event.target.value)} required autoFocus />
            </label>
            <button type="submit" disabled={busy}>{busy ? 'Verifying…' : 'Verify and continue'}</button>
          </form>
        )}

        {error && <div className="admin-alert admin-alert-error" role="alert">{error}</div>}
        {phase === 'error' && <button className="admin-secondary" onClick={assess}>Check again</button>}
      </section>
    </main>
  );
}

import { useState } from 'react';
import { ArrowLeft, CheckCircle2, Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react';
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function AuthPage() {
  const { mode = 'sign-in' } = useParams();
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  if (auth.user && mode === 'sign-in') return <Navigate to="/workspaces" replace />;

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    try {
      if (mode === 'forgot-password') {
        const { error: resetError } = await auth.sendPasswordReset(form.email);
        if (resetError) throw resetError;
        setMessage('Password reset instructions have been sent.');
      } else if (mode === 'reset-password') {
        if (form.password.length < 10) throw new Error('Use at least 10 characters.');
        if (form.password !== form.confirmPassword) throw new Error('Passwords do not match.');
        const { error: updateError } = await auth.updatePassword(form.password);
        if (updateError) throw updateError;
        setMessage('Password updated. You can now enter your workspace.');
      } else if (mode === 'sign-up') {
        if (!form.fullName.trim()) throw new Error('Enter your full name.');
        if (form.password.length < 10) throw new Error('Use at least 10 characters.');
        const { data, error: signUpError } = await auth.signUp(form.email, form.password, form.fullName);
        if (signUpError) throw signUpError;
        setMessage(data.session ? 'Account created.' : 'Check your email to confirm your IWW account.');
        if (data.session) navigate('/onboarding');
      } else {
        const { error: signInError } = await auth.signIn(form.email, form.password);
        if (signInError) throw signInError;
        navigate(location.state?.from || '/workspaces');
      }
    } catch (submissionError) {
      setError(submissionError.message);
    } finally {
      setBusy(false);
    }
  };

  if (mode === 'setup-required') {
    return <AuthFrame><div className="auth-message"><LockKeyhole size={34}/><h1>Secure workspace setup required</h1><p>The public IWW site is online, but the dedicated IWW Supabase public variables are not configured in this deployment.</p><Link to="/" className="app-button secondary"><ArrowLeft size={16}/> Public site</Link></div></AuthFrame>;
  }

  const copy = {
    'sign-in': ['Welcome back', 'Sign in to your private IWW workspace.'],
    'sign-up': ['Create your IWW account', 'Begin with a dedicated, secure IWW identity.'],
    'forgot-password': ['Reset your password', 'We will send a secure recovery link.'],
    'reset-password': ['Choose a new password', 'Use a strong password you have not used elsewhere.']
  }[mode] || ['IWW account', 'Secure account access.'];

  return (
    <AuthFrame>
      <div className="auth-card">
        <div className="auth-eyebrow">IWW MEMBER WORKSPACE</div>
        <h1>{copy[0]}</h1>
        <p>{copy[1]}</p>
        <form onSubmit={submit} className="auth-form">
          {mode === 'sign-up' && <label>Full name<input required autoComplete="name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })}/></label>}
          {!['reset-password'].includes(mode) && <label>Email address<div className="input-with-icon"><Mail size={17}/><input required type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}/></div></label>}
          {!['forgot-password'].includes(mode) && <label>{mode === 'reset-password' ? 'New password' : 'Password'}<div className="input-with-icon"><LockKeyhole size={17}/><input required minLength={10} type={showPassword ? 'text' : 'password'} autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}/><button type="button" aria-label="Toggle password visibility" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={17}/> : <Eye size={17}/>}</button></div></label>}
          {mode === 'reset-password' && <label>Confirm password<input required minLength={10} type="password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}/></label>}
          {error && <div className="form-alert error" role="alert">{error}</div>}
          {message && <div className="form-alert success" role="status"><CheckCircle2 size={16}/>{message}</div>}
          <button disabled={busy} className="app-button primary" type="submit">{busy ? 'Please wait…' : mode === 'sign-in' ? 'Sign in securely' : mode === 'sign-up' ? 'Create account' : 'Continue'}</button>
        </form>
        <div className="auth-links">
          {mode === 'sign-in' && <><Link to="/auth/forgot-password">Forgot password?</Link><Link to="/auth/sign-up">Create account</Link></>}
          {mode !== 'sign-in' && <Link to="/auth/sign-in">Return to sign in</Link>}
        </div>
      </div>
    </AuthFrame>
  );
}

function AuthFrame({ children }) {
  return <main className="auth-page"><Link className="auth-brand" to="/"><span>IW</span><strong>Infinite World of Well-Being</strong></Link>{children}<div className="auth-foot">Independent IWW identity · Tenant-isolated data · Role-authorized access</div></main>;
}

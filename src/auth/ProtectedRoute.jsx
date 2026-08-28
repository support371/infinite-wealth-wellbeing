import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

export function ProtectedRoute({ children, roles }) {
  const auth = useAuth();
  const location = useLocation();
  const decision = resolveProtectedRoute(auth, roles);

  if (decision === 'loading') return <div className="app-state app-loading" role="status"><span className="spinner" />Restoring your secure IWW workspace…</div>;
  if (decision === 'setup') return <Navigate to="/auth/setup-required" replace />;
  if (decision === 'sign-in') return <Navigate to="/auth/sign-in" replace state={{ from: location.pathname }} />;
  if (decision === 'onboarding') return <Navigate to="/onboarding" replace />;
  if (decision === 'denied') return <Navigate to="/app/access-denied" replace />;
  return children;
}

export function resolveProtectedRoute(auth, roles) {
  if (auth.loading) return 'loading';
  if (!auth.configured) return 'setup';
  if (!auth.user) return 'sign-in';
  if (!auth.profile?.onboarding_completed || !auth.activeMembership) return 'onboarding';
  if (roles && !roles.includes(auth.role)) return 'denied';
  return 'allow';
}

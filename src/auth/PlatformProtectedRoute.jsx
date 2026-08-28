import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function PlatformProtectedRoute({ children }) {
  const auth = useAuth();
  const location = useLocation();
  if (auth.loading) return <div className="app-state app-loading" role="status"><span className="spinner"/>Verifying platform authority…</div>;
  if (!auth.configured) return <Navigate to="/auth/setup-required" replace/>;
  if (!auth.user) return <Navigate to="/auth/sign-in" replace state={{ from: location.pathname }}/>;
  if (!auth.profile?.onboarding_completed) return <Navigate to="/onboarding" replace/>;
  if (!auth.platformStaff) return <Navigate to="/workspaces" replace/>;
  return children;
}

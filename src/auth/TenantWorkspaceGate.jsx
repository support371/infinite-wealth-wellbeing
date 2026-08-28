import { useEffect } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function TenantWorkspaceGate({ children }) {
  const { organizationSlug } = useParams();
  const auth = useAuth();
  const membership = auth.memberships.find((item) => item.organizations?.slug === organizationSlug);

  useEffect(() => {
    if (membership && membership.organization_id !== auth.organization?.id) {
      auth.selectOrganization(membership.organization_id);
    }
  }, [auth, membership]);

  if (!membership) return <Navigate to="/workspaces" replace />;
  if (auth.organization?.id !== membership.organization_id) {
    return <div className="app-state app-loading" role="status"><span className="spinner"/>Opening authorized workspace…</div>;
  }
  return children;
}

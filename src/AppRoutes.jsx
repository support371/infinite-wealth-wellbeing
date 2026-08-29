import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './auth/ProtectedRoute';
import PlatformProtectedRoute from './auth/PlatformProtectedRoute';
import TenantWorkspaceGate from './auth/TenantWorkspaceGate';

const PublicSite = lazy(() => import('./App'));
const AppShell = lazy(() => import('./app/AppShell'));
const AssistantPage = lazy(() => import('./app/AssistantPage'));
const DashboardPage = lazy(() => import('./app/DashboardPage'));
const EntityWorkspace = lazy(() => import('./app/EntityWorkspace'));
const AppointmentsPage = lazy(() => import('./app/AppointmentsPage'));
const MemberDirectoryPage = lazy(() => import('./app/MemberDirectoryPage'));
const MessagesPage = lazy(() => import('./app/MessagesPage'));
const SettingsPage = lazy(() => import('./app/SettingsPage'));
const AuthPage = lazy(() => import('./auth/AuthPage'));
const OnboardingPage = lazy(() => import('./auth/OnboardingPage'));
const WorkspaceSelectorPage = lazy(() => import('./app/WorkspaceSelectorPage'));
const ConnectedServicesPage = lazy(() => import('./app/ConnectedServicesPage'));
const PlatformPage = lazy(() => import('./app/PlatformPage'));

export default function AppRoutes() {
  return <Suspense fallback={<div className="app-state app-loading" role="status"><span className="spinner"/>Loading IWW…</div>}><Routes>
    <Route path="/auth/:mode" element={<AuthPage/>}/>
    <Route path="/auth/callback" element={<Navigate to="/workspaces" replace/>}/>
    <Route path="/onboarding" element={<OnboardingPage/>}/>
    <Route path="/workspaces" element={<ProtectedRoute><WorkspaceSelectorPage/></ProtectedRoute>}/>
    <Route path="/platform" element={<PlatformProtectedRoute><PlatformPage/></PlatformProtectedRoute>}/>
    <Route path="/w/:organizationSlug" element={<ProtectedRoute><TenantWorkspaceGate><AppShell/></TenantWorkspaceGate></ProtectedRoute>}>
      <Route index element={<DashboardPage/>}/>
      {['wellbeing','wealth','programmes','documents','tasks','resources','community','governance','reports','billing'].map(key=><Route key={key} path={key} element={<EntityWorkspace moduleKey={key}/>}/>) }
      <Route path="appointments" element={<AppointmentsPage/>}/>
      <Route path="team" element={<MemberDirectoryPage/>}/>
      <Route path="integrations" element={<ConnectedServicesPage/>}/>
      <Route path="messages" element={<MessagesPage/>}/>
      <Route path="assistant" element={<AssistantPage/>}/>
      <Route path="settings" element={<SettingsPage/>}/>
      <Route path="access-denied" element={<div className="app-state denied"><ShieldLock/><h1>Access denied</h1><p>Your assigned IWW role does not authorize this area.</p></div>}/>
      <Route path="*" element={<Navigate to="." replace/>}/>
    </Route>
    <Route path="/app/*" element={<Navigate to="/workspaces" replace/>}/>
    <Route path="/*" element={<PublicSite/>}/>
  </Routes></Suspense>;
}

function ShieldLock(){return <span className="denied-icon" aria-hidden="true">!</span>}

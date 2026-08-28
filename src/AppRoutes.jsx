import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './auth/ProtectedRoute';

const PublicSite = lazy(() => import('./App'));
const AppShell = lazy(() => import('./app/AppShell'));
const AssistantPage = lazy(() => import('./app/AssistantPage'));
const DashboardPage = lazy(() => import('./app/DashboardPage'));
const EntityWorkspace = lazy(() => import('./app/EntityWorkspace'));
const MessagesPage = lazy(() => import('./app/MessagesPage'));
const SettingsPage = lazy(() => import('./app/SettingsPage'));
const AuthPage = lazy(() => import('./auth/AuthPage'));
const OnboardingPage = lazy(() => import('./auth/OnboardingPage'));

export default function AppRoutes() {
  return <Suspense fallback={<div className="app-state app-loading" role="status"><span className="spinner"/>Loading IWW…</div>}><Routes>
    <Route path="/auth/:mode" element={<AuthPage/>}/>
    <Route path="/auth/callback" element={<Navigate to="/app" replace/>}/>
    <Route path="/onboarding" element={<OnboardingPage/>}/>
    <Route path="/app" element={<ProtectedRoute><AppShell/></ProtectedRoute>}>
      <Route index element={<DashboardPage/>}/>
      {['wellbeing','wealth','programmes','appointments','documents','tasks','resources','community','team','governance','reports','billing','integrations'].map(key=><Route key={key} path={key} element={<EntityWorkspace moduleKey={key}/>}/>) }
      <Route path="messages" element={<MessagesPage/>}/>
      <Route path="assistant" element={<AssistantPage/>}/>
      <Route path="settings" element={<SettingsPage/>}/>
      <Route path="access-denied" element={<div className="app-state denied"><ShieldLock/><h1>Access denied</h1><p>Your assigned IWW role does not authorize this area.</p></div>}/>
      <Route path="*" element={<Navigate to="/app" replace/>}/>
    </Route>
    <Route path="/*" element={<PublicSite/>}/>
  </Routes></Suspense>;
}

function ShieldLock(){return <span className="denied-icon" aria-hidden="true">!</span>}

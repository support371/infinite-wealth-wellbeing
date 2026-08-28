import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './auth/AuthProvider.jsx';
import { IwwAuthRoutes } from './auth/IwwAuthRoutes.jsx';
import { IwwSaaSApp } from './app/IwwSaaSApp.jsx';

const pathname = window.location.pathname;
const isPrivateIwwSurface = pathname === '/app' || pathname.startsWith('/app/') || pathname === '/auth' || pathname.startsWith('/auth/');

if (isPrivateIwwSurface) {
  const root = createRoot(document.getElementById('root'));
  root.render(
    <React.StrictMode>
      <BrowserRouter>
        <AuthProvider>
          {pathname === '/auth' || pathname.startsWith('/auth/') ? <IwwAuthRoutes /> : <IwwSaaSApp />}
        </AuthProvider>
      </BrowserRouter>
    </React.StrictMode>,
  );
} else {
  // Preserve the established public IWW site and its route catalogue without duplicating it.
  import('./App.jsx');
}

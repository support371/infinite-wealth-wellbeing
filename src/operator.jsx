import React from 'react';
import { createRoot } from 'react-dom/client';
import OperatingSystemPage from './operating-system/OperatingSystemPage.jsx';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <OperatingSystemPage />
  </React.StrictMode>,
);

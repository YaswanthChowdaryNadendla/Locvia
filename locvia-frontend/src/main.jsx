// src/main.jsx
// Application entry point

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

// Purge legacy mock data caches from localStorage
try {
  const legacyMockKeys = [
    'locvia_products',
    'locvia_shops',
    'locvia_all_users',
    'locvia_categories',
    'locvia_registered_shop',
  ];
  legacyMockKeys.forEach((key) => localStorage.removeItem(key));
} catch (e) {
  console.error('Failed to purge legacy mock keys:', e);
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);

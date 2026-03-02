import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { Auth0Provider } from '@auth0/auth0-react';

// Auth0 配置
const AUTH0_DOMAIN = 'dev-pif4ht6v60w4enxg.us.auth0.com';
const AUTH0_CLIENT_ID = '8Y7Xuy7gDjxsUVtbP522IYoAT732HgVZ';
const AUTH0_AUDIENCE = 'https://realestate-api';

// 抑制警告
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

console.error = (...args) => {
  const msg = args[0]?.toString?.() || '';
  if (msg.includes('React Router')) return;
  if (msg.includes('validateDOMNesting')) return;
  originalConsoleError.apply(console, args);
};

console.warn = (...args) => {
  const msg = args[0]?.toString?.() || '';
  if (msg.includes('Lit is in dev mode')) return;
  if (msg.includes('React Router')) return;
  originalConsoleWarn.apply(console, args);
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Auth0Provider
      domain={AUTH0_DOMAIN}
      clientId={AUTH0_CLIENT_ID}
      authorizationParams={{
        redirect_uri: window.location.origin
        // 暂时移除 audience
      }}
    >
      <App />
    </Auth0Provider>
  </React.StrictMode>,
)

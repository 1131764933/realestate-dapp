import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

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
    <App />
  </React.StrictMode>,
)

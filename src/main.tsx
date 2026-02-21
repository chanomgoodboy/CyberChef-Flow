import './polyfills';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/globals.css';
import './styles/nodes.css';

// Expose stores for debugging (dev only — Vite eliminates in production)
if (import.meta.env.DEV) {
  import('./store/graphStore').then(({ useGraphStore }) => {
    (window as any).__graphStore = useGraphStore;
  });
  import('./store/executionStore').then(({ useExecutionStore }) => {
    (window as any).__executionStore = useExecutionStore;
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

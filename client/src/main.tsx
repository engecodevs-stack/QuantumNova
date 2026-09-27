import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Intercept fetch globally to automatically inject the x-user-id header for our API calls
const originalFetch = window.fetch;
window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const url = typeof input === 'string' ? input : (input instanceof URL ? input.toString() : input.url);
  if (url.includes('/api') || url.includes('localhost:5000') || !url.startsWith('http')) {
    const userStr = localStorage.getItem('quantum_user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user && user.id) {
          const newInit = { ...init };
          const headers = new Headers(newInit.headers || {});
          if (!headers.has('x-user-id')) {
            headers.set('x-user-id', user.id);
          }
          newInit.headers = headers;
          return originalFetch(input, newInit);
        }
      } catch (e) {
        console.error('Error adding x-user-id header:', e);
      }
    }
  }
  return originalFetch(input, init);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

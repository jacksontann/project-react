import React from 'react';
import ReactDOM from 'react-dom/client';
// Geist + Instrument Serif are self-hosted and preloaded in public/index.html (LCP-critical).
import '@fontsource-variable/geist-mono';
import 'styles/globals.css';
import { App } from 'app/App';
import { prepareRequests, setRequestGate } from 'lib/http';
import { afterLoad } from 'lib/schedule';

/**
 * There is no backend: the auth API is served in the browser by Mock Service Worker, in
 * development and in the deployed build alike. Set REACT_APP_API_MOCKING=off (and
 * REACT_APP_API_URL) to talk to a real API instead.
 */
async function startMockApi() {
  if (process.env.REACT_APP_API_MOCKING === 'off') return;
  try {
    const { worker } = await import('mocks/browser');
    await worker.start({
      onUnhandledRequest: 'bypass',
      quiet: process.env.NODE_ENV === 'production',
    });
  } catch (error) {
    console.error('[Lumen] Mock API failed to start', error);
  }
}

// API calls wait for the mock; the first paint doesn't. It starts on the first request
// (e.g. restoring a session) or, at the latest, shortly after the page has loaded and settled.
setRequestGate(startMockApi);
afterLoad(() => void prepareRequests(), { delay: 1500 });

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

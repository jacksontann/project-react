import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource-variable/geist';
import '@fontsource-variable/geist-mono';
import '@fontsource/instrument-serif/400.css';
import '@fontsource/instrument-serif/400-italic.css';
import 'styles/globals.css';
import { App } from 'app/App';

/**
 * There is no backend: the auth API is served in the browser by Mock Service Worker, in
 * development and in the deployed build alike. Set REACT_APP_API_MOCKING=off (and
 * REACT_APP_API_URL) to talk to a real API instead.
 */
async function startMockApi() {
  if (process.env.REACT_APP_API_MOCKING === 'off') return;
  const { worker } = await import('mocks/browser');
  await worker.start({
    onUnhandledRequest: 'bypass',
    quiet: process.env.NODE_ENV === 'production',
  });
}

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

startMockApi()
  .catch((error: unknown) => console.error('[Lumen] Mock API failed to start', error))
  .finally(() => {
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    );
  });

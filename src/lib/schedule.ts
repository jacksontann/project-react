/** Runs `callback` when the main thread is idle (falls back to a timeout where unsupported). */
export function whenIdle(callback: () => void, timeout = 1500) {
  if (typeof window.requestIdleCallback === 'function') {
    const id = window.requestIdleCallback(callback, { timeout });
    return () => window.cancelIdleCallback(id);
  }
  const id = window.setTimeout(callback, Math.min(timeout, 200));
  return () => window.clearTimeout(id);
}

/** Runs `callback` once the page has fully loaded, after an optional settle delay, when idle. */
export function afterLoad(callback: () => void, { delay = 0, idleTimeout = 1500 } = {}) {
  let cancel = () => {};
  const start = () => {
    const timer = window.setTimeout(() => {
      cancel = whenIdle(callback, idleTimeout);
    }, delay);
    cancel = () => window.clearTimeout(timer);
  };
  if (document.readyState === 'complete') {
    start();
  } else {
    window.addEventListener('load', start, { once: true });
    cancel = () => window.removeEventListener('load', start);
  }
  return () => cancel();
}

interface NavigatorHints {
  deviceMemory?: number;
  connection?: { saveData?: boolean; effectiveType?: string };
}

/**
 * Phones, Data Saver, slow connections and low-end hardware. These get the static poster first
 * and a lighter 3D scene later, so the form is never competing with WebGL for the main thread.
 */
export function isConstrainedDevice() {
  const hints = navigator as Navigator & NavigatorHints;
  return (
    window.matchMedia('(max-width: 639px)').matches ||
    !!hints.connection?.saveData ||
    /(^|-)2g|3g/.test(hints.connection?.effectiveType ?? '') ||
    (navigator.hardwareConcurrency || 8) <= 4 ||
    (hints.deviceMemory ?? 8) <= 4
  );
}

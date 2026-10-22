import '@testing-library/jest-dom';
import { toHaveNoViolations } from 'jest-axe';
import { webcrypto } from 'crypto';
import { TextDecoder, TextEncoder } from 'util';

expect.extend(toHaveNoViolations);

// jsdom 16 (bundled with CRA's Jest 27) lacks several platform APIs the app relies on.
Object.assign(globalThis, { TextEncoder, TextDecoder });
if (!globalThis.crypto?.subtle) {
  Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true });
}

// Reduced motion on (no waits, instant transforms); not a fine pointer (no custom cursor).
window.matchMedia = (query: string) =>
  ({
    matches: query.includes('prefers-reduced-motion'),
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }) as unknown as MediaQueryList;

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver;

// No WebGL in jsdom: the scene stays on its static poster, as it would without a GPU.
HTMLCanvasElement.prototype.getContext = (() => null) as unknown as HTMLCanvasElement['getContext'];

if (typeof HTMLDialogElement !== 'undefined') {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.open = false;
    this.dispatchEvent(new Event('close'));
  };
}

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
});

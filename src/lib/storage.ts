export type StorageArea = 'local' | 'session';

/**
 * Web Storage can throw (Safari private mode, blocked cookies, quota). Every access goes
 * through here so a storage failure degrades to "not remembered" instead of crashing.
 */
function area(kind: StorageArea): Storage | null {
  try {
    return kind === 'local' ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

export const safeStorage = {
  get(kind: StorageArea, key: string): string | null {
    try {
      return area(kind)?.getItem(key) ?? null;
    } catch {
      return null;
    }
  },
  set(kind: StorageArea, key: string, value: string) {
    try {
      area(kind)?.setItem(key, value);
    } catch {
      // Out of quota or blocked: the session simply won't persist.
    }
  },
  remove(kind: StorageArea, key: string) {
    try {
      area(kind)?.removeItem(key);
    } catch {
      // Nothing to clean up if storage is unavailable.
    }
  },
};

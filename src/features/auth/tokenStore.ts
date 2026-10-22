import { safeStorage } from 'lib/storage';

const KEY = 'lumen.session';

/**
 * "Remember me" decides where the token lives: localStorage survives restarts, sessionStorage
 * ends with the tab. (A production backend would use an httpOnly, Secure, SameSite cookie.)
 */
export const tokenStore = {
  load() {
    return safeStorage.get('local', KEY) ?? safeStorage.get('session', KEY);
  },
  save(token: string, remember: boolean) {
    tokenStore.clear();
    safeStorage.set(remember ? 'local' : 'session', KEY, token);
  },
  clear() {
    safeStorage.remove('local', KEY);
    safeStorage.remove('session', KEY);
  },
};

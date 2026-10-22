import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { ApiError } from 'lib/http';
import { wait } from 'lib/wait';
import { authApi } from './api';
import type { SessionResponse, User } from './schemas';
import { tokenStore } from './tokenStore';

type AuthState =
  | { status: 'loading' }
  | { status: 'anonymous' }
  | { status: 'authenticated'; user: User; token: string };

export type AuthStatus = AuthState['status'];

interface AuthContextValue {
  status: AuthStatus;
  user: User | null;
  /** Commits a session returned by login/register. */
  signIn: (session: SessionResponse, remember: boolean) => void;
  /** Revokes the session server-side (best effort) and clears it locally. */
  signOut: (options?: { minDuration?: number }) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() =>
    tokenStore.load() ? { status: 'loading' } : { status: 'anonymous' },
  );

  // Restore a stored session on boot.
  useEffect(() => {
    const token = tokenStore.load();
    if (!token) return;
    const controller = new AbortController();
    authApi
      .me(token, controller.signal)
      .then((user) => setState({ status: 'authenticated', user, token }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        // Only a definitive 401 forgets the token; a network blip shouldn't sign anyone out.
        if (error instanceof ApiError && error.status === 401) tokenStore.clear();
        setState({ status: 'anonymous' });
      });
    return () => controller.abort();
  }, []);

  const signIn = useCallback(({ user, token }: SessionResponse, remember: boolean) => {
    tokenStore.save(token, remember);
    setState({ status: 'authenticated', user, token });
  }, []);

  const token = state.status === 'authenticated' ? state.token : null;

  const signOut = useCallback(
    async ({ minDuration = 0 } = {}) => {
      const revoke = token ? authApi.logout(token).catch(() => undefined) : Promise.resolve();
      await Promise.all([revoke, wait(minDuration)]);
      tokenStore.clear();
      setState({ status: 'anonymous' });
    },
    [token],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      status: state.status,
      user: state.status === 'authenticated' ? state.user : null,
      signIn,
      signOut,
    }),
    [state, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}

import type { ReactNode } from 'react';
import { useIsPresent } from 'framer-motion';
import { Navigate, useLocation } from 'react-router';
import { Spinner } from 'components/ui/Spinner';
import { useAuth } from './AuthProvider';

function SessionCheck() {
  return (
    <div className="grid min-h-[22rem] place-items-center text-ink-faint" role="status">
      <Spinner className="size-5" />
      <span className="sr-only">Checking your session…</span>
    </div>
  );
}

/*
 * While a page animates out (auth state already changed), keep rendering its children instead of
 * redirecting again, so the exit animation shows the page that is leaving rather than a blank.
 */

export function RequireAuth({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const location = useLocation();
  const isPresent = useIsPresent();

  if (!isPresent) return <>{children}</>;
  if (status === 'loading') return <SessionCheck />;
  if (status === 'anonymous') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <>{children}</>;
}

export function GuestOnly({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const isPresent = useIsPresent();

  if (!isPresent) return <>{children}</>;
  if (status === 'loading') return <SessionCheck />;
  if (status === 'authenticated') return <Navigate to="/home" replace />;
  return <>{children}</>;
}

export function RootRedirect() {
  const { status } = useAuth();
  if (status === 'loading') return <SessionCheck />;
  return <Navigate to={status === 'authenticated' ? '/home' : '/login'} replace />;
}

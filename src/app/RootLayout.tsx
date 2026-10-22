import { useState } from 'react';
import { AnimatePresence, m } from 'framer-motion';
import { Link, useLocation, useOutlet } from 'react-router';
import { AppShell, type ShellMode } from 'components/layout/AppShell';
import { Logo } from 'components/ui/Logo';
import { easeOutExpo } from 'lib/motion';

function shellModeFor(pathname: string): ShellMode {
  if (pathname.startsWith('/register')) return 'register';
  if (pathname.startsWith('/home')) return 'home';
  return 'login';
}

/** Freezes the outlet element so a leaving route keeps rendering itself during its exit animation. */
function FrozenOutlet() {
  const outlet = useOutlet();
  const [frozen] = useState(outlet);
  return frozen;
}

export function RootLayout() {
  const location = useLocation();

  return (
    <AppShell
      mode={shellModeFor(location.pathname)}
      brand={
        <Link to="/" aria-label="Lumen — start" className="block rounded-md">
          <Logo />
        </Link>
      }
    >
      <AnimatePresence mode="wait" initial={false}>
        <m.div
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.28, ease: easeOutExpo }}
        >
          <FrozenOutlet />
        </m.div>
      </AnimatePresence>
    </AppShell>
  );
}

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, m } from 'framer-motion';
import { Link, useLocation, useOutlet } from 'react-router';
import { AppShell, type ShellMode } from 'components/layout/AppShell';
import { Logo } from 'components/ui/Logo';
import { Cursor } from 'features/cursor/Cursor';
import { MotionToggle } from 'features/scene/MotionToggle';
import { SceneStage } from 'features/scene/SceneStage';
import { useSceneStore } from 'features/scene/sceneStore';
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
  const mode = shellModeFor(location.pathname);
  const lastPath = useRef(location.pathname);

  useEffect(() => {
    useSceneStore.getState().setMode(mode);
  }, [mode]);

  return (
    <>
      <AppShell
        mode={mode}
        scene={<SceneStage />}
        controls={<MotionToggle />}
        brand={
          <Link to="/" aria-label="Lumen — start" className="block rounded-md">
            <Logo />
          </Link>
        }
      >
        <AnimatePresence mode="wait" initial={false}>
          <m.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
            transition={{ duration: 0.3, ease: easeOutExpo }}
            onAnimationComplete={() => {
              // After a client-side navigation, move focus to the new page's heading so
              // keyboard and screen-reader users land at the start of the new content.
              if (lastPath.current === location.pathname) return;
              lastPath.current = location.pathname;
              document.querySelector<HTMLElement>('main h1')?.focus({ preventScroll: true });
            }}
          >
            <FrozenOutlet />
          </m.div>
        </AnimatePresence>
      </AppShell>
      <Cursor />
    </>
  );
}

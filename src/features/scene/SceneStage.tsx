import { Component, lazy, Suspense, useEffect, useState, type ReactNode } from 'react';
import { useReducedMotion } from 'framer-motion';
import { cn } from 'lib/cn';
import { afterLoad, isConstrainedDevice } from 'lib/schedule';
import { ScenePoster } from './ScenePoster';
import { useSceneStore } from './sceneStore';

const Scene = lazy(() => import('./Scene'));

function supportsWebGL() {
  try {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl2') ?? canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

/** If the scene chunk or WebGL context fails, keep the poster rather than breaking the page. */
class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  override state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  override render() {
    return this.state.failed ? null : this.props.children;
  }
}

export function SceneStage() {
  const [load, setLoad] = useState(false);
  const [constrained] = useState(isConstrainedDevice);
  const ready = useSceneStore((s) => s.ready);
  const hovered = useSceneStore((s) => s.hovered);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    useSceneStore.getState().setReducedMotion(!!reducedMotion);
  }, [reducedMotion]);

  // The poster paints instantly; WebGL is a progressive enhancement that never competes with
  // first paint or the first keystrokes. Desktops load it once the page is idle; phones and
  // low-power devices wait until the page has fully settled.
  useEffect(() => {
    if (!supportsWebGL()) return;
    return afterLoad(() => setLoad(true), constrained ? { delay: 3500, idleTimeout: 4000 } : {});
  }, [constrained]);

  return (
    <div
      aria-hidden="true"
      data-cursor="scene"
      data-scene-ready={ready || undefined}
      // Phones: the scene only fills the strip above the bottom sheet (fewer pixels to render,
      // and the tower can be framed at its normal distance). Larger screens: full bleed.
      className={cn(
        'absolute inset-x-0 top-0 h-[46svh] sm:bottom-0 sm:h-auto',
        hovered && 'cursor-pointer',
      )}
    >
      {load ? (
        <SceneBoundary>
          <Suspense fallback={null}>
            <Scene lowPower={constrained} />
          </Suspense>
        </SceneBoundary>
      ) : null}
      <ScenePoster
        className={cn(
          'pointer-events-none transition-opacity duration-1000 ease-out',
          ready && 'opacity-0',
        )}
      />
    </div>
  );
}

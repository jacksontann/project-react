import { Component, lazy, Suspense, useEffect, useState, type ReactNode } from 'react';
import { useReducedMotion } from 'framer-motion';
import { cn } from 'lib/cn';
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

/** Download the 3D scene only once the page is idle, so the form is usable first. */
function whenIdle(callback: () => void) {
  // Safari only recently shipped requestIdleCallback; fall back to a short timeout.
  if (typeof window.requestIdleCallback === 'function') {
    const id = window.requestIdleCallback(callback, { timeout: 1500 });
    return () => window.cancelIdleCallback(id);
  }
  const id = window.setTimeout(callback, 200);
  return () => window.clearTimeout(id);
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
  const ready = useSceneStore((s) => s.ready);
  const hovered = useSceneStore((s) => s.hovered);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    useSceneStore.getState().setReducedMotion(!!reducedMotion);
  }, [reducedMotion]);

  useEffect(() => {
    if (!supportsWebGL()) return;
    return whenIdle(() => setLoad(true));
  }, []);

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
            <Scene />
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

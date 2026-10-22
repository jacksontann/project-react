import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';
import { calloutAnchor } from '../calloutAnchor';
import { windowPlacement } from '../geometry';
import { useSceneStore } from '../sceneStore';

/**
 * Projects the resident's window to screen pixels each frame and moves the DOM callout there.
 * Writes `transform` directly: no React renders, no extra React root inside the canvas.
 */
export function CalloutTracker() {
  const point = useMemo(() => new Vector3(), []);

  useFrame(({ camera, size }) => {
    const element = calloutAnchor.current;
    if (!element) return;
    const { unit } = useSceneStore.getState();
    if (!unit) {
      element.style.visibility = 'hidden';
      return;
    }
    const p = windowPlacement(unit);
    camera.updateMatrixWorld(); // the rig only set position/rotation this frame
    point.set(p.x, p.y, p.z).project(camera);
    const behindCamera = point.z > 1;
    const x = (point.x * 0.5 + 0.5) * size.width;
    const y = (-point.y * 0.5 + 0.5) * size.height;
    element.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    element.style.visibility = behindCamera ? 'hidden' : 'visible';
  });

  return null;
}

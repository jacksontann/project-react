import { useEffect, useLayoutEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { easing } from 'maath';
import { Vector3, type PerspectiveCamera } from 'three';
import { windowPlacement } from '../geometry';
import { useSceneStore, type SceneMode } from '../sceneStore';
import type { UnitRef } from '../tower';

type Layout = 'wide' | 'medium' | 'narrow';

interface Pose {
  target: Vector3;
  position: Vector3;
}

const TOWER_CENTER = new Vector3(0, 6.3, 0);

/** Pulls the camera back on small screens so the whole tower fits its slot. */
const DISTANCE_SCALE: Record<Layout, { overview: number; focus: number }> = {
  wide: { overview: 1, focus: 1 },
  medium: { overview: 1.08, focus: 1.1 },
  narrow: { overview: 1.05, focus: 1.15 },
};

function overviewPose(mode: SceneMode, unit: UnitRef | null, layout: Layout): Pose {
  const register = mode === 'register';
  const target = TOWER_CENTER.clone();
  if (register) target.y = 5.9;
  // While registering, ease the view towards the floor being typed.
  if (register && unit) target.y = target.y * 0.55 + windowPlacement(unit).y * 0.45;
  const direction = register ? new Vector3(0.55, 0.19, 0.8) : new Vector3(0.5, 0.06, 0.86);
  const distance = (register ? 29 : 27) * DISTANCE_SCALE[layout].overview;
  return { target, position: target.clone().add(direction.normalize().multiplyScalar(distance)) };
}

function focusPose(unit: UnitRef, layout: Layout): Pose {
  const p = windowPlacement(unit);
  const target = new Vector3(p.x, p.y, p.z);
  // Look at the facade slightly from the side, the way you'd glance up at a window.
  const direction = p.normalZ ? new Vector3(0.42, 0.1, 0.9) : new Vector3(0.9, 0.1, 0.42);
  const distance = 19 * DISTANCE_SCALE[layout].focus;
  return { target, position: target.clone().add(direction.normalize().multiplyScalar(distance)) };
}

function poseFor(mode: SceneMode, unit: UnitRef | null, event: string, layout: Layout) {
  const focused = unit && (mode === 'home' || (mode === 'login' && event === 'success'));
  return focused ? focusPose(unit, layout) : overviewPose(mode, unit, layout);
}

export function CameraRig() {
  const camera = useThree((state) => state.camera) as PerspectiveCamera;
  const size = useThree((state) => state.size);
  const lookAt = useRef(TOWER_CENTER.clone());
  const pointer = useRef({ x: 0, y: 0 });
  const layout: Layout = size.width >= 1024 ? 'wide' : size.width >= 640 ? 'medium' : 'narrow';

  // Pointer anywhere on the page (not just the canvas) drives the parallax.
  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      pointer.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = -((event.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  // Shift the projection so the tower sits beside the panel (desktop) or above it (phones),
  // without changing perspective.
  useLayoutEffect(() => {
    const { width, height } = size;
    const offset =
      layout === 'wide'
        ? { x: width * 0.2, y: 0 }
        : layout === 'medium'
          ? { x: width * 0.3, y: 0 }
          : { x: 0, y: height * 0.07 };
    camera.setViewOffset(width, height, offset.x, offset.y, width, height);
    camera.updateProjectionMatrix();
  }, [camera, size, layout]);

  useFrame((state, delta) => {
    const s = useSceneStore.getState();
    const snap = s.paused || s.reducedMotion;
    const pose = poseFor(s.mode, s.unit, s.event, layout);

    if (!snap) {
      const t = state.clock.elapsedTime;
      pose.position.x += pointer.current.x * 0.9 + Math.sin(t * 0.11) * 0.35;
      pose.position.y += pointer.current.y * 0.55 + Math.sin(t * 0.07) * 0.2;
    }

    if (snap) {
      camera.position.copy(pose.position);
      lookAt.current.copy(pose.target);
    } else {
      const dt = Math.min(delta, 0.1);
      easing.damp3(camera.position, pose.position, 0.9, dt);
      easing.damp3(lookAt.current, pose.target, 0.9, dt);
    }
    camera.lookAt(lookAt.current);
  });

  return null;
}

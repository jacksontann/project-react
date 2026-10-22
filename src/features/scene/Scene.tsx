import { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import { useSceneStore } from './sceneStore';
import { CameraRig } from './three/CameraRig';
import { Effects } from './three/Effects';
import { Environment, FOG_COLOR, FOG_DENSITY } from './three/environment';
import { Skyline } from './three/Skyline';
import { Tower } from './three/Tower';
import { UnitCallout } from './three/UnitCallout';

/**
 * Lazy-loaded entry point: everything three.js lives behind this module boundary.
 * `lowPower` (phones, Data Saver, low-end hardware) starts without post-processing at DPR 1;
 * PerformanceMonitor can also switch to it at runtime if frame rate drops.
 */
export default function Scene({ lowPower: initialLowPower = false }: { lowPower?: boolean }) {
  const paused = useSceneStore((s) => s.paused);
  const reducedMotion = useSceneStore((s) => s.reducedMotion);
  const [lowPower, setLowPower] = useState(initialLowPower);

  return (
    <Canvas
      dpr={lowPower ? 1 : [1, 1.75]}
      gl={{ antialias: false, stencil: false, powerPreference: 'high-performance' }}
      camera={{ fov: 35, near: 0.1, far: 300, position: [12, 7.5, 21] }}
      frameloop={paused || reducedMotion ? 'demand' : 'always'}
      onCreated={({ gl }) => {
        gl.localClippingEnabled = true;
      }}
    >
      <color attach="background" args={['#05060a']} />
      <fogExp2 attach="fog" args={[FOG_COLOR, FOG_DENSITY]} />
      <PerformanceMonitor onDecline={() => setLowPower(true)} />

      <Environment />
      <Skyline />
      <Tower />
      <UnitCallout />
      <CameraRig />
      {lowPower ? null : <Effects />}

      <RenderOnStoreChange />
      <ReadySignal />
    </Canvas>
  );
}

/** In on-demand mode (paused / reduced motion), redraw once whenever the UI changes state. */
function RenderOnStoreChange() {
  const invalidate = useThree((state) => state.invalidate);
  useEffect(() => useSceneStore.subscribe(() => invalidate()), [invalidate]);
  return null;
}

/** Tells the page the first frame is on screen so the static poster can fade out. */
function ReadySignal() {
  const signalled = useRef(false);
  useFrame(() => {
    if (signalled.current) return;
    signalled.current = true;
    requestAnimationFrame(() => useSceneStore.getState().setReady());
  });
  return null;
}

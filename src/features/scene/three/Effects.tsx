import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Bloom, EffectComposer, Noise, ToneMapping, Vignette } from '@react-three/postprocessing';
import { BlendFunction, ToneMappingMode, type BloomEffect } from 'postprocessing';
import { useSceneStore } from '../sceneStore';

const BASE_BLOOM = 1.5;

export function Effects() {
  const bloom = useRef<BloomEffect>(null);

  // Bloom swells briefly when the resident's lights come on.
  useFrame(() => {
    if (!bloom.current) return;
    const s = useSceneStore.getState();
    const age = (performance.now() - s.eventAt) / 1000;
    const swell = s.event === 'success' ? Math.exp(-age * 1.4) * 0.9 : 0;
    bloom.current.intensity = BASE_BLOOM + swell;
  });

  return (
    <EffectComposer multisampling={4}>
      <Bloom
        ref={bloom}
        mipmapBlur
        intensity={BASE_BLOOM}
        luminanceThreshold={0.8}
        luminanceSmoothing={0.3}
        radius={0.75}
      />
      <Noise premultiply blendFunction={BlendFunction.SCREEN} opacity={0.35} />
      <Vignette offset={0.22} darkness={0.72} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  );
}

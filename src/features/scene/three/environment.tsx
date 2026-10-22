import { useMemo } from 'react';
import { Stars } from '@react-three/drei';
import { AdditiveBlending, BackSide, Color, ShaderMaterial } from 'three';
import { PODIUM_H, TOWER_D } from '../geometry';

export const FOG_COLOR = '#0a0d16';
export const FOG_DENSITY = 0.03;

const skyVertex = /* glsl */ `
  varying vec3 vDirection;
  void main() {
    vDirection = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/** Deep night overhead, a cool horizon, and the faint sodium glow of a city below it. */
const skyFragment = /* glsl */ `
  varying vec3 vDirection;
  void main() {
    float h = vDirection.y;
    vec3 top = vec3(0.004, 0.005, 0.010);
    vec3 horizon = vec3(0.030, 0.036, 0.060);
    vec3 cityGlow = vec3(0.075, 0.045, 0.022);
    vec3 color = mix(horizon, top, smoothstep(-0.02, 0.5, h));
    color += cityGlow * exp(-max(h, 0.0) * 12.0) * 0.8;
    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

const glowFragment = /* glsl */ `
  uniform vec3 uColor;
  varying vec2 vUv;
  void main() {
    float d = distance(vUv, vec2(0.5));
    float glow = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(uColor * glow * glow, 1.0);
  }
`;

const glowVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export function Environment() {
  const sky = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: skyVertex,
        fragmentShader: skyFragment,
        side: BackSide,
        depthWrite: false,
      }),
    [],
  );
  const lobbyGlow = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: glowVertex,
        fragmentShader: glowFragment,
        uniforms: { uColor: { value: new Color('#ff9c45').multiplyScalar(0.55) } },
        transparent: true,
        blending: AdditiveBlending,
        depthWrite: false,
      }),
    [],
  );

  return (
    <>
      <mesh material={sky} renderOrder={-1}>
        <sphereGeometry args={[140, 32, 16]} />
      </mesh>
      <Stars radius={100} depth={40} count={1600} factor={2.4} saturation={0} fade speed={0.35} />

      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[400, 400]} />
        <meshStandardMaterial color="#06070b" roughness={0.95} metalness={0.05} />
      </mesh>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.02, TOWER_D / 2 + 1.2]}
        material={lobbyGlow}
      >
        <planeGeometry args={[7, 5]} />
      </mesh>

      <hemisphereLight args={['#2c3a5c', '#020203', 1.1]} />
      <directionalLight position={[-14, 22, 16]} intensity={2.4} color="#a9bcff" />
      <directionalLight position={[18, 6, -10]} intensity={0.6} color="#ff9d5c" />
      <pointLight
        position={[0, PODIUM_H + 0.4, TOWER_D / 2 + 2]}
        intensity={7}
        distance={7}
        decay={2}
        color="#ffae58"
      />
    </>
  );
}

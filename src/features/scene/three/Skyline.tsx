import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  BoxGeometry,
  Color,
  InstancedBufferAttribute,
  Object3D,
  ShaderMaterial,
  type InstancedMesh,
} from 'three';
import { createRandom } from 'lib/random';
import { FOG_COLOR, FOG_DENSITY } from './environment';

const COUNT = 90;

/** Window grid drawn procedurally in the fragment shader: one draw call for the whole city. */
const vertexShader = /* glsl */ `
  attribute float aSeed;
  varying vec3 vWorld;
  varying vec3 vNormal;
  varying float vSeed;
  varying float vDepth;

  void main() {
    vec4 world = modelMatrix * instanceMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    vNormal = normalize(mat3(modelMatrix * instanceMatrix) * normal);
    vSeed = aSeed;
    vec4 view = viewMatrix * world;
    vDepth = -view.z;
    gl_Position = projectionMatrix * view;
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform vec3 uFogColor;
  uniform float uFogDensity;
  varying vec3 vWorld;
  varying vec3 vNormal;
  varying float vSeed;
  varying float vDepth;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  void main() {
    vec3 color = vec3(0.010, 0.012, 0.019);

    if (abs(vNormal.y) < 0.5) {
      vec2 uv = vec2(abs(vNormal.x) > 0.5 ? vWorld.z : vWorld.x, vWorld.y);
      vec2 cell = uv / vec2(0.34, 0.38);
      vec2 id = floor(cell);
      vec2 f = fract(cell);
      float pane = step(0.2, f.x) * step(f.x, 0.8) * step(0.24, f.y) * step(f.y, 0.76);
      float h = hash(id + vSeed * 17.0);
      float lit = step(0.86, h) * step(0.6, vWorld.y);
      float flicker = 0.85 + 0.15 * sin(uTime * (0.4 + h * 1.6) + h * 40.0);
      vec3 warm = mix(vec3(1.0, 0.5, 0.16), vec3(1.0, 0.76, 0.46), hash(id.yx + vSeed));
      color += pane * mix(vec3(0.012, 0.015, 0.024), warm * 0.55 * flicker, lit);
    }

    float fog = 1.0 - exp(-uFogDensity * uFogDensity * vDepth * vDepth);
    gl_FragColor = vec4(mix(color, uFogColor, clamp(fog, 0.0, 1.0)), 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export function Skyline() {
  const mesh = useRef<InstancedMesh>(null);

  const { geometry, material } = useMemo(() => {
    const box = new BoxGeometry(1, 1, 1);
    box.translate(0, 0.5, 0);
    const seeds = new Float32Array(COUNT).map((_, i) => i * 1.618);
    box.setAttribute('aSeed', new InstancedBufferAttribute(seeds, 1));
    const shader = new ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uFogColor: { value: new Color(FOG_COLOR) },
        uFogDensity: { value: FOG_DENSITY },
      },
    });
    return { geometry: box, material: shader };
  }, []);

  useLayoutEffect(() => {
    const instanced = mesh.current;
    if (!instanced) return;
    const random = createRandom(11);
    const dummy = new Object3D();
    // Camera looks from +x/+z; keep buildings behind and beside the tower, never in front.
    const camera = { x: 0.5, z: 0.86 };
    let placed = 0;
    while (placed < COUNT) {
      const angle = random() * Math.PI * 2;
      const radius = 16 + random() * 55;
      const x = Math.sin(angle) * radius;
      const z = Math.cos(angle) * radius;
      if (x * camera.x + z * camera.z > -6) continue;
      const far = radius / 71;
      dummy.position.set(x, 0, z);
      dummy.rotation.set(0, Math.round(random() * 4) * (Math.PI / 2) + (random() - 0.5) * 0.3, 0);
      // Mostly low-rise with the odd tower, so the silhouette never reads as a flat wall.
      const tower = random() < 0.14 ? 1.9 : 1;
      const height = (1.2 + random() ** 1.6 * (4 + far * 8)) * tower;
      dummy.scale.set(1.4 + random() * 2.6, height, 1.4 + random() * 2.6);
      dummy.updateMatrix();
      instanced.setMatrixAt(placed, dummy.matrix);
      placed += 1;
    }
    instanced.instanceMatrix.needsUpdate = true;
  }, []);

  useFrame((state) => {
    material.uniforms.uTime!.value = state.clock.elapsedTime;
  });

  return <instancedMesh ref={mesh} args={[geometry, material, COUNT]} frustumCulled={false} />;
}

import { useLayoutEffect, useMemo, useRef, type MutableRefObject } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import {
  BoxGeometry,
  BufferGeometry,
  Color,
  DoubleSide,
  Float32BufferAttribute,
  LineBasicMaterial,
  MathUtils,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  PlaneGeometry,
  Plane,
  Vector3,
  type InstancedMesh,
  type LineLoop,
  type Mesh,
} from 'three';
import { createRandom } from 'lib/random';
import {
  BAY,
  BODY_H,
  BODY_TOP,
  CROWN_H,
  FLOOR_H,
  MAST_H,
  PODIUM_H,
  TOWER_D,
  TOWER_TOP,
  TOWER_W,
  WINDOW_COUNT,
  WINDOW_H,
  WINDOW_W,
  windowPlacement,
  type WindowPlacement,
} from '../geometry';
import { litRatio, windowTarget, type LightingContext, type WindowInfo } from '../lighting';
import { useSceneStore } from '../sceneStore';
import { FLOORS, UNITS_PER_FACADE, unitFromIndex, unitIndex, type UnitRef } from '../tower';

const UNLIT = new Color('#0a0e17');
const LIT_PALETTE = ['#ff9a36', '#ffad52', '#ffbf72', '#ff8f3a', '#ffcf95'].map(
  (c) => new Color(c),
);
const TV_GLOW = new Color('#7f9dff');
/** The resident's own window: a deeper amber that stays saturated after ACES tone mapping. */
const LAMP = new Color('#ff8d1e');
const BLUEPRINT = new Color('#7aa2ff');
/** Lit windows exceed 1.0 so they cross the bloom threshold and glow (kept low to stay amber). */
const LIT_GAIN = 1.3;

/** Height (world y) up to which the tower is "built" (register mode), shared by all parts. */
type BuildLine = MutableRefObject<number>;

export function Tower() {
  const buildLine = useRef(TOWER_TOP + 1);
  // Solid parts keep y < buildLine; the blueprint wireframe keeps y > buildLine.
  const solidClip = useMemo(() => [new Plane(new Vector3(0, -1, 0), TOWER_TOP + 1)], []);
  const blueprintClip = useMemo(() => [new Plane(new Vector3(0, 1, 0), -(TOWER_TOP + 1))], []);

  useFrame((_, delta) => {
    const s = useSceneStore.getState();
    const target =
      s.mode === 'register'
        ? PODIUM_H + Math.max(0.05, s.progress) * (TOWER_TOP + 0.2 - PODIUM_H)
        : TOWER_TOP + 1;
    buildLine.current =
      s.paused || s.reducedMotion
        ? target
        : MathUtils.damp(buildLine.current, target, 2.2, Math.min(delta, 0.1));
    solidClip[0]!.constant = buildLine.current;
    blueprintClip[0]!.constant = -buildLine.current;
  });

  return (
    <group>
      <Podium />
      <Body clip={solidClip} />
      <Windows clip={solidClip} />
      <UnitMarkers />
      <Crown clip={solidClip} />
      <Elevator clip={solidClip} />
      <Blueprint clip={blueprintClip} buildLine={buildLine} />
    </group>
  );
}

function Podium() {
  const width = TOWER_W + 0.9;
  const depth = TOWER_D + 0.9;
  return (
    <group>
      <mesh position={[0, PODIUM_H / 2, 0]}>
        <boxGeometry args={[width, PODIUM_H, depth]} />
        <meshStandardMaterial color="#0b0e15" roughness={0.8} metalness={0.2} />
      </mesh>
      {/* Lobby glazing */}
      <mesh position={[0, 0.34, depth / 2 + 0.005]}>
        <planeGeometry args={[1.7, 0.5]} />
        <meshBasicMaterial color={new Color('#ffa24a').multiplyScalar(1.15)} />
      </mesh>
      {/* Canopy */}
      <mesh position={[0, 0.66, depth / 2 + 0.18]}>
        <boxGeometry args={[2.1, 0.04, 0.4]} />
        <meshStandardMaterial color="#171c28" roughness={0.6} />
      </mesh>
    </group>
  );
}

function Body({ clip }: { clip: Plane[] }) {
  const slabs = useRef<InstancedMesh>(null);
  const fins = useRef<InstancedMesh>(null);

  const materials = useMemo(
    () => ({
      body: new MeshStandardMaterial({
        color: '#121723',
        roughness: 0.5,
        metalness: 0.4,
        side: DoubleSide,
        clippingPlanes: clip,
      }),
      trim: new MeshStandardMaterial({
        color: '#323b52',
        roughness: 0.35,
        metalness: 0.6,
        clippingPlanes: clip,
      }),
    }),
    [clip],
  );

  useLayoutEffect(() => {
    const dummy = new Object3D();
    const slabMesh = slabs.current;
    const finMesh = fins.current;
    if (!slabMesh || !finMesh) return;

    for (let floor = 0; floor <= FLOORS; floor += 1) {
      dummy.position.set(0, PODIUM_H + floor * FLOOR_H, 0);
      dummy.scale.set(TOWER_W + 0.06, 0.028, TOWER_D + 0.06);
      dummy.updateMatrix();
      slabMesh.setMatrixAt(floor, dummy.matrix);
    }

    let index = 0;
    for (let k = 0; k <= UNITS_PER_FACADE; k += 1) {
      // Front facade mullions
      dummy.position.set(-TOWER_W / 2 + k * BAY, PODIUM_H + BODY_H / 2, TOWER_D / 2 + 0.022);
      dummy.scale.set(0.034, BODY_H, 0.05);
      dummy.updateMatrix();
      finMesh.setMatrixAt(index++, dummy.matrix);
      // Side facade mullions
      dummy.position.set(TOWER_W / 2 + 0.022, PODIUM_H + BODY_H / 2, TOWER_D / 2 - k * BAY);
      dummy.scale.set(0.05, BODY_H, 0.034);
      dummy.updateMatrix();
      finMesh.setMatrixAt(index++, dummy.matrix);
    }
    slabMesh.instanceMatrix.needsUpdate = true;
    finMesh.instanceMatrix.needsUpdate = true;
  }, []);

  const unitBox = useMemo(() => new BoxGeometry(1, 1, 1), []);

  return (
    <group>
      <mesh position={[0, PODIUM_H + BODY_H / 2, 0]} material={materials.body}>
        <boxGeometry args={[TOWER_W, BODY_H, TOWER_D]} />
      </mesh>
      <instancedMesh
        ref={slabs}
        args={[unitBox, materials.trim, FLOORS + 1]}
        frustumCulled={false}
      />
      <instancedMesh
        ref={fins}
        args={[unitBox, materials.trim, (UNITS_PER_FACADE + 1) * 2]}
        frustumCulled={false}
      />
    </group>
  );
}

interface WindowData extends WindowInfo {
  placement: WindowPlacement;
  color: Color;
  /** Per-window easing rate, so lights don't switch in lockstep. */
  speed: number;
}

function Windows({ clip }: { clip: Plane[] }) {
  const mesh = useRef<InstancedMesh>(null);
  const swapTimer = useRef(0);

  const windows = useMemo<WindowData[]>(() => {
    const random = createRandom(2026);
    return Array.from({ length: WINDOW_COUNT }, (_, index) => {
      const unit = unitFromIndex(index);
      const placement = windowPlacement(unit);
      const tv = random() < 0.07;
      return {
        floor: unit.floor,
        column: placement.column,
        rank: random(),
        placement,
        color: tv ? TV_GLOW : LIT_PALETTE[Math.floor(random() * LIT_PALETTE.length)]!,
        speed: 2.2 + random() * 5,
      };
    });
  }, []);

  const levels = useMemo(() => new Float32Array(WINDOW_COUNT), []);
  const geometry = useMemo(() => new PlaneGeometry(WINDOW_W, WINDOW_H), []);
  const material = useMemo(() => new MeshBasicMaterial({ clippingPlanes: clip }), [clip]);
  const scratch = useMemo(() => new Color(), []);

  useLayoutEffect(() => {
    const instanced = mesh.current;
    if (!instanced) return;
    const dummy = new Object3D();
    windows.forEach(({ placement }, index) => {
      dummy.position.set(placement.x, placement.y, placement.z);
      dummy.rotation.set(0, placement.rotationY, 0);
      dummy.updateMatrix();
      instanced.setMatrixAt(index, dummy.matrix);
      instanced.setColorAt(index, UNLIT);
    });
    instanced.instanceMatrix.needsUpdate = true;
    instanced.computeBoundingSphere();
  }, [windows]);

  useFrame((state, delta) => {
    const instanced = mesh.current;
    if (!instanced?.instanceColor) return;
    const s = useSceneStore.getState();
    const snap = s.paused || s.reducedMotion;
    const dt = Math.min(delta, 0.1);
    const context: LightingContext = {
      ratio: litRatio(s.mode, s.strength),
      event: s.event,
      eventAge: (performance.now() - s.eventAt) / 1000,
      time: state.clock.elapsedTime,
      selected: s.unit ? { floor: s.unit.floor, column: s.unit.unit - 1 } : null,
    };
    const selectedIndex = s.unit ? unitIndex(s.unit) : -1;
    const flicker = s.event === 'error' && context.eventAge < 0.45 && !snap;

    // Ambient life: every so often one lit and one dark window trade places.
    swapTimer.current += dt;
    if (!snap && swapTimer.current > 0.6) {
      swapTimer.current = 0;
      const a = windows[Math.floor(Math.random() * WINDOW_COUNT)]!;
      const b = windows[Math.floor(Math.random() * WINDOW_COUNT)]!;
      const aLit = a.rank < context.ratio;
      const bLit = b.rank < context.ratio;
      if (aLit !== bLit) [a.rank, b.rank] = [b.rank, a.rank];
    }

    for (let index = 0; index < WINDOW_COUNT; index += 1) {
      const pane = windows[index]!;
      const isSelected = index === selectedIndex;
      const target = windowTarget(pane, isSelected, context);
      const current = levels[index]!;
      const level = snap ? target : current + (target - current) * (1 - Math.exp(-pane.speed * dt));
      levels[index] = level;

      let intensity = level;
      if (flicker) intensity *= Math.random() < 0.55 ? 1 : 0.1;
      const mix = Math.min(intensity, 1);
      scratch
        .copy(UNLIT)
        .lerp(isSelected ? LAMP : pane.color, mix)
        .multiplyScalar(intensity > 1 ? intensity * LIT_GAIN : 1 + (LIT_GAIN - 1) * mix);
      instanced.setColorAt(index, scratch);
    }
    instanced.instanceColor.needsUpdate = true;
  });

  const unitAt = (event: ThreeEvent<PointerEvent | MouseEvent>): UnitRef | null =>
    event.instanceId === undefined ? null : unitFromIndex(event.instanceId);

  return (
    <instancedMesh
      ref={mesh}
      args={[geometry, material, WINDOW_COUNT]}
      frustumCulled={false}
      onPointerMove={(event) => {
        const s = useSceneStore.getState();
        if (s.mode !== 'register') return;
        event.stopPropagation();
        s.setHovered(unitAt(event));
      }}
      onPointerOut={() => useSceneStore.getState().setHovered(null)}
      onClick={(event) => {
        const s = useSceneStore.getState();
        const unit = unitAt(event);
        if (s.mode !== 'register' || !unit) return;
        event.stopPropagation();
        s.pickUnit?.(unit);
      }}
    />
  );
}

/**
 * Unclipped markers for the resident's window and the hovered window, so both stay visible
 * even above the build line, floating in the blueprint.
 */
function UnitMarkers() {
  const selected = useRef<Mesh>(null);
  const hover = useRef<LineLoop>(null);

  const outline = useMemo(() => {
    const w = WINDOW_W / 2 + 0.04;
    const h = WINDOW_H / 2 + 0.04;
    return new BufferGeometry().setAttribute(
      'position',
      new Float32BufferAttribute([-w, -h, 0, w, -h, 0, w, h, 0, -w, h, 0], 3),
    );
  }, []);

  useFrame((state) => {
    const s = useSceneStore.getState();
    const place = (object: Object3D | null, unit: UnitRef | null, lift: number) => {
      if (!object) return;
      object.visible = !!unit;
      if (!unit) return;
      const p = windowPlacement(unit);
      object.position.set(p.x + p.normalX * lift, p.y, p.z + p.normalZ * lift);
      object.rotation.set(0, p.rotationY, 0);
    };
    const showSelected = s.mode !== 'login' || s.event === 'success';
    place(selected.current, showSelected ? s.unit : null, 0.004);
    place(hover.current, s.mode === 'register' ? s.hovered : null, 0.012);
    if (selected.current) {
      const pulse = s.event === 'signout' ? 0 : 1.7 + 0.4 * Math.sin(state.clock.elapsedTime * 3.2);
      (selected.current.material as MeshBasicMaterial).color.copy(LAMP).multiplyScalar(pulse);
    }
  });

  return (
    <group>
      <mesh ref={selected} visible={false}>
        <planeGeometry args={[WINDOW_W, WINDOW_H]} />
        <meshBasicMaterial color={LAMP} />
      </mesh>
      <lineLoop ref={hover} geometry={outline} visible={false}>
        <lineBasicMaterial color={BLUEPRINT.clone().multiplyScalar(3)} />
      </lineLoop>
    </group>
  );
}

function Crown({ clip }: { clip: Plane[] }) {
  const beacon = useRef<MeshBasicMaterial>(null);
  const materials = useMemo(
    () => ({
      crown: new MeshStandardMaterial({
        color: '#121722',
        roughness: 0.5,
        metalness: 0.5,
        clippingPlanes: clip,
      }),
      halo: new MeshBasicMaterial({
        color: new Color('#ffd7a1').multiplyScalar(1.25),
        clippingPlanes: clip,
      }),
      mast: new MeshStandardMaterial({ color: '#2a3142', clippingPlanes: clip }),
    }),
    [clip],
  );

  useFrame((state) => {
    if (!beacon.current) return;
    const on = state.clock.elapsedTime % 1.6 < 0.2;
    beacon.current.color.set('#ff3b30').multiplyScalar(on ? 6 : 0.35);
  });

  return (
    <group>
      {/* Lit crown band */}
      <mesh position={[0, BODY_TOP + 0.05, 0]} material={materials.halo}>
        <boxGeometry args={[TOWER_W + 0.08, 0.06, TOWER_D + 0.08]} />
      </mesh>
      <mesh position={[0, BODY_TOP + CROWN_H / 2 + 0.08, 0]} material={materials.crown}>
        <boxGeometry args={[TOWER_W * 0.78, CROWN_H, TOWER_D * 0.78]} />
      </mesh>
      <mesh position={[0, BODY_TOP + CROWN_H + MAST_H / 2, 0]} material={materials.mast}>
        <cylinderGeometry args={[0.022, 0.03, MAST_H, 8]} />
      </mesh>
      <mesh position={[0, TOWER_TOP, 0]}>
        <sphereGeometry args={[0.065, 16, 16]} />
        <meshBasicMaterial ref={beacon} clippingPlanes={clip} />
      </mesh>
    </group>
  );
}

const SHAFT_X = -TOWER_W / 2 - 0.19;
const SHAFT_Z = TOWER_D / 2 - 0.32;

/** Glass lift shaft on the front-left corner; the cab wanders, then rides to your floor. */
function Elevator({ clip }: { clip: Plane[] }) {
  const cab = useRef<Mesh>(null);
  const motion = useRef({ y: PODIUM_H + FLOOR_H / 2, floor: 1, nextHopAt: 2 });

  useFrame((state, delta) => {
    const s = useSceneStore.getState();
    const m = motion.current;
    const time = state.clock.elapsedTime;
    let floor = m.floor;

    if (s.event === 'submitting' || s.event === 'success') floor = s.unit?.floor ?? FLOORS;
    else if (s.event === 'signout') floor = 1;
    else if (time > m.nextHopAt) {
      m.floor = 1 + Math.floor(Math.random() * FLOORS);
      m.nextHopAt = time + 4 + Math.random() * 4;
      floor = m.floor;
    }

    const targetY = PODIUM_H + FLOOR_H * (floor - 0.5);
    const speed = s.event === 'submitting' ? 9 : 2.4;
    const step = speed * Math.min(delta, 0.1);
    const diff = targetY - m.y;
    m.y =
      s.paused || s.reducedMotion
        ? targetY
        : m.y + Math.sign(diff) * Math.min(Math.abs(diff), step);
    if (cab.current) cab.current.position.y = m.y;
  });

  return (
    <group position={[SHAFT_X, 0, SHAFT_Z]}>
      <mesh position={[0, PODIUM_H + BODY_H / 2, 0]}>
        <boxGeometry args={[0.3, BODY_H, 0.3]} />
        <meshStandardMaterial
          color="#121a28"
          transparent
          opacity={0.55}
          roughness={0.15}
          metalness={0.7}
          clippingPlanes={clip}
        />
      </mesh>
      <mesh ref={cab}>
        <boxGeometry args={[0.22, 0.28, 0.22]} />
        <meshBasicMaterial color={new Color('#fff1d6').multiplyScalar(2.6)} clippingPlanes={clip} />
      </mesh>
    </group>
  );
}

function blueprintGeometry() {
  const points: number[] = [];
  const line = (a: [number, number, number], b: [number, number, number]) =>
    points.push(...a, ...b);
  const hw = TOWER_W / 2;
  const hd = TOWER_D / 2;

  for (let floor = 0; floor <= FLOORS; floor += 1) {
    const y = PODIUM_H + floor * FLOOR_H;
    line([-hw, y, -hd], [hw, y, -hd]);
    line([hw, y, -hd], [hw, y, hd]);
    line([hw, y, hd], [-hw, y, hd]);
    line([-hw, y, hd], [-hw, y, -hd]);
  }
  for (let k = 0; k <= UNITS_PER_FACADE; k += 1) {
    const x = -hw + k * BAY;
    const z = hd - k * BAY;
    line([x, PODIUM_H, hd], [x, BODY_TOP, hd]);
    line([hw, PODIUM_H, z], [hw, BODY_TOP, z]);
    line([x, PODIUM_H, -hd], [x, BODY_TOP, -hd]);
    line([-hw, PODIUM_H, z], [-hw, BODY_TOP, z]);
  }
  // Window openings on the two visible facades
  for (let index = 0; index < WINDOW_COUNT; index += 1) {
    const p = windowPlacement(unitFromIndex(index));
    const w = WINDOW_W / 2;
    const h = WINDOW_H / 2;
    const corner = (dx: number, dy: number): [number, number, number] =>
      p.normalZ ? [p.x + dx, p.y + dy, p.z] : [p.x, p.y + dy, p.z - dx];
    line(corner(-w, -h), corner(w, -h));
    line(corner(w, -h), corner(w, h));
    line(corner(w, h), corner(-w, h));
    line(corner(-w, h), corner(-w, -h));
  }
  // Crown + mast
  const cw = (TOWER_W * 0.78) / 2;
  const top = BODY_TOP + CROWN_H + 0.08;
  for (const [x, z] of [
    [-cw, -cw],
    [cw, -cw],
    [cw, cw],
    [-cw, cw],
  ] as const) {
    line([x, BODY_TOP, z], [x, top, z]);
  }
  line([0, top, 0], [0, TOWER_TOP, 0]);

  return new BufferGeometry().setAttribute('position', new Float32BufferAttribute(points, 3));
}

/** Drafting wireframe of the unbuilt floors, plus a glowing scan line at the build height. */
function Blueprint({ clip, buildLine }: { clip: Plane[]; buildLine: BuildLine }) {
  const ring = useRef<LineLoop>(null);
  const geometry = useMemo(blueprintGeometry, []);
  const lines = useMemo(
    () =>
      new LineBasicMaterial({
        color: BLUEPRINT,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        clippingPlanes: clip,
      }),
    [clip],
  );
  const ringMaterial = useMemo(
    () =>
      new LineBasicMaterial({
        color: BLUEPRINT.clone().multiplyScalar(3.2),
        transparent: true,
        opacity: 0,
      }),
    [],
  );
  const ringGeometry = useMemo(() => {
    const hw = TOWER_W / 2 + 0.14;
    const hd = TOWER_D / 2 + 0.14;
    return new BufferGeometry().setAttribute(
      'position',
      new Float32BufferAttribute([-hw, 0, -hd, hw, 0, -hd, hw, 0, hd, -hw, 0, hd], 3),
    );
  }, []);

  useFrame((_, delta) => {
    const s = useSceneStore.getState();
    const target = s.mode === 'register' ? 1 : 0;
    const snap = s.paused || s.reducedMotion;
    const dt = Math.min(delta, 0.1);
    lines.opacity = snap ? target * 0.5 : MathUtils.damp(lines.opacity, target * 0.5, 3, dt);
    const ringTarget = s.mode === 'register' && buildLine.current < TOWER_TOP ? 1 : 0;
    ringMaterial.opacity = snap
      ? ringTarget
      : MathUtils.damp(ringMaterial.opacity, ringTarget, 4, dt);
    lines.visible = lines.opacity > 0.01;
    if (ring.current) {
      ring.current.visible = ringMaterial.opacity > 0.01;
      ring.current.position.y = buildLine.current;
    }
  });

  return (
    <group>
      <lineSegments geometry={geometry} material={lines} />
      <lineLoop ref={ring} geometry={ringGeometry} material={ringMaterial} />
    </group>
  );
}

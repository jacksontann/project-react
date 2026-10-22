import { Html } from '@react-three/drei';
import { describeUnit } from 'features/auth/unit';
import { windowPlacement } from '../geometry';
import { useSceneStore } from '../sceneStore';

/** Architectural callout pinned to the resident's window: "YOUR HOME · FLR 12 · UNIT 03". */
export function UnitCallout() {
  const unit = useSceneStore((s) => s.unit);
  const mode = useSceneStore((s) => s.mode);
  const event = useSceneStore((s) => s.event);

  const visible =
    !!unit &&
    event !== 'signout' &&
    (mode === 'home' || mode === 'register' || (mode === 'login' && event === 'success'));
  if (!unit || !visible) return null;

  const p = windowPlacement(unit);
  const label = mode === 'register' ? describeUnit(unit) : `Your home · ${describeUnit(unit)}`;

  return (
    <group position={[p.x, p.y, p.z]}>
      <Html zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}>
        <div className="relative -translate-x-full -translate-y-full pb-5 pr-5">
          <div className="whitespace-nowrap rounded-md bg-night/75 px-2.5 py-1 font-mono text-eyebrow uppercase text-lamp ring-1 ring-lamp/40 backdrop-blur-sm">
            {label}
          </div>
          {/* Leader line from the label down to the window */}
          <svg
            className="absolute bottom-0 right-0 size-5 overflow-visible text-lamp/70"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path d="M0 0 L20 20" stroke="currentColor" strokeWidth="1" fill="none" />
            <circle cx="20" cy="20" r="2.5" fill="currentColor" />
          </svg>
        </div>
      </Html>
    </group>
  );
}

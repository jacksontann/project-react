import { Html } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { describeUnit } from 'features/auth/unit';
import { cn } from 'lib/cn';
import { windowPlacement } from '../geometry';
import { useSceneStore } from '../sceneStore';

/** Architectural callout pinned to the resident's window: "YOUR HOME · FLR 12 · UNIT 03". */
export function UnitCallout() {
  const unit = useSceneStore((s) => s.unit);
  const mode = useSceneStore((s) => s.mode);
  const event = useSceneStore((s) => s.event);
  // On phones the tower is centred, so a label to its left would run off-screen.
  const toRight = useThree((s) => s.size.width) < 640;

  const visible =
    !!unit &&
    event !== 'signout' &&
    (mode === 'home' || mode === 'register' || (mode === 'login' && event === 'success'));
  if (!unit || !visible) return null;

  const p = windowPlacement(unit);
  // Phones: the panel right below already says whose home this is, so keep the label short.
  const label =
    mode === 'register' || toRight ? describeUnit(unit) : `Your home · ${describeUnit(unit)}`;

  return (
    <group position={[p.x, p.y, p.z]}>
      <Html zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}>
        <div
          className={cn(
            'relative -translate-y-full pb-5',
            toRight ? 'pl-5' : '-translate-x-full pr-5',
          )}
        >
          <div className="whitespace-nowrap rounded-md bg-night/75 px-2.5 py-1 font-mono text-eyebrow uppercase text-lamp ring-1 ring-lamp/40 backdrop-blur-sm">
            {label}
          </div>
          {/* Leader line from the label down to the window */}
          <svg
            className={cn(
              'absolute bottom-0 size-5 overflow-visible text-lamp/70',
              toRight ? 'left-0' : 'right-0',
            )}
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            {toRight ? (
              <>
                <path d="M20 0 L0 20" stroke="currentColor" strokeWidth="1" fill="none" />
                <circle cx="0" cy="20" r="2.5" fill="currentColor" />
              </>
            ) : (
              <>
                <path d="M0 0 L20 20" stroke="currentColor" strokeWidth="1" fill="none" />
                <circle cx="20" cy="20" r="2.5" fill="currentColor" />
              </>
            )}
          </svg>
        </div>
      </Html>
    </group>
  );
}

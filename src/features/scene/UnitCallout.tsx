import { describeUnit } from 'features/auth/unit';
import { useMediaQuery } from 'hooks/useMediaQuery';
import { cn } from 'lib/cn';
import { calloutAnchor } from './calloutAnchor';
import { useSceneStore } from './sceneStore';

/**
 * Architectural callout pinned to the resident's window ("YOUR HOME · FLR 12 · UNIT 03").
 * A plain DOM label; `CalloutTracker` inside the canvas moves it to the window every frame.
 * It stays hidden until the 3D scene is running, since the poster has no window to point at.
 */
export function UnitCallout() {
  const unit = useSceneStore((s) => s.unit);
  const mode = useSceneStore((s) => s.mode);
  const event = useSceneStore((s) => s.event);
  // On phones the tower is centred, so a label to its left would run off-screen.
  const toRight = useMediaQuery('(max-width: 639px)');

  const visible =
    !!unit &&
    event !== 'signout' &&
    (mode === 'home' || mode === 'register' || (mode === 'login' && event === 'success'));

  const label = !unit
    ? ''
    : mode === 'register' || toRight
      ? describeUnit(unit)
      : `Your home · ${describeUnit(unit)}`;

  return (
    <div
      ref={(element) => {
        calloutAnchor.current = element;
      }}
      className="pointer-events-none absolute left-0 top-0 z-10"
      style={{ visibility: 'hidden' }}
    >
      <div
        className={cn(
          'relative -translate-y-full pb-5 transition-opacity duration-300',
          toRight ? 'pl-5' : '-translate-x-full pr-5',
          visible ? 'opacity-100' : 'opacity-0',
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
          <path
            d={toRight ? 'M20 0 L0 20' : 'M0 0 L20 20'}
            stroke="currentColor"
            strokeWidth="1"
            fill="none"
          />
          <circle cx={toRight ? 0 : 20} cy="20" r="2.5" fill="currentColor" />
        </svg>
      </div>
    </div>
  );
}

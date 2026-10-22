import { Pause, Play } from 'lucide-react';
import { useSceneStore } from './sceneStore';

/** WCAG 2.2.2 (Pause, Stop, Hide): the ambient scene moves indefinitely, so it can be paused. */
export function MotionToggle() {
  const paused = useSceneStore((s) => s.paused);
  const setPaused = useSceneStore((s) => s.setPaused);

  return (
    <button
      type="button"
      onClick={() => setPaused(!paused)}
      aria-pressed={paused}
      className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-mono text-eyebrow uppercase text-ink-muted transition-colors hover:bg-white/5 hover:text-ink"
    >
      {paused ? (
        <Play className="size-3" aria-hidden="true" />
      ) : (
        <Pause className="size-3" aria-hidden="true" />
      )}
      <span className="sr-only sm:not-sr-only">{paused ? 'Play motion' : 'Pause motion'}</span>
    </button>
  );
}

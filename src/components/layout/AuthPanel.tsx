import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { m } from 'framer-motion';
import { useSceneStore } from 'features/scene/sceneStore';
import { cn } from 'lib/cn';
import { easeOutExpo } from 'lib/motion';

/** Tracks an element's rendered height so the panel can animate between page sizes. */
function useMeasuredHeight<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [height, setHeight] = useState<number | 'auto'>('auto');

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      setHeight(entry?.borderBoxSize[0]?.blockSize ?? element.offsetHeight);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return [ref, height] as const;
}

const SHAKE: Keyframe[] = [
  { transform: 'translateX(0)' },
  { transform: 'translateX(-7px)' },
  { transform: 'translateX(6px)' },
  { transform: 'translateX(-3px)' },
  { transform: 'translateX(0)' },
];

/**
 * The floating glass panel (a bottom sheet on phones). Its height animates as content changes,
 * so moving between sign-in and registration reads as one panel morphing, and it gives a small
 * shake whenever the scene reports an error.
 */
export function AuthPanel({ children, className }: { children: ReactNode; className?: string }) {
  const [contentRef, height] = useMeasuredHeight<HTMLDivElement>();
  const panelRef = useRef<HTMLElement>(null);

  useEffect(
    () =>
      useSceneStore.subscribe((state, previous) => {
        if (state.event !== 'error' || state.eventAt === previous.eventAt) return;
        if (state.reducedMotion) return;
        // Optional call: environments without the Web Animations API simply skip the shake.
        panelRef.current?.animate?.(SHAKE, {
          duration: 340,
          easing: 'cubic-bezier(0.36, 0.07, 0.19, 0.97)',
        });
      }),
    [],
  );

  return (
    <section
      ref={panelRef}
      className={cn(
        'pointer-events-auto relative w-full flex-1 overflow-clip rounded-t-panel bg-glass/80 shadow-panel ring-1 ring-line backdrop-blur-2xl',
        'sm:my-24 sm:w-[440px] sm:flex-none sm:rounded-panel',
        className,
      )}
    >
      {/* Faint warm spill in the top-right corner, echoing the lit pane in the logo.
          overflow-clip (not hidden): the glow overhangs, and a scroll container could be
          scrolled sideways by focus() calls. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-28 -top-28 size-72 rounded-full bg-lamp/[0.09] blur-3xl"
      />
      <m.div
        className="relative"
        initial={false}
        animate={{ height }}
        transition={{ duration: 0.5, ease: easeOutExpo }}
      >
        <div ref={contentRef} className="px-6 pb-10 pt-8 sm:px-10 sm:py-10">
          {children}
        </div>
      </m.div>
    </section>
  );
}

import { useEffect, type RefObject } from 'react';
import { FINE_POINTER } from './useMediaQuery';

interface MagneticOptions {
  enabled?: boolean;
  /** Extra reach around the element, in px. */
  radius?: number;
  strength?: number;
}

/**
 * Pulls an element slightly towards the pointer when it comes close. Writes the CSS `translate`
 * property (not `transform`), so it composes with press/scale styles and never re-renders React.
 */
export function useMagnetic<T extends HTMLElement>(
  ref: RefObject<T | null>,
  { enabled = true, radius = 56, strength = 0.18 }: MagneticOptions = {},
) {
  useEffect(() => {
    const element = ref.current;
    if (!enabled || !element) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || !window.matchMedia(FINE_POINTER).matches) return;

    let frame = 0;
    const onMove = (event: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = element.getBoundingClientRect();
        const dx = event.clientX - (rect.left + rect.width / 2);
        const dy = event.clientY - (rect.top + rect.height / 2);
        const near =
          Math.abs(dx) < rect.width / 2 + radius && Math.abs(dy) < rect.height / 2 + radius;
        element.style.translate = near ? `${dx * strength * 0.3}px ${dy * strength}px` : '';
      });
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(frame);
      element.style.translate = '';
    };
  }, [ref, enabled, radius, strength]);
}

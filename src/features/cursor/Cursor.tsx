import { useEffect, useState } from 'react';
import { AnimatePresence, m, useMotionValue, useReducedMotion, useSpring } from 'framer-motion';
import { describeUnit } from 'features/auth/unit';
import { useSceneStore } from 'features/scene/sceneStore';
import { FINE_POINTER, useMediaQuery } from 'hooks/useMediaQuery';
import { cn } from 'lib/cn';
import { easeOutExpo } from 'lib/motion';
import { cursorVariantFor, sameVariant, type CursorVariant } from './cursorVariant';

const RING_SPRING = { stiffness: 520, damping: 42, mass: 0.55 };

const RING_SHAPES = {
  default: { width: 34, height: 34, borderRadius: 17, opacity: 1 },
  link: { width: 52, height: 52, borderRadius: 26, opacity: 1 },
  magnetic: { width: 70, height: 70, borderRadius: 35, opacity: 1 },
  text: { width: 3, height: 24, borderRadius: 2, opacity: 1 },
  label: { width: 64, height: 26, borderRadius: 13, opacity: 1 },
  scene: { width: 22, height: 22, borderRadius: 4, opacity: 1 },
} as const;

/**
 * Custom cursor: an exact amber dot plus a spring-lagged ring that morphs with context.
 * Mouse/trackpad only; disabled for touch and for reduced motion. Purely decorative: focus
 * rings and the native caret remain the real affordances.
 */
export function Cursor() {
  const finePointer = useMediaQuery(FINE_POINTER);
  const reducedMotion = useReducedMotion();
  const enabled = finePointer && !reducedMotion;

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const ringX = useSpring(x, RING_SPRING);
  const ringY = useSpring(y, RING_SPRING);
  const [hoverVariant, setVariant] = useState<CursorVariant>({ kind: 'default' });
  const [visible, setVisible] = useState(false);
  const [pressed, setPressed] = useState(false);
  const hovered = useSceneStore((s) => s.hovered);
  const sceneMode = useSceneStore((s) => s.mode);
  // The drafting crosshair only means something while picking a unit.
  const variant: CursorVariant =
    hoverVariant.kind === 'scene' && sceneMode !== 'register' ? { kind: 'default' } : hoverVariant;

  useEffect(() => {
    if (!enabled) return;
    const root = document.documentElement;
    root.classList.add('has-custom-cursor');

    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return;
      x.set(event.clientX);
      y.set(event.clientY);
      setVisible(true);
    };
    const onOver = (event: PointerEvent) => {
      const next = cursorVariantFor(event.target instanceof Element ? event.target : null);
      setVariant((current) => (sameVariant(current, next) ? current : next));
    };
    const onOut = (event: PointerEvent) => {
      if (!event.relatedTarget) setVisible(false);
    };
    const onDown = () => setPressed(true);
    const onUp = () => setPressed(false);

    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerover', onOver);
    document.addEventListener('pointerout', onOut);
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);
    return () => {
      root.classList.remove('has-custom-cursor');
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerover', onOver);
      document.removeEventListener('pointerout', onOut);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
    };
  }, [enabled, x, y]);

  if (!enabled) return null;

  const sceneLabel = variant.kind === 'scene' && hovered ? describeUnit(hovered) : null;
  const ring = RING_SHAPES[variant.kind];

  return (
    <div aria-hidden="true" className="custom-cursor pointer-events-none fixed inset-0 z-[100]">
      <m.div
        className="absolute left-0 top-0 grid place-items-center"
        style={{ x: ringX, y: ringY, translateX: '-50%', translateY: '-50%' }}
        animate={{ ...ring, opacity: visible ? 1 : 0, scale: pressed ? 0.86 : 1 }}
        transition={{ duration: 0.28, ease: easeOutExpo }}
      >
        <span
          className={cn(
            'absolute inset-0 rounded-[inherit] transition-[background-color,border-color,box-shadow] duration-300',
            variant.kind === 'default' && 'border border-ink/40',
            variant.kind === 'link' && 'border border-lamp/60 bg-lamp/10',
            variant.kind === 'magnetic' &&
              'border border-lamp/40 bg-lamp/15 shadow-[0_0_30px_rgb(var(--lamp)/0.35)]',
            (variant.kind === 'text' || variant.kind === 'label') && 'bg-lamp',
            variant.kind === 'scene' && 'border border-blueprint/70',
          )}
        />
        {variant.kind === 'label' ? (
          <span className="relative font-mono text-[10px] uppercase tracking-[0.12em] text-lamp-ink">
            {variant.text}
          </span>
        ) : null}
        {variant.kind === 'scene' ? (
          <>
            <span className="absolute h-px w-3 bg-blueprint/80" />
            <span className="absolute h-3 w-px bg-blueprint/80" />
          </>
        ) : null}
      </m.div>

      <m.div
        className="absolute left-0 top-0 size-1.5 rounded-full bg-lamp shadow-[0_0_10px_rgb(var(--lamp)/0.8)]"
        style={{ x, y, translateX: '-50%', translateY: '-50%' }}
        animate={{
          opacity: visible && (variant.kind === 'default' || variant.kind === 'scene') ? 1 : 0,
        }}
        transition={{ duration: 0.15 }}
      />

      <AnimatePresence>
        {sceneLabel ? (
          <m.div
            key="scene-label"
            className="absolute left-0 top-0 whitespace-nowrap rounded-md bg-night/80 px-2 py-1 font-mono text-eyebrow uppercase text-blueprint ring-1 ring-blueprint/40 backdrop-blur-sm"
            style={{ x, y, translateX: 18, translateY: 14 }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.18 }}
          >
            {sceneLabel} · Click to pick
          </m.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

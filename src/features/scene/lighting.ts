import type { SceneEvent, SceneMode } from './sceneStore';
import { FLOORS } from './tower';

/*
 * Pure lighting rules for the tower's windows: no three.js here, so they're unit-testable.
 * A window's target is 0 (dark) to ~2.5 (blooming); the render loop eases towards it.
 */

const REGISTER_RATIO_BY_STRENGTH = [0.12, 0.2, 0.32, 0.46, 0.6];

/** Fraction of windows lit for a given mode (and password strength while registering). */
export function litRatio(mode: SceneMode, strength: number | null) {
  if (mode === 'home') return 0.34;
  if (mode === 'register') {
    return strength === null ? 0.18 : (REGISTER_RATIO_BY_STRENGTH[strength] ?? 0.18);
  }
  return 0.36;
}

/** Seconds for the sign-out sweep to switch every floor off, top to bottom. */
export const SIGNOUT_SWEEP_S = 0.9;
/** Seconds the success wave takes per window-step away from the resident's unit. */
export const WAVE_S_PER_STEP = 0.055;

export interface WindowInfo {
  floor: number;
  /** 0–7, continuous around the corner from the front facade to the side facade. */
  column: number;
  /** Stable random 0–1; windows with rank below the lit ratio are on. */
  rank: number;
}

export interface LightingContext {
  ratio: number;
  event: SceneEvent;
  /** Seconds since the event fired. */
  eventAge: number;
  time: number;
  selected: { floor: number; column: number } | null;
}

export function windowTarget(pane: WindowInfo, isSelected: boolean, context: LightingContext) {
  if (context.event === 'signout') {
    const delay = ((FLOORS - pane.floor) / FLOORS) * SIGNOUT_SWEEP_S;
    if (context.eventAge > delay) return 0;
  }

  if (isSelected) return 2.1 + 0.35 * Math.sin(context.time * 3.2);

  let target = pane.rank < context.ratio ? 1 : 0;

  // Success: a wave of light ripples outwards from the resident's window.
  if (context.event === 'success' && context.selected) {
    const distance = Math.hypot(
      pane.floor - context.selected.floor,
      pane.column - context.selected.column,
    );
    const since = context.eventAge - distance * WAVE_S_PER_STEP;
    if (since > 0) target += Math.exp(-since * 3.2) * 1.4;
  }

  return target;
}

import { create } from 'zustand';
import { isSameUnit, type UnitRef } from './tower';

export type SceneMode = 'login' | 'register' | 'home';
export type SceneEvent = 'idle' | 'submitting' | 'error' | 'success' | 'signout';

interface SceneState {
  mode: SceneMode;
  /** Registration completeness, 0–1: drives how many floors are "built". */
  progress: number;
  /** zxcvbn score of the password being typed, if any. */
  strength: number | null;
  /** The resident's window: typed unit while registering, own unit once signed in. */
  unit: UnitRef | null;
  /** Window under the pointer (registration only). */
  hovered: UnitRef | null;
  event: SceneEvent;
  /** performance.now() when `event` last changed, for time-based choreography. */
  eventAt: number;
  paused: boolean;
  reducedMotion: boolean;
  /** First WebGL frame rendered; the static poster fades out. */
  ready: boolean;
  /** Set by the registration form so clicking a window can fill the Unit field. */
  pickUnit: ((unit: UnitRef) => void) | null;

  setMode: (mode: SceneMode) => void;
  setRegistration: (state: {
    progress: number;
    strength: number | null;
    unit: UnitRef | null;
  }) => void;
  setUnit: (unit: UnitRef | null) => void;
  setHovered: (unit: UnitRef | null) => void;
  emit: (event: SceneEvent, unit?: UnitRef | null) => void;
  setPaused: (paused: boolean) => void;
  setReducedMotion: (reduced: boolean) => void;
  setReady: () => void;
  setPickUnit: (handler: ((unit: UnitRef) => void) | null) => void;
}

/**
 * Bridge between React UI and the WebGL scene. UI writes through actions; the render loop
 * reads with getState() every frame, so form changes never re-render the canvas tree.
 */
export const useSceneStore = create<SceneState>()((set, get) => ({
  mode: 'login',
  progress: 0,
  strength: null,
  unit: null,
  hovered: null,
  event: 'idle',
  eventAt: 0,
  paused: false,
  reducedMotion: false,
  ready: false,
  pickUnit: null,

  setMode: (mode) => {
    const state = get();
    if (state.mode === mode) return;
    // A successful sign-in keeps its light cascade (and unit) playing into the Home view.
    const keepSuccess = mode === 'home' && state.event === 'success';
    set({
      mode,
      progress: 0,
      strength: null,
      hovered: null,
      unit: mode === 'home' ? state.unit : null,
      ...(keepSuccess ? {} : { event: 'idle', eventAt: performance.now() }),
    });
  },

  setRegistration: ({ progress, strength, unit }) => {
    const state = get();
    if (
      state.progress === progress &&
      state.strength === strength &&
      (state.unit === unit || isSameUnit(state.unit, unit))
    ) {
      return;
    }
    set({ progress, strength, unit });
  },

  setUnit: (unit) => {
    const current = get().unit;
    if (current === unit || isSameUnit(current, unit)) return;
    set({ unit });
  },

  setHovered: (hovered) => {
    const current = get().hovered;
    if (current === hovered || isSameUnit(current, hovered)) return;
    set({ hovered });
  },

  emit: (event, unit) =>
    set({ event, eventAt: performance.now(), ...(unit !== undefined ? { unit } : {}) }),

  setPaused: (paused) => set({ paused }),
  setReducedMotion: (reducedMotion) => set({ reducedMotion }),
  setReady: () => set({ ready: true }),
  setPickUnit: (pickUnit) => set({ pickUnit }),
}));

export const sceneActions = () => useSceneStore.getState();

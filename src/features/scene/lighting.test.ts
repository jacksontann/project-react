import {
  litRatio,
  SIGNOUT_SWEEP_S,
  WAVE_S_PER_STEP,
  windowTarget,
  type LightingContext,
} from './lighting';
import { FLOORS } from './tower';

const base: LightingContext = { ratio: 0.5, event: 'idle', eventAge: 0, time: 0, selected: null };

describe('tower lighting rules', () => {
  it('lights more windows as the password gets stronger', () => {
    const ratios = [0, 1, 2, 3, 4].map((score) => litRatio('register', score));
    for (let i = 1; i < ratios.length; i += 1) {
      expect(ratios[i]!).toBeGreaterThan(ratios[i - 1]!);
    }
  });

  it('switches windows on below the lit ratio and off above it', () => {
    expect(windowTarget({ floor: 3, column: 1, rank: 0.2 }, false, base)).toBe(1);
    expect(windowTarget({ floor: 3, column: 1, rank: 0.8 }, false, base)).toBe(0);
  });

  it("keeps the resident's own window brighter than any other", () => {
    const selected = windowTarget({ floor: 12, column: 2, rank: 0.99 }, true, base);
    expect(selected).toBeGreaterThan(1.5);
  });

  it('sign-out switches floors off from the top down', () => {
    const context = { ...base, event: 'signout' as const, eventAge: SIGNOUT_SWEEP_S / 2 };
    const top = windowTarget({ floor: FLOORS, column: 0, rank: 0 }, false, context);
    const bottom = windowTarget({ floor: 1, column: 0, rank: 0 }, false, context);
    expect(top).toBe(0);
    expect(bottom).toBe(1);
    expect(windowTarget({ floor: 1, column: 0, rank: 0 }, true, { ...context, eventAge: 2 })).toBe(
      0,
    );
  });

  it("success sends a wave of light outward from the resident's window", () => {
    const context: LightingContext = {
      ...base,
      ratio: 0,
      event: 'success',
      selected: { floor: 10, column: 3 },
      eventAge: 3 * WAVE_S_PER_STEP + 0.01,
    };
    const near = windowTarget({ floor: 10, column: 0, rank: 1 }, false, context); // 3 steps away
    const far = windowTarget({ floor: 24, column: 7, rank: 1 }, false, context); // not reached yet
    expect(near).toBeGreaterThan(1);
    expect(far).toBe(0);
  });
});

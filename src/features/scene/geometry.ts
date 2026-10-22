import { FLOORS, UNITS_PER_FACADE, UNITS_PER_FLOOR, type UnitRef } from './tower';

/** World-space dimensions of the hero tower (1 unit ≈ 3.5 m). */
export const FLOOR_H = 0.42;
export const BAY = 0.72;
export const TOWER_W = BAY * UNITS_PER_FACADE;
export const TOWER_D = TOWER_W;
export const PODIUM_H = 0.9;
export const BODY_H = FLOOR_H * FLOORS;
export const BODY_TOP = PODIUM_H + BODY_H;
export const CROWN_H = 0.75;
export const MAST_H = 1.4;
export const TOWER_TOP = BODY_TOP + CROWN_H + MAST_H;

export const WINDOW_W = BAY * 0.64;
export const WINDOW_H = FLOOR_H * 0.58;
export const WINDOW_COUNT = FLOORS * UNITS_PER_FLOOR;

const FACADE_GAP = 0.006;

export interface WindowPlacement {
  x: number;
  y: number;
  z: number;
  rotationY: number;
  /** Outward facade normal (x/z). */
  normalX: number;
  normalZ: number;
  /** 0–7, continuous around the corner. */
  column: number;
}

/** Units 01–04 sit left→right on the front (+z) facade; 05–08 front→back on the side (+x). */
export function windowPlacement({ floor, unit }: UnitRef): WindowPlacement {
  const y = PODIUM_H + FLOOR_H * (floor - 0.5) + 0.02;
  if (unit <= UNITS_PER_FACADE) {
    return {
      x: -TOWER_W / 2 + BAY * (unit - 0.5),
      y,
      z: TOWER_D / 2 + FACADE_GAP,
      rotationY: 0,
      normalX: 0,
      normalZ: 1,
      column: unit - 1,
    };
  }
  const k = unit - UNITS_PER_FACADE;
  return {
    x: TOWER_W / 2 + FACADE_GAP,
    y,
    z: TOWER_D / 2 - BAY * (k - 0.5),
    rotationY: Math.PI / 2,
    normalX: 1,
    normalZ: 0,
    column: unit - 1,
  };
}

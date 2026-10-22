/**
 * Shared description of the Lumen Residences tower. The static poster, the 3D scene and the
 * unit-number validation all read from here, so "floor 12, unit 03" means the same window everywhere.
 */
export const FLOORS = 24;
export const UNITS_PER_FLOOR = 8;
/** Units 01–04 face the front facade; 05–08 the side facade. */
export const UNITS_PER_FACADE = 4;

export interface UnitRef {
  floor: number;
  unit: number;
}

export function unitIndex({ floor, unit }: UnitRef) {
  return (floor - 1) * UNITS_PER_FLOOR + (unit - 1);
}

export function unitFromIndex(index: number): UnitRef {
  return {
    floor: Math.floor(index / UNITS_PER_FLOOR) + 1,
    unit: (index % UNITS_PER_FLOOR) + 1,
  };
}

export function isSameUnit(a: UnitRef | null, b: UnitRef | null) {
  return !!a && !!b && a.floor === b.floor && a.unit === b.unit;
}

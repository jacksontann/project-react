import { FLOORS, UNITS_PER_FLOOR, type UnitRef } from 'features/scene/tower';

const UNIT_PATTERN = /^(\d{1,2})-(\d{1,2})$/;

const pad = (value: number) => String(value).padStart(2, '0');

/** "12-03" → { floor: 12, unit: 3 }; null when malformed or outside the tower. */
export function parseUnit(value: string): UnitRef | null {
  const match = UNIT_PATTERN.exec(value.trim());
  if (!match) return null;
  const floor = Number(match[1]);
  const unit = Number(match[2]);
  if (floor < 1 || floor > FLOORS || unit < 1 || unit > UNITS_PER_FLOOR) return null;
  return { floor, unit };
}

export function isValidUnit(value: string) {
  return parseUnit(value) !== null;
}

export function formatUnit({ floor, unit }: UnitRef) {
  return `${pad(floor)}-${pad(unit)}`;
}

export function normalizeUnit(value: string) {
  const parsed = parseUnit(value);
  return parsed ? formatUnit(parsed) : value;
}

/** Input mask: keeps digits only and inserts the dash, so "1203" reads "12-03" as you type. */
export function maskUnitInput(raw: string) {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}-${digits.slice(2)}` : digits;
}

export function describeUnit({ floor, unit }: UnitRef) {
  return `FLR ${pad(floor)} · UNIT ${pad(unit)}`;
}

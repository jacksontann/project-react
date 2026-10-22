import {
  describeUnit,
  formatUnit,
  isValidUnit,
  maskUnitInput,
  normalizeUnit,
  parseUnit,
} from './unit';

describe('unit numbers', () => {
  it('parses floor-unit pairs inside the tower', () => {
    expect(parseUnit('12-03')).toEqual({ floor: 12, unit: 3 });
    expect(parseUnit(' 5-2 ')).toEqual({ floor: 5, unit: 2 });
    expect(parseUnit('24-08')).toEqual({ floor: 24, unit: 8 });
  });

  it('rejects malformed values and windows that do not exist', () => {
    for (const value of ['', '12', '1203', '12-3a', '00-01', '25-01', '12-09', '12-00']) {
      expect(parseUnit(value)).toBeNull();
      expect(isValidUnit(value)).toBe(false);
    }
  });

  it('formats and normalises to two-digit FF-UU', () => {
    expect(formatUnit({ floor: 7, unit: 2 })).toBe('07-02');
    expect(normalizeUnit('7-2')).toBe('07-02');
    expect(normalizeUnit('nonsense')).toBe('nonsense');
  });

  it('masks keystrokes into FF-UU', () => {
    expect(maskUnitInput('1')).toBe('1');
    expect(maskUnitInput('12')).toBe('12');
    expect(maskUnitInput('120')).toBe('12-0');
    expect(maskUnitInput('1203')).toBe('12-03');
    expect(maskUnitInput('12-03')).toBe('12-03');
    expect(maskUnitInput('12a0345')).toBe('12-03');
  });

  it('describes a unit for the architectural callouts', () => {
    expect(describeUnit({ floor: 3, unit: 7 })).toBe('FLR 03 · UNIT 07');
  });
});

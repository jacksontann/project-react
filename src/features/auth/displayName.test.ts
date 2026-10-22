import { displayName } from './displayName';

describe('displayName', () => {
  it.each([
    ['Nur Aisyah binti Ahmad', 'Nur Aisyah'],
    ['Muhammad Hafiz bin Ismail', 'Muhammad Hafiz'],
    ['Arjun a/l Raman', 'Arjun'],
    ['Kavitha A/P Subramaniam', 'Kavitha'],
    ['Lim Wei Jie', 'Lim Wei Jie'],
    ['Aisyah', 'Aisyah'],
  ])('greets %s as %s', (fullName, expected) => {
    expect(displayName(fullName)).toBe(expected);
  });
});

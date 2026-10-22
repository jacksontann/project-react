import { registrationProgress, type RegistrationSnapshot } from './registrationProgress';

const empty: RegistrationSnapshot = {
  name: '',
  email: '',
  unit: '',
  password: '',
  confirmPassword: '',
  terms: false,
  strengthScore: null,
  breached: false,
};

const complete: RegistrationSnapshot = {
  name: 'Lim Wei Jie',
  email: 'weijie@example.com',
  unit: '18-03',
  password: 'lantern orchid tramline',
  confirmPassword: 'lantern orchid tramline',
  terms: true,
  strengthScore: 4,
  breached: false,
};

describe('registrationProgress', () => {
  it('is 0 for an empty form and 1 for a complete one', () => {
    expect(registrationProgress(empty)).toBe(0);
    expect(registrationProgress(complete)).toBe(1);
  });

  it('counts each satisfied requirement', () => {
    expect(registrationProgress({ ...empty, name: 'Lim Wei Jie', unit: '18-03' })).toBeCloseTo(
      2 / 6,
    );
  });

  it('does not count a weak or breached password as built', () => {
    expect(registrationProgress({ ...complete, strengthScore: 1 })).toBeCloseTo(5 / 6);
    expect(registrationProgress({ ...complete, breached: true })).toBeCloseTo(5 / 6);
  });
});

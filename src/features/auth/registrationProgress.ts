import { MIN_STRENGTH_SCORE } from './passwordPolicy';
import { emailSchema, nameSchema, PASSWORD_MIN_LENGTH } from './schemas';
import { isValidUnit } from './unit';

export interface RegistrationSnapshot {
  name: string;
  email: string;
  unit: string;
  password: string;
  confirmPassword: string;
  terms: boolean;
  strengthScore: number | null;
  breached: boolean;
}

/**
 * Share of registration requirements currently met (0–1). The 3D scene uses it to decide how
 * many floors of the tower are "built" while the resident fills in the form.
 */
export function registrationProgress(values: RegistrationSnapshot) {
  const checks = [
    nameSchema.safeParse(values.name).success,
    emailSchema.safeParse(values.email).success,
    isValidUnit(values.unit),
    values.password.length >= PASSWORD_MIN_LENGTH &&
      (values.strengthScore ?? 0) >= MIN_STRENGTH_SCORE &&
      !values.breached,
    values.confirmPassword.length > 0 && values.confirmPassword === values.password,
    values.terms,
  ];
  return checks.filter(Boolean).length / checks.length;
}

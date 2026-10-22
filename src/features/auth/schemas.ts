import { z } from 'zod';
import { FLOORS, UNITS_PER_FLOOR } from 'features/scene/tower';
import { isValidUnit, normalizeUnit } from './unit';

/*
 * Single source of truth for auth data. The forms validate with these schemas and so does the
 * mock server, so the client and "server" can never disagree on what valid input is.
 */

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

export const emailSchema = z
  .string()
  .trim()
  .min(1, 'Enter your email address.')
  .max(254, 'That email address is too long.')
  .email('Enter a valid email address, like you@example.com.')
  .transform((value) => value.toLowerCase());

/** Deliberately permissive: names can contain spaces, apostrophes, hyphens, "a/l", "binti"… */
export const nameSchema = z
  .string()
  .trim()
  .min(2, 'Enter your full name.')
  .max(60, 'Keep your name to 60 characters or fewer.');

export const unitSchema = z
  .string()
  .trim()
  .min(1, 'Enter your unit number.')
  .refine(
    isValidUnit,
    `Use floor-unit, e.g. 12-03 (floors 01–${FLOORS}, units 01–${String(UNITS_PER_FLOOR).padStart(2, '0')}).`,
  )
  .transform(normalizeUnit);

/** NIST SP 800-63B: length limits only, no composition rules. Strength + breach checks run separately. */
export const newPasswordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Use at least ${PASSWORD_MIN_LENGTH} characters.`)
  .max(PASSWORD_MAX_LENGTH, `Use ${PASSWORD_MAX_LENGTH} characters or fewer.`);

export const loginRequestSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Enter your password.').max(PASSWORD_MAX_LENGTH),
  remember: z.boolean(),
});

export const registerRequestSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  unit: unitSchema,
  password: newPasswordSchema,
});

export const loginFormSchema = loginRequestSchema;

export const registerFormSchema = registerRequestSchema
  .extend({
    confirmPassword: z.string().min(1, 'Re-enter your password.'),
    terms: z.boolean().refine(Boolean, 'Please accept the house rules to continue.'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: "Passwords don't match.", // see formResolvers.ts for the eager check
  });

export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  unit: z.string(),
  createdAt: z.string(),
});

export const sessionResponseSchema = z.object({ user: userSchema, token: z.string() });
export const meResponseSchema = z.object({ user: userSchema });

export type User = z.infer<typeof userSchema>;
export type SessionResponse = z.infer<typeof sessionResponseSchema>;
export type LoginRequest = z.output<typeof loginRequestSchema>;
export type RegisterRequest = z.output<typeof registerRequestSchema>;
export type LoginFormInput = z.input<typeof loginFormSchema>;
export type LoginFormOutput = z.output<typeof loginFormSchema>;
export type RegisterFormInput = z.input<typeof registerFormSchema>;
export type RegisterFormOutput = z.output<typeof registerFormSchema>;

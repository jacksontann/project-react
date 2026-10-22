import { zodResolver } from '@hookform/resolvers/zod';
import type { Resolver } from 'react-hook-form';
import { registerFormSchema, type RegisterFormInput, type RegisterFormOutput } from './schemas';

export const PASSWORD_MISMATCH = "Passwords don't match.";

const baseResolver = zodResolver(registerFormSchema);

/**
 * Zod only runs object-level refinements once every field is valid, so on its own the schema
 * wouldn't report "passwords don't match" until name, email and unit were filled in. This
 * checks the match as soon as both password fields have a value.
 */
export const registerFormResolver: Resolver<
  RegisterFormInput,
  unknown,
  RegisterFormOutput
> = async (values, context, options) => {
  const result = await baseResolver(values, context, options);
  const mismatch = values.confirmPassword.length > 0 && values.password !== values.confirmPassword;
  if (!mismatch || result.errors.confirmPassword) return result;
  return {
    values: {},
    errors: {
      ...result.errors,
      confirmPassword: { type: 'mismatch', message: PASSWORD_MISMATCH },
    },
  };
};

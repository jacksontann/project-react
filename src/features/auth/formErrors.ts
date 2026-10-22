import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';

/**
 * Maps server-side field errors onto the form, focusing the first affected field.
 * Returns true when at least one field error was applied.
 */
export function applyServerFieldErrors<T extends FieldValues>(
  fieldErrors: Record<string, string>,
  fields: readonly Path<T>[],
  setError: UseFormSetError<T>,
) {
  let applied = false;
  for (const field of fields) {
    const message = fieldErrors[field];
    if (!message) continue;
    setError(field, { type: 'server', message }, { shouldFocus: !applied });
    applied = true;
  }
  return applied;
}

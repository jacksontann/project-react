import { useId, type ComponentProps, type ReactNode } from 'react';
import { cn } from 'lib/cn';
import { FieldMessage } from './FieldMessage';

export interface TextFieldProps extends Omit<ComponentProps<'input'>, 'size'> {
  label: string;
  /** Right-aligned text next to the label (e.g. "Optional", a link). */
  labelAside?: ReactNode;
  hint?: ReactNode;
  error?: string;
  /** Element rendered inside the input frame, after the input (e.g. a visibility toggle). */
  trailing?: ReactNode;
  /** Live, politely-announced status line (e.g. Caps Lock warning). */
  status?: ReactNode;
}

export function TextField({
  label,
  labelAside,
  hint,
  error,
  trailing,
  status,
  id,
  className,
  'aria-describedby': extraDescribedBy,
  ...inputProps
}: TextFieldProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;
  const statusId = `${inputId}-status`;
  const describedBy = [
    error ? errorId : hint ? hintId : null,
    status ? statusId : null,
    extraDescribedBy,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={cn('group/field', className)}>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <label
          htmlFor={inputId}
          className={cn(
            'font-mono text-eyebrow uppercase text-ink-faint transition-colors duration-200',
            'group-focus-within/field:text-lamp',
            error && 'text-danger/90',
          )}
        >
          {label}
        </label>
        {labelAside}
      </div>

      <div
        className={cn(
          'relative flex items-center rounded-field bg-night-deep/70 ring-1 ring-inset ring-line-strong',
          'transition-[box-shadow,background-color] duration-200 ease-out-expo',
          'focus-within:bg-night-deep focus-within:shadow-lamp focus-within:ring-lamp/70 hover:bg-night-deep',
          error && 'ring-danger/60 focus-within:shadow-[0_0_0_1px_rgb(var(--danger)/0.6)]',
        )}
      >
        <input
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
          data-cursor="text"
          className="h-12 w-full min-w-0 rounded-field bg-transparent px-4 text-[15px] text-ink caret-lamp placeholder:text-ink-faint/60 focus:outline-none"
          {...inputProps}
        />
        {trailing ? <div className="flex shrink-0 items-center pr-1.5">{trailing}</div> : null}
      </div>

      <p id={statusId} aria-live="polite" className="empty:hidden">
        {status ? (
          <span className="mt-2 flex items-center gap-1.5 text-[13px] text-lamp-soft">
            {status}
          </span>
        ) : null}
      </p>

      <FieldMessage errorId={errorId} hintId={hintId} error={error} hint={hint} />
    </div>
  );
}

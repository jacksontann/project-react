import { useId, type ComponentProps, type ReactNode } from 'react';
import { Check } from 'lucide-react';
import { cn } from 'lib/cn';
import { FieldMessage } from './FieldMessage';

interface CheckboxProps extends Omit<ComponentProps<'input'>, 'type'> {
  label: ReactNode;
  error?: string;
}

export function Checkbox({ label, error, id, className, ...props }: CheckboxProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const errorId = `${inputId}-error`;

  return (
    <div className={className}>
      <div className="flex items-start gap-3">
        <span className="relative mt-0.5 grid size-5 shrink-0 place-items-center">
          <input
            id={inputId}
            type="checkbox"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            className={cn(
              'peer size-5 appearance-none rounded-[6px] bg-night-deep ring-1 ring-inset ring-line-strong',
              'transition-[background-color,box-shadow] duration-200 checked:bg-lamp checked:ring-lamp',
              'hover:ring-ink-faint',
              error && 'ring-danger/70',
            )}
            {...props}
          />
          <Check
            aria-hidden="true"
            strokeWidth={3.25}
            className="pointer-events-none absolute size-3.5 scale-50 text-lamp-ink opacity-0 transition duration-200 ease-out-expo peer-checked:scale-100 peer-checked:opacity-100"
          />
        </span>
        <label htmlFor={inputId} className="select-none text-[14px] leading-6 text-ink-muted">
          {label}
        </label>
      </div>
      <FieldMessage errorId={errorId} hintId={`${inputId}-hint`} error={error} />
    </div>
  );
}

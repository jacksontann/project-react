import { useRef, type ComponentProps, type MouseEvent } from 'react';
import { Check } from 'lucide-react';
import { useMagnetic } from 'hooks/useMagnetic';
import { cn } from 'lib/cn';
import { Spinner } from './Spinner';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonState = 'idle' | 'loading' | 'success';

interface ButtonProps extends Omit<ComponentProps<'button'>, 'ref'> {
  variant?: ButtonVariant;
  /** Visual state machine: idle → loading (spinner + progress hairline) → success (✓). */
  state?: ButtonState;
  loadingText?: string;
  /** Primary calls to action lean towards the pointer and get the large cursor halo. */
  magnetic?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-lamp text-lamp-ink shadow-[0_12px_32px_-12px_rgb(var(--lamp)/0.7)] hover:bg-lamp-soft disabled:bg-lamp/40 disabled:text-lamp-ink/70 disabled:shadow-none',
  secondary:
    'bg-white/[0.04] text-ink ring-1 ring-inset ring-line-strong hover:bg-white/[0.08] disabled:text-ink-faint',
  ghost: 'text-ink-muted hover:text-ink disabled:text-ink-faint',
};

export function Button({
  variant = 'primary',
  state = 'idle',
  loadingText,
  className,
  children,
  onClick,
  type = 'button',
  magnetic = false,
  ...props
}: ButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const busy = state !== 'idle';
  useMagnetic(ref, { enabled: magnetic });

  // While busy the button stays focusable (no `disabled`), so keyboard focus isn't lost mid-submit.
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (busy) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  };

  return (
    <button
      ref={ref}
      type={type}
      aria-disabled={busy || undefined}
      aria-busy={state === 'loading' || undefined}
      data-cursor={magnetic ? 'magnetic' : undefined}
      onClick={handleClick}
      className={cn(
        'relative inline-flex h-12 select-none items-center justify-center gap-2 overflow-hidden rounded-field px-5 text-[15px] font-medium',
        'transition-[background-color,color,box-shadow,transform,translate] duration-200 ease-out-expo',
        'enabled:active:scale-[0.985] disabled:cursor-not-allowed',
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {state === 'loading' ? (
        <>
          <Spinner />
          <span>{loadingText ?? children}</span>
          <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-0.5 overflow-hidden">
            <span className="block h-full w-1/3 animate-progress bg-current opacity-40 motion-reduce:animate-none" />
          </span>
        </>
      ) : state === 'success' ? (
        <>
          <Check className="size-[18px]" strokeWidth={2.5} aria-hidden="true" />
          <span className="sr-only">Done</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}

import type { ReactNode } from 'react';
import { cn } from 'lib/cn';

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        'flex items-center gap-2 font-mono text-eyebrow uppercase text-ink-faint',
        className,
      )}
    >
      <span aria-hidden="true" className="size-1.5 rounded-[2px] bg-lamp shadow-lamp" />
      {children}
    </p>
  );
}

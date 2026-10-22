import type { ReactNode } from 'react';
import { cn } from 'lib/cn';

/** The floating glass panel. On phones it becomes a bottom sheet below the tower. */
export function AuthPanel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={cn(
        'pointer-events-auto relative w-full flex-1 overflow-hidden rounded-t-panel bg-glass/80 shadow-panel ring-1 ring-line backdrop-blur-2xl',
        'sm:my-28 sm:w-[440px] sm:flex-none sm:rounded-panel',
        className,
      )}
    >
      {/* Faint warm spill in the top-right corner, echoing the lit pane in the logo. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-28 -top-28 size-72 rounded-full bg-lamp/[0.09] blur-3xl"
      />
      <div className="relative px-6 pb-10 pt-8 sm:px-10 sm:py-10">{children}</div>
    </section>
  );
}

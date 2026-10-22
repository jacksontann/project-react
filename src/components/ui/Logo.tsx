import { cn } from 'lib/cn';

interface LogoMarkProps {
  className?: string;
}

/** Four-pane window with the top-right pane lit. Same geometry as public/favicon.svg. */
export function LogoMark({ className }: LogoMarkProps) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className={cn('size-5 shrink-0', className)}>
      <rect x="1" y="1" width="8" height="8" rx="1.5" className="fill-ink/15" />
      <rect
        x="11"
        y="1"
        width="8"
        height="8"
        rx="1.5"
        className="fill-lamp drop-shadow-[0_0_6px_rgb(var(--lamp)/0.75)]"
      />
      <rect x="1" y="11" width="8" height="8" rx="1.5" className="fill-ink/15" />
      <rect x="11" y="11" width="8" height="8" rx="1.5" className="fill-ink/15" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark />
      <span className="font-display text-[22px] leading-none tracking-tight text-ink">Lumen</span>
    </span>
  );
}

import type { ReactNode } from 'react';
import { Logo } from 'components/ui/Logo';
import { useKualaLumpurClock } from 'hooks/useKualaLumpurClock';

interface ChromeProps {
  /** Rendered in the logo slot (lets the router wrap the logo in a <Link>). */
  brand?: ReactNode;
  /** Extra controls shown beside the clock (e.g. pause motion). */
  controls?: ReactNode;
}

/** Architectural annotations framing the scene: brand, local time, site coordinates. */
export function Chrome({ brand, controls }: ChromeProps) {
  const time = useKualaLumpurClock();

  return (
    <>
      <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between px-5 py-5 sm:px-8 sm:py-7">
        <div className="pointer-events-auto">{brand ?? <Logo />}</div>
        <div className="flex items-center gap-2 sm:gap-4">
          {controls ? <div className="pointer-events-auto">{controls}</div> : null}
          <p className="font-mono text-eyebrow uppercase text-ink-muted">
            <span className="hidden sm:inline">Kuala Lumpur · </span>
            <span className="tabular-nums text-ink">{time}</span> MYT
          </p>
        </div>
      </header>

      <footer className="pointer-events-none absolute bottom-0 left-0 z-20 hidden px-8 py-7 font-mono text-eyebrow uppercase text-ink-faint lg:block">
        <p>Lumen Residences · Jalan Ampang</p>
        <p className="tabular-nums">3.1579° N · 101.7123° E</p>
      </footer>
    </>
  );
}

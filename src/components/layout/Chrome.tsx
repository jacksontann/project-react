import type { ReactNode } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { Logo } from 'components/ui/Logo';
import { useKualaLumpurClock } from 'hooks/useKualaLumpurClock';

const PORTFOLIO_URL = 'https://jacksontan-portfolio.vercel.app/';

interface ChromeProps {
  /** Rendered in the logo slot (lets the router wrap the logo in a <Link>). */
  brand?: ReactNode;
  /** Extra controls shown beside the clock (e.g. pause motion). */
  controls?: ReactNode;
}

function Credit() {
  return (
    <>
      Created by{' '}
      <a
        href={PORTFOLIO_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="pointer-events-auto inline-flex items-center gap-0.5 rounded-sm transition-colors hover:text-ink-muted"
      >
        Jackson Tan
        <ArrowUpRight className="size-3" aria-hidden="true" />
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    </>
  );
}

/** Annotations framing the scene: brand, local time, site name and credit. */
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
        <p>Lumen Residences · Kuala Lumpur</p>
        <p>
          <Credit />
        </p>
      </footer>

      {/* Phones and tablets: the credit alone, centred at the very bottom of the page. */}
      <p className="pointer-events-none absolute inset-x-0 bottom-0 z-20 pb-[max(1rem,env(safe-area-inset-bottom))] text-center font-mono text-eyebrow uppercase text-ink-faint lg:hidden">
        <Credit />
      </p>
    </>
  );
}

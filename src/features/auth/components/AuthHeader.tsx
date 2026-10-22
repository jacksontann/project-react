import type { ReactNode } from 'react';
import { Eyebrow } from 'components/ui/Eyebrow';

interface AuthHeaderProps {
  eyebrow: ReactNode;
  /** Headline is "<lead> <accent>", with the accent word set in italic lamp-amber. */
  lead: string;
  accent: string;
  description: ReactNode;
}

export function AuthHeader({ eyebrow, lead, accent, description }: AuthHeaderProps) {
  return (
    <header>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h1
        tabIndex={-1}
        className="mt-4 font-display text-[44px] leading-[0.95] tracking-[-0.01em] text-ink outline-none sm:text-[52px]"
      >
        {lead} <em className="text-lamp">{accent}</em>
      </h1>
      <p className="mt-3 text-ink-muted">{description}</p>
    </header>
  );
}

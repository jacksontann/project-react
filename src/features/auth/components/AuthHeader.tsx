import type { ReactNode } from 'react';
import { Eyebrow } from 'components/ui/Eyebrow';
import { Headline } from 'components/ui/Headline';

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
      <Headline lead={lead} accent={accent} />
      <p className="mt-3 text-ink-muted">{description}</p>
    </header>
  );
}

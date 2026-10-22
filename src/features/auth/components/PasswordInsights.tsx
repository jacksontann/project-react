import { CircleAlert, ShieldCheck, ShieldQuestion } from 'lucide-react';
import { Spinner } from 'components/ui/Spinner';
import { cn } from 'lib/cn';
import type { BreachStatus } from '../hooks/useBreachCheck';
import { STRENGTH_LABELS, type StrengthResult } from '../passwordPolicy';

interface PasswordInsightsProps {
  id: string;
  strength: StrengthResult | null;
  breach: BreachStatus;
}

/** Strength meter drawn as four windows that light up, plus the live breach-check result. */
export function PasswordInsights({ id, strength, breach }: PasswordInsightsProps) {
  const score = strength?.score ?? null;
  const lit = score === null ? 0 : Math.max(1, score);
  const tone = score === null ? 'idle' : score <= 1 ? 'weak' : score === 2 ? 'fair' : 'strong';
  const advice =
    strength && strength.score < 3 ? (strength.warning ?? strength.suggestions[0]) : null;

  return (
    <div id={id} className="mt-3 space-y-2">
      <div className="flex items-center gap-3">
        <div className="flex gap-1" aria-hidden="true">
          {[0, 1, 2, 3].map((index) => (
            <span
              key={index}
              style={{ transitionDelay: `${index * 45}ms` }}
              className={cn(
                'h-3 w-[18px] rounded-[3px] ring-1 ring-inset transition-[background-color,box-shadow] duration-300',
                index >= lit && 'bg-white/[0.05] ring-line',
                index < lit && tone === 'weak' && 'bg-danger/80 ring-danger/0',
                index < lit && tone === 'fair' && 'bg-lamp-soft/70 ring-lamp-soft/0',
                index < lit &&
                  tone === 'strong' &&
                  'bg-lamp shadow-[0_0_10px_rgb(var(--lamp)/0.6)] ring-lamp/0',
              )}
            />
          ))}
        </div>
        <p className="font-mono text-eyebrow uppercase text-ink-muted" aria-live="polite">
          <span className="sr-only">Password strength: </span>
          {score === null ? 'Measuring…' : STRENGTH_LABELS[score]}
        </p>
      </div>

      {advice ? <p className="text-[13px] leading-5 text-ink-faint">{advice}</p> : null}

      <BreachLine status={breach} />
    </div>
  );
}

function BreachLine({ status }: { status: BreachStatus }) {
  if (status.state === 'idle') return null;

  const content = {
    checking: {
      icon: <Spinner className="size-3.5" />,
      text: 'Checking known data breaches…',
      className: 'text-ink-faint',
    },
    clear: {
      icon: <ShieldCheck className="size-3.5" aria-hidden="true" />,
      text: 'Not found in known data breaches',
      className: 'text-ok/90',
    },
    breached: {
      icon: <CircleAlert className="size-3.5" aria-hidden="true" />,
      text:
        status.state === 'breached'
          ? `Found in ${status.count.toLocaleString('en-MY')} known data breaches`
          : '',
      className: 'text-danger',
    },
    unavailable: {
      icon: <ShieldQuestion className="size-3.5" aria-hidden="true" />,
      text: "Couldn't reach the breach database — you can still continue",
      className: 'text-ink-faint',
    },
  }[status.state];

  return (
    <p
      className={cn('flex items-center gap-1.5 text-[13px] leading-5', content.className)}
      aria-live="polite"
    >
      {content.icon}
      {content.text}
    </p>
  );
}

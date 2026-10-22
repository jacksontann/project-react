import { AnimatePresence, m } from 'framer-motion';
import { CircleAlert } from 'lucide-react';
import type { ReactNode } from 'react';
import { easeOutExpo } from 'lib/motion';

interface FieldMessageProps {
  errorId: string;
  hintId: string;
  error?: string;
  hint?: ReactNode;
}

/** Error replaces the hint in place; both stay wired to the input via aria-describedby. */
export function FieldMessage({ errorId, hintId, error, hint }: FieldMessageProps) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      {error ? (
        <m.p
          key="error"
          id={errorId}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.22, ease: easeOutExpo }}
          className="mt-2 flex items-start gap-1.5 text-[13px] leading-5 text-danger"
        >
          <CircleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </m.p>
      ) : hint ? (
        <m.div
          key="hint"
          id={hintId}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="mt-2 text-[13px] leading-5 text-ink-faint"
        >
          {hint}
        </m.div>
      ) : null}
    </AnimatePresence>
  );
}

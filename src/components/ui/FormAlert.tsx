import { AnimatePresence, m } from 'framer-motion';
import { CircleAlert } from 'lucide-react';
import type { ReactNode } from 'react';
import { easeOutExpo } from 'lib/motion';

interface FormAlertProps {
  /** `null` hides the alert. The live region itself is always mounted so it announces reliably. */
  message: ReactNode | null;
}

export function FormAlert({ message }: FormAlertProps) {
  return (
    <div role="alert" aria-live="assertive">
      <AnimatePresence initial={false}>
        {message ? (
          <m.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.28, ease: easeOutExpo }}
            className="overflow-hidden"
          >
            <div className="mb-6 flex items-start gap-2.5 rounded-field bg-danger/[0.08] px-4 py-3 text-[14px] leading-5 text-ink ring-1 ring-inset ring-danger/30">
              <CircleAlert className="mt-px size-4 shrink-0 text-danger" aria-hidden="true" />
              <div>{message}</div>
            </div>
          </m.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

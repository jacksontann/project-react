import { useEffect, useState } from 'react';
import { pwnedCount } from 'lib/pwned';

export type BreachStatus =
  | { state: 'idle' }
  | { state: 'checking' }
  | { state: 'clear' }
  | { state: 'breached'; count: number }
  | { state: 'unavailable' };

const IDLE: BreachStatus = { state: 'idle' };

/** Live Have I Been Pwned check, debounced and cancelled as the password changes. */
export function useBreachCheck(password: string, enabled: boolean) {
  const [status, setStatus] = useState<BreachStatus>(IDLE);

  useEffect(() => {
    if (!enabled) {
      setStatus(IDLE);
      return;
    }
    const controller = new AbortController();
    setStatus({ state: 'checking' });
    const timer = window.setTimeout(() => {
      pwnedCount(password, { signal: controller.signal })
        .then((count) => setStatus(count > 0 ? { state: 'breached', count } : { state: 'clear' }))
        .catch(() => {
          if (!controller.signal.aborted) setStatus({ state: 'unavailable' });
        });
    }, 450);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [password, enabled]);

  return status;
}

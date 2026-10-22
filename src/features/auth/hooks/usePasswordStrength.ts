import { useEffect, useState } from 'react';
import { loadStrengthEngine, type StrengthResult } from '../passwordPolicy';

const SEPARATOR = '\u0000';

/** Debounced zxcvbn estimate; `null` while empty or while the engine is still loading. */
export function usePasswordStrength(password: string, userInputs: string[]) {
  const [result, setResult] = useState<StrengthResult | null>(null);
  const inputsKey = userInputs.join(SEPARATOR);

  useEffect(() => {
    if (!password) {
      setResult(null);
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(() => {
      loadStrengthEngine()
        .then((evaluate) => {
          if (!cancelled) setResult(evaluate(password, inputsKey.split(SEPARATOR)));
        })
        .catch(() => {
          if (!cancelled) setResult(null);
        });
    }, 120);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [password, inputsKey]);

  return result;
}

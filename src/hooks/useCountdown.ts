import { useEffect, useState } from 'react';

/** Whole seconds remaining until `until` (epoch ms); 0 when there is no deadline or it passed. */
export function useCountdown(until: number | null) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!until) return;
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [until]);

  return until ? Math.max(0, Math.ceil((until - now) / 1000)) : 0;
}

import { useEffect, useState } from 'react';
import { formatKualaLumpurTime, msUntilNextMinute } from 'lib/time';

/** "21:47" in Kuala Lumpur time, ticking on the minute boundary (no per-second re-renders). */
export function useKualaLumpurClock() {
  const [time, setTime] = useState(() => formatKualaLumpurTime(new Date()));

  useEffect(() => {
    let timer: number;
    const tick = () => {
      const now = new Date();
      setTime(formatKualaLumpurTime(now));
      timer = window.setTimeout(tick, msUntilNextMinute(now));
    };
    timer = window.setTimeout(tick, msUntilNextMinute(new Date()));
    return () => window.clearTimeout(timer);
  }, []);

  return time;
}

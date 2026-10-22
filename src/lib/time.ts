export const KL_TIME_ZONE = 'Asia/Kuala_Lumpur';

const clockFormat = new Intl.DateTimeFormat('en-GB', {
  timeZone: KL_TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

export function formatKualaLumpurTime(date: Date) {
  return clockFormat.format(date);
}

export function msUntilNextMinute(now: Date) {
  return 60_000 - (now.getSeconds() * 1000 + now.getMilliseconds());
}

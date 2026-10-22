import { sha1Hex } from './crypto';

const RANGE_URL = 'https://api.pwnedpasswords.com/range/';
const cache = new Map<string, Map<string, number>>();

/** Parses the "SUFFIX:COUNT" lines of a range response. Padding entries (count 0) are dropped. */
export function parseRangeResponse(body: string) {
  const counts = new Map<string, number>();
  for (const line of body.split('\n')) {
    const [suffix, count] = line.trim().split(':');
    const occurrences = Number(count);
    if (suffix && occurrences > 0) counts.set(suffix.toUpperCase(), occurrences);
  }
  return counts;
}

/**
 * How many times a password appears in known breaches, via Have I Been Pwned's k-anonymity
 * range API. Only the first 5 hex characters of the SHA-1 hash ever leave the browser; the
 * match against the ~800 returned suffixes happens locally. Responses are padded so their size
 * doesn't hint at the prefix either.
 */
export async function pwnedCount(
  password: string,
  { signal, timeoutMs = 3500 }: { signal?: AbortSignal; timeoutMs?: number } = {},
) {
  const hash = await sha1Hex(password);
  const prefix = hash.slice(0, 5);
  const suffix = hash.slice(5);

  let range = cache.get(prefix);
  if (!range) {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), timeoutMs);
    const forwardAbort = () => controller.abort();
    signal?.addEventListener('abort', forwardAbort, { once: true });
    try {
      const response = await fetch(`${RANGE_URL}${prefix}`, {
        headers: { 'Add-Padding': 'true' },
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`Pwned Passwords responded ${response.status}`);
      range = parseRangeResponse(await response.text());
      cache.set(prefix, range);
    } finally {
      window.clearTimeout(timer);
      signal?.removeEventListener('abort', forwardAbort);
    }
  }
  return range.get(suffix) ?? 0;
}

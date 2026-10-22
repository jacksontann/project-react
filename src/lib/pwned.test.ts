import { parseRangeResponse, pwnedCount } from './pwned';

// SHA-1("password") = 5BAA6 1E4C9B93F3F0682250B6CF8331B7EE68FD8
const RANGE_BODY = [
  '003D68EB55068C33ACE09247EE4C639306B:3',
  '1E4C9B93F3F0682250B6CF8331B7EE68FD8:9659365',
  '0018A45C4D1DEF81644B54AB7F969B88D65:0', // padding entry
].join('\r\n');

describe('Have I Been Pwned range API', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('parses suffix counts and ignores padding entries', () => {
    const counts = parseRangeResponse(RANGE_BODY);
    expect(counts.get('1E4C9B93F3F0682250B6CF8331B7EE68FD8')).toBe(9659365);
    expect(counts.has('0018A45C4D1DEF81644B54AB7F969B88D65')).toBe(false);
  });

  it('sends only the 5-character hash prefix and matches the suffix locally (k-anonymity)', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, text: async () => RANGE_BODY });
    window.fetch = fetchMock;

    await expect(pwnedCount('password')).resolves.toBe(9659365);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.pwnedpasswords.com/range/5BAA6');
    expect(url).not.toContain('1E4C9B93F3F0682250B6CF8331B7EE68FD8'); // suffix never leaves
    expect(init.headers).toEqual({ 'Add-Padding': 'true' });

    // Same prefix again: served from cache, no second request.
    await pwnedCount('password');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('returns 0 when the suffix is not in the range', async () => {
    window.fetch = jest.fn().mockResolvedValue({ ok: true, text: async () => '' });
    await expect(pwnedCount('a-much-rarer passphrase 9471')).resolves.toBe(0);
  });

  it('rejects when the service fails, so callers can fail open', async () => {
    window.fetch = jest.fn().mockResolvedValue({ ok: false, status: 503 });
    await expect(pwnedCount('another uncached password 1')).rejects.toThrow('503');
  });
});

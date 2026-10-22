const encoder = new TextEncoder();

/** OWASP Password Storage Cheat Sheet recommendation for PBKDF2-HMAC-SHA256. */
export const PBKDF2_ITERATIONS = 600_000;

export interface PasswordHash {
  algorithm: 'PBKDF2-SHA256';
  iterations: number;
  salt: string;
  hash: string;
}

export function toBase64Url(bytes: Uint8Array) {
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function fromBase64Url(text: string): Uint8Array<ArrayBuffer> {
  const base64 = text.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '='));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export function randomBytes(length: number) {
  return crypto.getRandomValues(new Uint8Array(length));
}

/** URL-safe random token, 256 bits by default. */
export function randomToken(byteLength = 32) {
  return toBase64Url(randomBytes(byteLength));
}

export async function hashPassword(
  password: string,
  { salt = randomBytes(16), iterations = PBKDF2_ITERATIONS } = {},
): Promise<PasswordHash> {
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, [
    'deriveBits',
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
    key,
    256,
  );
  return {
    algorithm: 'PBKDF2-SHA256',
    iterations,
    salt: toBase64Url(salt),
    hash: toBase64Url(new Uint8Array(bits)),
  };
}

export async function verifyPassword(password: string, stored: PasswordHash) {
  const candidate = await hashPassword(password, {
    salt: fromBase64Url(stored.salt),
    iterations: stored.iterations,
  });
  return timingSafeEqual(candidate.hash, stored.hash);
}

/** Compares every character so the comparison time doesn't leak where strings differ. */
export function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function sha1Hex(text: string) {
  const digest = await crypto.subtle.digest('SHA-1', encoder.encode(text));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
}

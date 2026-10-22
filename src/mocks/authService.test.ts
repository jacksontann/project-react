import { DEMO_ACCOUNT } from 'features/auth/demo';
import {
  createAuthService,
  LOCKOUT_SECONDS,
  MAX_FAILED_ATTEMPTS,
  MockApiError,
} from './authService';
import { createMockDb, type KeyValueStore } from './db';
import { seedSnapshot } from './seed';

function memoryStore(): KeyValueStore {
  const data = new Map<string, string>();
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
  };
}

function setup() {
  let now = Date.UTC(2026, 9, 22, 12);
  const db = createMockDb(memoryStore(), seedSnapshot);
  // Low iteration count keeps tests fast; production uses 600k.
  const service = createAuthService(db, { now: () => now, iterations: 1_000 });
  const advance = (seconds: number) => {
    now += seconds * 1000;
  };
  return { db, service, advance };
}

const resident = {
  name: 'Lim Wei Jie',
  email: 'WeiJie@Example.com',
  unit: '18-3',
  password: 'lantern orchid tramline',
};

async function expectApiError(
  promise: Promise<unknown> | (() => unknown),
  status: number,
  code: string,
) {
  try {
    await (typeof promise === 'function' ? promise() : promise);
  } catch (error) {
    expect(error).toBeInstanceOf(MockApiError);
    expect((error as MockApiError).status).toBe(status);
    expect((error as MockApiError).body.code).toBe(code);
    return error as MockApiError;
  }
  throw new Error(`Expected ${status} ${code}`);
}

describe('mock auth service', () => {
  it('registers a resident, normalises input and never exposes the password hash', async () => {
    const { service, db } = setup();
    const { user, token } = await service.register(resident);

    expect(user).toMatchObject({ name: 'Lim Wei Jie', email: 'weijie@example.com', unit: '18-03' });
    expect(user).not.toHaveProperty('password');
    expect(token).toMatch(/^[\w-]{43}$/);

    const stored = db.read().users.find((u) => u.email === 'weijie@example.com');
    expect(stored?.password.algorithm).toBe('PBKDF2-SHA256');
    expect(stored?.password.hash).not.toContain(resident.password);
  });

  it('rejects invalid payloads with field errors', async () => {
    const { service } = setup();
    const error = await expectApiError(
      service.register({ name: 'A', email: 'nope', unit: '30-01', password: 'short' }),
      400,
      'VALIDATION',
    );
    expect(Object.keys(error.body.fieldErrors ?? {})).toEqual([
      'name',
      'email',
      'unit',
      'password',
    ]);
  });

  it('refuses a second account with the same email (case-insensitive)', async () => {
    const { service } = setup();
    await service.register(resident);
    await expectApiError(
      service.register({ ...resident, email: 'weijie@EXAMPLE.com' }),
      409,
      'EMAIL_TAKEN',
    );
  });

  it('signs in the seeded demo resident', async () => {
    const { service } = setup();
    const { user } = await service.login({ ...DEMO_ACCOUNT, remember: false });
    expect(user.name).toBe('Aisyah binti Rahman');
  });

  it('uses one generic error for wrong passwords and unknown emails (no enumeration)', async () => {
    const { service } = setup();
    await service.register(resident);
    const wrongPassword = await expectApiError(
      service.login({ email: resident.email, password: 'wrong', remember: false }),
      401,
      'INVALID_CREDENTIALS',
    );
    const unknownEmail = await expectApiError(
      service.login({ email: 'nobody@example.com', password: 'wrong', remember: false }),
      401,
      'INVALID_CREDENTIALS',
    );
    expect(wrongPassword.body.message).toBe(unknownEmail.body.message);
  });

  it(`locks an email for ${LOCKOUT_SECONDS}s after ${MAX_FAILED_ATTEMPTS} failed attempts`, async () => {
    const { service, advance } = setup();
    await service.register(resident);
    const attempt = (password: string) =>
      service.login({ email: resident.email, password, remember: false });

    for (let i = 1; i < MAX_FAILED_ATTEMPTS; i += 1) {
      await expectApiError(attempt('wrong'), 401, 'INVALID_CREDENTIALS');
    }
    const locked = await expectApiError(attempt('wrong'), 429, 'TOO_MANY_ATTEMPTS');
    expect(locked.body.retryAfter).toBe(LOCKOUT_SECONDS);

    // Even the right password is refused while locked…
    await expectApiError(attempt(resident.password), 429, 'TOO_MANY_ATTEMPTS');
    // …and accepted once the lock expires.
    advance(LOCKOUT_SECONDS + 1);
    await expect(attempt(resident.password)).resolves.toHaveProperty('token');
  });

  it('resolves the current user from a session token and revokes it on logout', async () => {
    const { service } = setup();
    const { token } = await service.register(resident);

    expect(service.me(token).email).toBe('weijie@example.com');
    service.logout(token);
    await expectApiError(() => service.me(token), 401, 'UNAUTHENTICATED');
    await expectApiError(() => service.me(null), 401, 'UNAUTHENTICATED');
  });
});

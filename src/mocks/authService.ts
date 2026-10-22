import type { ZodError } from 'zod';
import {
  hashPassword,
  PBKDF2_ITERATIONS,
  randomToken,
  verifyPassword,
  type PasswordHash,
} from 'lib/crypto';
import type { ApiErrorBody } from 'lib/http';
import {
  loginRequestSchema,
  registerRequestSchema,
  type SessionResponse,
  type User,
} from 'features/auth/schemas';
import type { DbSnapshot, MockDb, UserRecord } from './db';

export const MAX_FAILED_ATTEMPTS = 5;
export const LOCKOUT_SECONDS = 30;

export class MockApiError extends Error {
  constructor(
    readonly status: number,
    readonly body: ApiErrorBody,
  ) {
    super(body.message);
  }
}

function validationError(error: ZodError) {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? 'form');
    fieldErrors[field] ??= issue.message;
  }
  return new MockApiError(400, {
    code: 'VALIDATION',
    message: 'Some details need another look.',
    fieldErrors,
  });
}

function toPublicUser({ password, ...user }: UserRecord): User {
  return user;
}

function withSession(snapshot: DbSnapshot, userId: string, createdAt: string) {
  const token = randomToken();
  return {
    token,
    snapshot: { ...snapshot, sessions: [...snapshot.sessions, { token, userId, createdAt }] },
  };
}

interface AuthServiceOptions {
  now?: () => number;
  /** Lower only in tests; production-like default follows OWASP guidance. */
  iterations?: number;
}

/**
 * The mock "server". Pure business logic over a MockDb, independent of MSW, so it can be unit
 * tested directly and the HTTP layer stays a thin adapter.
 */
export function createAuthService(
  db: MockDb,
  { now = Date.now, iterations = PBKDF2_ITERATIONS }: AuthServiceOptions = {},
) {
  let dummyHash: Promise<PasswordHash> | undefined;
  const timingDecoy = () => (dummyHash ??= hashPassword('lumen-timing-decoy', { iterations }));

  const tooManyAttempts = (lockedUntil: number) => {
    const retryAfter = Math.max(1, Math.ceil((lockedUntil - now()) / 1000));
    return new MockApiError(429, {
      code: 'TOO_MANY_ATTEMPTS',
      message: `Too many attempts. Try again in ${retryAfter} seconds.`,
      retryAfter,
    });
  };

  const emailTaken = () =>
    new MockApiError(409, {
      code: 'EMAIL_TAKEN',
      message: 'An account with this email already exists.',
      fieldErrors: { email: 'This email is already registered. Try signing in instead.' },
    });

  return {
    async register(body: unknown): Promise<SessionResponse> {
      const parsed = registerRequestSchema.safeParse(body);
      if (!parsed.success) throw validationError(parsed.error);
      const { name, email, unit, password } = parsed.data;

      if (db.read().users.some((user) => user.email === email)) throw emailTaken();

      const createdAt = new Date(now()).toISOString();
      const record: UserRecord = {
        id: randomToken(12),
        name,
        email,
        unit,
        createdAt,
        password: await hashPassword(password, { iterations }),
      };

      // Re-read after the (slow) hash: another tab may have registered the same email meanwhile.
      const current = db.read();
      if (current.users.some((user) => user.email === email)) throw emailTaken();

      const { token, snapshot } = withSession(
        { ...current, users: [...current.users, record] },
        record.id,
        createdAt,
      );
      db.write(snapshot);
      return { user: toPublicUser(record), token };
    },

    async login(body: unknown): Promise<SessionResponse> {
      const parsed = loginRequestSchema.safeParse(body);
      if (!parsed.success) throw validationError(parsed.error);
      const { email, password } = parsed.data;

      const lock = db.read().attempts[email]?.lockedUntil;
      if (lock && lock > now()) throw tooManyAttempts(lock);

      const user = db.read().users.find((candidate) => candidate.email === email);
      // Hash even for unknown emails so response time doesn't reveal who has an account.
      const valid = user
        ? await verifyPassword(password, user.password)
        : await verifyPassword(password, await timingDecoy()).then(() => false);

      const current = db.read();
      const attempts = { ...current.attempts };

      if (!user || !valid) {
        const failures = (attempts[email]?.failures ?? 0) + 1;
        const lockedUntil = failures >= MAX_FAILED_ATTEMPTS ? now() + LOCKOUT_SECONDS * 1000 : null;
        attempts[email] = { failures: lockedUntil ? 0 : failures, lockedUntil };
        db.write({ ...current, attempts });
        if (lockedUntil) throw tooManyAttempts(lockedUntil);
        throw new MockApiError(401, {
          code: 'INVALID_CREDENTIALS',
          message: 'Email or password is incorrect.',
        });
      }

      delete attempts[email];
      const { token, snapshot } = withSession(
        { ...current, attempts },
        user.id,
        new Date(now()).toISOString(),
      );
      db.write(snapshot);
      return { user: toPublicUser(user), token };
    },

    me(token: string | null): User {
      const snapshot = db.read();
      const session = token ? snapshot.sessions.find((item) => item.token === token) : undefined;
      const user = session && snapshot.users.find((item) => item.id === session.userId);
      if (!user) {
        throw new MockApiError(401, {
          code: 'UNAUTHENTICATED',
          message: 'Your session has ended. Please sign in again.',
        });
      }
      return toPublicUser(user);
    },

    logout(token: string | null) {
      if (!token) return;
      const snapshot = db.read();
      db.write({ ...snapshot, sessions: snapshot.sessions.filter((item) => item.token !== token) });
    },
  };
}

export type AuthService = ReturnType<typeof createAuthService>;

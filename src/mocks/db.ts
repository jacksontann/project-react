import type { PasswordHash } from 'lib/crypto';

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  unit: string;
  createdAt: string;
  password: PasswordHash;
}

export interface SessionRecord {
  token: string;
  userId: string;
  createdAt: string;
}

export interface AttemptRecord {
  failures: number;
  lockedUntil: number | null;
}

export interface DbSnapshot {
  users: UserRecord[];
  sessions: SessionRecord[];
  /** Failed sign-in attempts per email, for lockout. */
  attempts: Record<string, AttemptRecord>;
}

export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface MockDb {
  read(): DbSnapshot;
  write(snapshot: DbSnapshot): void;
}

const KEY = 'lumen.mock-db.v1';

function isSnapshot(value: unknown): value is DbSnapshot {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<DbSnapshot>;
  return (
    Array.isArray(candidate.users) &&
    Array.isArray(candidate.sessions) &&
    typeof candidate.attempts === 'object'
  );
}

/**
 * Tiny persistence layer for the in-browser mock API. Reads go to storage every time so two
 * open tabs see the same data; if storage is unavailable it falls back to memory.
 */
export function createMockDb(store: KeyValueStore | null, seed: () => DbSnapshot): MockDb {
  let memory: DbSnapshot | null = null;

  const persist = (snapshot: DbSnapshot) => {
    memory = snapshot;
    try {
      store?.setItem(KEY, JSON.stringify(snapshot));
    } catch {
      // Memory copy is still authoritative for this page.
    }
  };

  return {
    read() {
      try {
        const raw = store?.getItem(KEY);
        if (raw) {
          const parsed: unknown = JSON.parse(raw);
          if (isSnapshot(parsed)) return parsed;
        }
      } catch {
        // Corrupt or unreadable: fall through to memory / seed.
      }
      if (!memory) persist(seed());
      return memory as DbSnapshot;
    },
    write: persist,
  };
}

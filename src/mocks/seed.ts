import { DEMO_ACCOUNT } from 'features/auth/demo';
import type { DbSnapshot } from './db';

/**
 * The demo resident's password hash is precomputed (PBKDF2-SHA256, 600k iterations, same format
 * `hashPassword` produces) so seeding costs nothing at startup.
 */
export function seedSnapshot(): DbSnapshot {
  return {
    users: [
      {
        id: 'resident-demo',
        name: 'Aisyah binti Rahman',
        email: DEMO_ACCOUNT.email,
        unit: '12-03',
        createdAt: '2026-03-14T09:30:00.000Z',
        password: {
          algorithm: 'PBKDF2-SHA256',
          iterations: 600_000,
          salt: 'rJ5NqiP4JirZqKJlLJQm3w',
          hash: '7VLTGBUBNy847tgVgTesCcR0AkzzXiXL2XlldRQBOu0',
        },
      },
    ],
    sessions: [],
    attempts: {},
  };
}

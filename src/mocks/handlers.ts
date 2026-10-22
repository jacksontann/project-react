import { delay, http, HttpResponse } from 'msw';
import { createMockDb, type KeyValueStore } from './db';
import { createAuthService, MockApiError } from './authService';
import { seedSnapshot } from './seed';

function browserStore(): KeyValueStore | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

const auth = createAuthService(createMockDb(browserStore(), seedSnapshot));

/** Realistic round-trip time. Time spent hashing counts towards it, so totals stay consistent. */
const LATENCY_MS = { min: 450, max: 850 };

async function respond(work: () => Response | Promise<Response>, { simulateLatency = true } = {}) {
  const started = performance.now();
  let response: Response;
  try {
    response = await work();
  } catch (error) {
    response =
      error instanceof MockApiError
        ? HttpResponse.json(error.body, {
            status: error.status,
            headers: error.body.retryAfter ? { 'Retry-After': String(error.body.retryAfter) } : {},
          })
        : HttpResponse.json(
            { code: 'UNKNOWN', message: 'Something went wrong on our side. Please try again.' },
            { status: 500 },
          );
  }
  if (simulateLatency) {
    const target = LATENCY_MS.min + Math.random() * (LATENCY_MS.max - LATENCY_MS.min);
    await delay(Math.max(0, target - (performance.now() - started)));
  }
  return response;
}

const bearerToken = (request: Request) =>
  request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '') ?? null;

const jsonBody = (request: Request): Promise<unknown> => request.json().catch(() => null);

export const handlers = [
  http.post('/api/auth/register', ({ request }) =>
    respond(async () =>
      HttpResponse.json(await auth.register(await jsonBody(request)), { status: 201 }),
    ),
  ),

  http.post('/api/auth/login', ({ request }) =>
    respond(async () => HttpResponse.json(await auth.login(await jsonBody(request)))),
  ),

  http.get('/api/auth/me', ({ request }) =>
    respond(() => HttpResponse.json({ user: auth.me(bearerToken(request)) }), {
      simulateLatency: false,
    }),
  ),

  http.post('/api/auth/logout', ({ request }) =>
    respond(() => {
      auth.logout(bearerToken(request));
      return new HttpResponse(null, { status: 204 });
    }),
  ),
];

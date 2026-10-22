import { z, type ZodType } from 'zod';

/**
 * Base URL of the auth API. Empty means same-origin, which is what the in-browser mock (MSW)
 * intercepts. Point it at a real backend with REACT_APP_API_URL and disable the mock with
 * REACT_APP_API_MOCKING=off; nothing else in the UI changes.
 */
export const API_BASE_URL = process.env.REACT_APP_API_URL ?? '';

export type ApiErrorCode =
  | 'VALIDATION'
  | 'EMAIL_TAKEN'
  | 'INVALID_CREDENTIALS'
  | 'TOO_MANY_ATTEMPTS'
  | 'UNAUTHENTICATED'
  | 'NETWORK'
  | 'UNKNOWN';

export const apiErrorBodySchema = z.object({
  code: z.string(),
  message: z.string(),
  fieldErrors: z.record(z.string()).optional(),
  retryAfter: z.number().optional(),
});

export type ApiErrorBody = z.infer<typeof apiErrorBodySchema>;

export class ApiError extends Error {
  override readonly name = 'ApiError';

  constructor(
    readonly status: number,
    readonly code: ApiErrorCode,
    message: string,
    readonly fieldErrors: Record<string, string> = {},
    /** Seconds until the client may retry (429). */
    readonly retryAfter?: number,
  ) {
    super(message);
  }
}

const KNOWN_CODES = new Set<string>([
  'VALIDATION',
  'EMAIL_TAKEN',
  'INVALID_CREDENTIALS',
  'TOO_MANY_ATTEMPTS',
  'UNAUTHENTICATED',
]);

interface HttpOptions {
  method?: 'GET' | 'POST';
  body?: unknown;
  token?: string | null;
  signal?: AbortSignal;
}

/** JSON request whose response body is validated at runtime, so `T` is a fact, not a cast. */
export async function http<T>(
  path: string,
  options: HttpOptions & { schema: ZodType<T> },
): Promise<T>;
export async function http(path: string, options?: HttpOptions): Promise<void>;
export async function http<T>(
  path: string,
  { method = 'GET', body, token, signal, schema }: HttpOptions & { schema?: ZodType<T> } = {},
): Promise<T | void> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new ApiError(
      0,
      'NETWORK',
      navigator.onLine
        ? "We couldn't reach Lumen. Please try again in a moment."
        : "You're offline. Check your connection and try again.",
    );
  }

  const payload: unknown = response.status === 204 ? null : await response.json().catch(() => null);

  if (!response.ok) throw toApiError(response.status, payload);
  if (!schema) return;

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    throw new ApiError(response.status, 'UNKNOWN', 'Lumen sent an unexpected response.');
  }
  return parsed.data;
}

function toApiError(status: number, payload: unknown) {
  const body = apiErrorBodySchema.safeParse(payload);
  if (!body.success) {
    return new ApiError(status, 'UNKNOWN', 'Something went wrong on our side. Please try again.');
  }
  const { code, message, fieldErrors, retryAfter } = body.data;
  return new ApiError(
    status,
    KNOWN_CODES.has(code) ? (code as ApiErrorCode) : 'UNKNOWN',
    message,
    fieldErrors,
    retryAfter,
  );
}

import { z } from 'zod';
import { ApiError, http } from './http';

function respond(status: number, body?: unknown) {
  return jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => {
      if (body === undefined) throw new SyntaxError('no body');
      return body;
    },
  });
}

async function caught(promise: Promise<unknown>) {
  try {
    await promise;
  } catch (error) {
    return error as ApiError;
  }
  throw new Error('expected the request to fail');
}

describe('http client', () => {
  it('returns schema-validated data and sends JSON + bearer token', async () => {
    window.fetch = respond(200, { value: 42 });
    const data = await http('/api/thing', {
      method: 'POST',
      body: { a: 1 },
      token: 'tok',
      schema: z.object({ value: z.number() }),
    });
    expect(data).toEqual({ value: 42 });

    const [url, init] = (window.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe('/api/thing');
    expect(init.headers).toMatchObject({
      'Content-Type': 'application/json',
      Authorization: 'Bearer tok',
    });
    expect(init.body).toBe('{"a":1}');
  });

  it('maps API error bodies to typed ApiErrors', async () => {
    window.fetch = respond(429, {
      code: 'TOO_MANY_ATTEMPTS',
      message: 'Slow down',
      retryAfter: 30,
    });
    const error = await caught(http('/api/auth/login', { method: 'POST', body: {} }));
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 429, code: 'TOO_MANY_ATTEMPTS', retryAfter: 30 });
  });

  it('keeps field errors for forms to display', async () => {
    window.fetch = respond(409, {
      code: 'EMAIL_TAKEN',
      message: 'Taken',
      fieldErrors: { email: 'Already registered' },
    });
    const error = await caught(http('/api/auth/register', { method: 'POST', body: {} }));
    expect(error.fieldErrors).toEqual({ email: 'Already registered' });
  });

  it('treats unknown codes and malformed bodies as UNKNOWN', async () => {
    window.fetch = respond(418, { code: 'TEAPOT', message: 'I am a teapot' });
    expect((await caught(http('/x'))).code).toBe('UNKNOWN');

    window.fetch = respond(500);
    expect((await caught(http('/x'))).code).toBe('UNKNOWN');
  });

  it('rejects responses that do not match the expected schema', async () => {
    window.fetch = respond(200, { value: 'not a number' });
    const error = await caught(http('/x', { schema: z.object({ value: z.number() }) }));
    expect(error.code).toBe('UNKNOWN');
  });

  it('reports network failures as NETWORK errors', async () => {
    window.fetch = jest.fn().mockRejectedValue(new TypeError('Failed to fetch'));
    const error = await caught(http('/x'));
    expect(error).toMatchObject({ status: 0, code: 'NETWORK' });
  });
});

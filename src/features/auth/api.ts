import { http } from 'lib/http';
import {
  meResponseSchema,
  sessionResponseSchema,
  type LoginRequest,
  type RegisterRequest,
} from './schemas';

export const authApi = {
  login: (input: LoginRequest, signal?: AbortSignal) =>
    http('/api/auth/login', {
      method: 'POST',
      body: input,
      signal,
      schema: sessionResponseSchema,
    }),

  register: (input: RegisterRequest, signal?: AbortSignal) =>
    http('/api/auth/register', {
      method: 'POST',
      body: input,
      signal,
      schema: sessionResponseSchema,
    }),

  me: async (token: string, signal?: AbortSignal) => {
    const { user } = await http('/api/auth/me', { token, signal, schema: meResponseSchema });
    return user;
  },

  logout: (token: string) => http('/api/auth/logout', { method: 'POST', token }),
};

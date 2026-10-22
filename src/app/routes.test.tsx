import { screen, waitFor } from '@testing-library/react';
import { authApi } from 'features/auth/api';
import { ApiError } from 'lib/http';
import { renderRoute } from 'test/renderRoute';

jest.mock('features/auth/api');
const api = jest.mocked(authApi);

const resident = {
  id: 'resident-demo',
  name: 'Aisyah binti Rahman',
  email: 'demo@lumen.my',
  unit: '12-03',
  createdAt: '2026-03-14T09:30:00.000Z',
};

describe('routing and session guards', () => {
  it('sends anonymous visitors from the protected home to sign-in', async () => {
    const { router } = renderRoute('/home');
    expect(await screen.findByRole('heading', { name: /welcome home/i })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/login');
  });

  it('restores a remembered session and skips the sign-in page', async () => {
    window.localStorage.setItem('lumen.session', 'stored-token');
    api.me.mockResolvedValue(resident);
    const { router } = renderRoute('/login');

    expect(await screen.findByRole('heading', { name: /lights on, aisyah/i })).toBeInTheDocument();
    expect(api.me).toHaveBeenCalledWith('stored-token', expect.any(AbortSignal));
    expect(router.state.location.pathname).toBe('/home');
  });

  it('forgets a token the server no longer accepts', async () => {
    window.localStorage.setItem('lumen.session', 'expired-token');
    api.me.mockRejectedValue(new ApiError(401, 'UNAUTHENTICATED', 'Session ended'));
    renderRoute('/home');

    expect(await screen.findByRole('heading', { name: /welcome home/i })).toBeInTheDocument();
    await waitFor(() => expect(window.localStorage.getItem('lumen.session')).toBeNull());
  });

  it('keeps the token through a network blip instead of signing the resident out', async () => {
    window.localStorage.setItem('lumen.session', 'valid-token');
    api.me.mockRejectedValue(new ApiError(0, 'NETWORK', 'Offline'));
    renderRoute('/home');

    expect(await screen.findByRole('heading', { name: /welcome home/i })).toBeInTheDocument();
    expect(window.localStorage.getItem('lumen.session')).toBe('valid-token');
  });

  it('redirects unknown paths to the right starting page', async () => {
    const { router } = renderRoute('/does-not-exist');
    expect(await screen.findByRole('heading', { name: /welcome home/i })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/login');
  });
});

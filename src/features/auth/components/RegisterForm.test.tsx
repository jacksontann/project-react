import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { authApi } from 'features/auth/api';
import { loadStrengthEngine, validateNewPassword } from 'features/auth/passwordPolicy';
import { useSceneStore } from 'features/scene/sceneStore';
import { ApiError } from 'lib/http';
import { pwnedCount } from 'lib/pwned';
import { axe, renderRoute } from 'test/renderRoute';

jest.mock('features/auth/api');
jest.mock('lib/pwned', () => ({ pwnedCount: jest.fn() }));
jest.mock('features/auth/passwordPolicy', () => ({
  ...jest.requireActual('features/auth/passwordPolicy'),
  loadStrengthEngine: jest.fn(),
  validateNewPassword: jest.fn(),
}));

const api = jest.mocked(authApi);

beforeEach(() => {
  jest.mocked(pwnedCount).mockResolvedValue(0);
  jest
    .mocked(loadStrengthEngine)
    .mockResolvedValue(() => ({ score: 4, warning: null, suggestions: [] }));
  jest.mocked(validateNewPassword).mockResolvedValue(null);
});

async function fillValidForm() {
  const user = userEvent.setup();
  await user.type(await screen.findByLabelText('Full name'), 'Lim Wei Jie');
  await user.type(screen.getByLabelText('Email'), 'weijie@example.com');
  await user.type(screen.getByLabelText('Unit no.'), '1803');
  await user.type(screen.getByLabelText('Password'), 'lantern orchid tramline');
  await user.type(screen.getByLabelText('Confirm password'), 'lantern orchid tramline');
  await user.click(screen.getByRole('checkbox'));
  return user;
}

describe('Registration page', () => {
  it('has no detectable accessibility violations', async () => {
    const { container } = renderRoute('/register');
    await screen.findByRole('heading', { name: /find your window/i });
    expect(await axe(container)).toHaveNoViolations();
  });

  it('masks the unit number and reads it back as floor and unit', async () => {
    const user = userEvent.setup();
    renderRoute('/register');
    await user.type(await screen.findByLabelText('Unit no.'), '1203');
    expect(screen.getByLabelText('Unit no.')).toHaveValue('12-03');
    // The form's own readout (the 3D scene's callout lives outside <main>).
    expect(within(screen.getByRole('main')).getByText('FLR 12 · UNIT 03')).toBeInTheDocument();
  });

  it('fills the unit when a window is picked on the 3D tower', async () => {
    renderRoute('/register');
    await screen.findByLabelText('Unit no.');
    act(() => useSceneStore.getState().pickUnit?.({ floor: 7, unit: 2 }));
    expect(screen.getByLabelText('Unit no.')).toHaveValue('07-02');
  });

  it('flags a mismatched confirmation when leaving the field', async () => {
    const user = userEvent.setup();
    renderRoute('/register');
    await user.type(await screen.findByLabelText('Password'), 'lantern orchid tramline');
    await user.type(screen.getByLabelText('Confirm password'), 'lantern orchid');
    await user.tab();
    expect(await screen.findByText("Passwords don't match.")).toBeInTheDocument();
  });

  it('shows the live strength meter and breach result while typing', async () => {
    jest.mocked(pwnedCount).mockResolvedValue(2266543);
    const user = userEvent.setup();
    renderRoute('/register');
    await user.type(await screen.findByLabelText('Password'), 'password123');
    expect(await screen.findByText('Very strong')).toBeInTheDocument();
    expect(
      await screen.findByText(/found in 2,266,543 known data breaches/i, {}, { timeout: 3000 }),
    ).toBeInTheDocument();
  });

  it('refuses a breached password at submit without calling the API', async () => {
    jest
      .mocked(validateNewPassword)
      .mockResolvedValue(
        'This password has appeared in 1,234 data breaches. Please choose a different one.',
      );
    renderRoute('/register');
    const user = await fillValidForm();
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByText(/appeared in 1,234 data breaches/)).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toHaveFocus();
    expect(api.register).not.toHaveBeenCalled();
  });

  it('maps a server "email taken" error onto the email field', async () => {
    api.register.mockRejectedValue(
      new ApiError(409, 'EMAIL_TAKEN', 'An account with this email already exists.', {
        email: 'This email is already registered. Try signing in instead.',
      }),
    );
    renderRoute('/register');
    const user = await fillValidForm();
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByText(/already registered/)).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
  });

  it('creates the account with normalised data and signs the resident in', async () => {
    api.register.mockResolvedValue({
      token: 'new-token',
      user: {
        id: 'u-1',
        name: 'Lim Wei Jie',
        email: 'weijie@example.com',
        unit: '18-03',
        createdAt: '2026-10-22T12:00:00.000Z',
      },
    });
    renderRoute('/register');
    const user = await fillValidForm();
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(
      await screen.findByRole('heading', { name: /lights on, lim wei jie/i }, { timeout: 3000 }),
    ).toBeInTheDocument();
    expect(api.register).toHaveBeenCalledWith({
      name: 'Lim Wei Jie',
      email: 'weijie@example.com',
      unit: '18-03',
      password: 'lantern orchid tramline',
    });
  });
});

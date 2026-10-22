import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { authApi } from 'features/auth/api';
import { ApiError } from 'lib/http';
import { axe, renderRoute } from 'test/renderRoute';

jest.mock('features/auth/api');
const api = jest.mocked(authApi);

const session = {
  token: 'token-123',
  user: {
    id: 'resident-demo',
    name: 'Aisyah binti Rahman',
    email: 'demo@lumen.my',
    unit: '12-03',
    createdAt: '2026-03-14T09:30:00.000Z',
  },
};

async function fillAndSubmit(email: string, password: string) {
  const user = userEvent.setup();
  await user.type(await screen.findByLabelText('Email'), email);
  await user.type(screen.getByLabelText('Password'), password);
  await user.click(screen.getByRole('button', { name: /^sign in/i }));
  return user;
}

describe('Sign-in page', () => {
  it('has no detectable accessibility violations', async () => {
    const { container } = renderRoute('/login');
    await screen.findByRole('heading', { name: /welcome home/i });
    expect(await axe(container)).toHaveNoViolations();
  });

  it('validates on submit, links errors to fields and focuses the first invalid one', async () => {
    const user = userEvent.setup();
    renderRoute('/login');
    await user.click(await screen.findByRole('button', { name: /^sign in/i }));

    const email = screen.getByLabelText('Email');
    expect(await screen.findByText('Enter your email address.')).toBeInTheDocument();
    expect(screen.getByText('Enter your password.')).toBeInTheDocument();
    expect(email).toHaveFocus();
    expect(email).toHaveAttribute('aria-invalid', 'true');
    expect(email).toHaveAccessibleDescription('Enter your email address.');
    expect(api.login).not.toHaveBeenCalled();
  });

  it('announces wrong credentials generically and clears the password', async () => {
    api.login.mockRejectedValue(
      new ApiError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect.'),
    );
    renderRoute('/login');
    await fillAndSubmit('demo@lumen.my', 'wrong-password');

    expect(await screen.findByRole('alert')).toHaveTextContent('Email or password is incorrect.');
    expect(screen.getByLabelText('Password')).toHaveValue('');
    expect(screen.getByLabelText('Password')).toHaveFocus();
  });

  it('locks the form with a countdown after too many attempts', async () => {
    api.login.mockRejectedValue(
      new ApiError(429, 'TOO_MANY_ATTEMPTS', 'Too many attempts.', {}, 30),
    );
    renderRoute('/login');
    await fillAndSubmit('demo@lumen.my', 'wrong-password');

    expect(await screen.findByRole('button', { name: /try again in 30s/i })).toBeDisabled();
    expect(screen.getByRole('alert')).toHaveTextContent(/wait 30 seconds/);
  });

  it('signs in, remembers the session when asked and lands on the resident home', async () => {
    api.login.mockResolvedValue(session);
    renderRoute('/login');
    const user = userEvent.setup();
    await user.type(await screen.findByLabelText('Email'), '  Demo@Lumen.my ');
    await user.type(screen.getByLabelText('Password'), 'Lumen-Demo-2026!');
    await user.click(screen.getByLabelText(/remember me/i));
    await user.click(screen.getByRole('button', { name: /^sign in/i }));

    expect(
      await screen.findByRole('heading', { name: /lights on, aisyah/i }, { timeout: 3000 }),
    ).toBeInTheDocument();
    expect(api.login).toHaveBeenCalledWith({
      email: 'demo@lumen.my',
      password: 'Lumen-Demo-2026!',
      remember: true,
    });
    expect(window.localStorage.getItem('lumen.session')).toBe('token-123');
  });

  it('can fill in the demo resident for reviewers', async () => {
    const user = userEvent.setup();
    renderRoute('/login');
    await user.click(await screen.findByRole('button', { name: /use the demo resident/i }));
    expect(screen.getByLabelText('Email')).toHaveValue('demo@lumen.my');
    expect(screen.getByLabelText('Password')).not.toHaveValue('');
  });

  it('toggles password visibility accessibly', async () => {
    const user = userEvent.setup();
    renderRoute('/login');
    const toggle = await screen.findByRole('button', { name: 'Show password' });
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');
    await user.click(toggle);
    expect(screen.getByRole('button', { name: 'Hide password' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'text');
  });
});

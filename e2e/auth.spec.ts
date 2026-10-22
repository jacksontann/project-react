import { expect, test } from '@playwright/test';

test.describe('resident journey', () => {
  test('register → home → sign out → sign in with the demo resident', async ({ page }) => {
    const email = `e2e-${Date.now()}@example.com`;

    await page.goto('/');
    await expect(page).toHaveURL(/\/login$/);
    await page.getByRole('link', { name: 'Create an account' }).click();
    await expect(page.getByRole('heading', { name: /find your window/i })).toBeVisible();

    await page.getByLabel('Full name').fill('Nur Aisyah binti Ahmad');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Unit no.').pressSequentially('0907');
    await expect(page.getByLabel('Unit no.')).toHaveValue('09-07');
    await page.getByLabel('Password', { exact: true }).fill('lantern orchid tramline 47');
    await page.getByLabel('Confirm password').fill('lantern orchid tramline 47');
    await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: /create account/i }).click();

    await expect(page).toHaveURL(/\/home$/);
    await expect(page.getByRole('heading', { name: 'Lights on, Nur Aisyah.' })).toBeVisible();
    await expect(page.getByText('Unit 09-07 · Floor 9')).toBeVisible();

    // The session survives a reload (restored through GET /api/auth/me).
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Lights on, Nur Aisyah.' })).toBeVisible();

    await page.getByRole('button', { name: /sign out/i }).click();
    await expect(page).toHaveURL(/\/login$/);

    // Same email can't register twice.
    await page.goto('/register');
    await page.getByLabel('Full name').fill('Someone Else');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Unit no.').pressSequentially('0101');
    await page.getByLabel('Password', { exact: true }).fill('lantern orchid tramline 47');
    await page.getByLabel('Confirm password').fill('lantern orchid tramline 47');
    await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page.getByText(/already registered/i)).toBeVisible();

    await page.getByRole('link', { name: 'Sign in' }).click();
    await page.getByRole('button', { name: /use the demo resident/i }).click();
    await page.getByRole('button', { name: /^sign in/i }).click();
    await expect(page).toHaveURL(/\/home$/);
    await expect(page.getByRole('heading', { name: 'Lights on, Aisyah.' })).toBeVisible();
  });

  test('wrong credentials show one generic message', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('demo@lumen.my');
    await page.getByLabel('Password', { exact: true }).fill('not-the-password');
    await page.getByRole('button', { name: /^sign in/i }).click();
    await expect(page.getByRole('alert')).toHaveText('Email or password is incorrect.');
  });

  test('protected home redirects anonymous visitors to sign in', async ({ page }) => {
    await page.goto('/home');
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: /welcome home/i })).toBeVisible();
  });
});

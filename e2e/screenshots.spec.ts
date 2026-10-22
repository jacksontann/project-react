import { expect, test, type Page } from '@playwright/test';

/**
 * Generates the README screenshots (docs/screenshots). Run with `yarn screenshots`.
 * Waits for the WebGL scene's first frame plus its intro before capturing.
 */
const OUT = 'docs/screenshots';

async function sceneSettled(page: Page) {
  await page.locator('[data-scene-ready]').waitFor({ timeout: 30_000 });
  await page.waitForTimeout(3500);
}

test.describe('@screenshots README images', () => {
  test.describe.configure({ mode: 'serial' });

  test('sign-in (desktop)', async ({ page }) => {
    await page.goto('/login');
    await sceneSettled(page);
    await page.screenshot({ path: `${OUT}/login.png` });
  });

  test('registration with window picker (desktop)', async ({ page }) => {
    await page.goto('/register');
    await sceneSettled(page);
    await page.getByLabel('Full name').fill('Lim Wei Jie');
    await page.getByLabel('Email').fill('weijie@example.com');
    await page.getByLabel('Unit no.').pressSequentially('1803');
    await page.getByLabel('Password', { exact: true }).fill('lantern orchid tramline 47');
    await expect(page.getByText(/not found in known data breaches/i)).toBeVisible();
    await page.getByLabel('Full name').click();
    await page.mouse.move(700, 450);
    await page.waitForTimeout(2500);
    await page.screenshot({ path: `${OUT}/register.png` });
  });

  test('signed-in home (desktop)', async ({ page }) => {
    await page.goto('/login');
    await sceneSettled(page);
    await page.getByRole('button', { name: /use the demo resident/i }).click();
    await page.getByRole('button', { name: /^sign in/i }).click();
    await expect(page.getByRole('heading', { name: 'Lights on, Aisyah.' })).toBeVisible();
    await page.mouse.move(1300, 860);
    await page.waitForTimeout(4000);
    await page.screenshot({ path: `${OUT}/home.png` });
  });

  test.describe('mobile', () => {
    test.use({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });

    test('sign-in and registration (phone)', async ({ page }) => {
      await page.goto('/login');
      await sceneSettled(page);
      await page.screenshot({ path: `${OUT}/login-mobile.png` });

      await page.goto('/register');
      await sceneSettled(page);
      await page.getByLabel('Unit no.').pressSequentially('1803');
      await page.waitForTimeout(1500);
      await page.screenshot({ path: `${OUT}/register-mobile.png` });
    });
  });
});

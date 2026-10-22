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

async function hideCursor(page: Page) {
  await page.addStyleTag({ content: '.custom-cursor { display: none !important; }' });
}

/** Sweeps the pointer over the tower until it rests on a window ("FLR · UNIT · Click to pick"). */
async function hoverAWindow(page: Page) {
  for (let y = 380; y <= 720; y += 16) {
    for (let x = 320; x <= 560; x += 14) {
      await page.mouse.move(x, y);
      const label = await page.locator('.custom-cursor').innerText();
      if (/click to pick/i.test(label)) return;
    }
  }
}

test.describe('@screenshots README images', () => {
  test.describe.configure({ mode: 'serial' });

  test('sign-in (desktop)', async ({ page }) => {
    await page.goto('/login');
    await sceneSettled(page);
    await hideCursor(page);
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
    await page.waitForTimeout(2500);
    await hoverAWindow(page);
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${OUT}/register.png` });
  });
});

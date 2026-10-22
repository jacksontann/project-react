import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end tests run against the real dev server on the assignment's port (3333), with the
 * in-browser mock API. WebGL is software-rendered (SwiftShader) so the 3D scene runs headless.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:3333',
    trace: 'retain-on-failure',
    launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] },
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
  ],
  webServer: {
    command: 'yarn start',
    url: 'http://localhost:3333',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: { BROWSER: 'none' },
  },
});

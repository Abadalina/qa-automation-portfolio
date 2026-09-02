import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,

  // Fail the CI build if a test.only was committed by accident.
  forbidOnly: !!process.env.CI,

  // Retries are enabled in CI only. They keep a transient network failure from
  // blocking the pipeline, but a test that only passes on retry is a bug to
  // investigate, not a pass. See docs/TEST_STRATEGY.md.
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,

  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    ['allure-playwright', { resultsDir: 'allure-results' }],
  ],

  use: {
    baseURL: 'https://www.saucedemo.com',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    // API tests need no browser, so they run as their own project.
    { name: 'api', testDir: './tests/api' },

    { name: 'chromium', testDir: './tests/ui', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox',  testDir: './tests/ui', use: { ...devices['Desktop Firefox'] } },
    { name: 'mobile',   testDir: './tests/ui', use: { ...devices['iPhone 13'] } },
  ],
});

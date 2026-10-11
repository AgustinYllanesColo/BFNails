import { defineConfig, devices } from "@playwright/test";

/**
 * E2E de BF Nails.
 * - Local: levanta `next build && next start` en el puerto 3100 (o reusa uno corriendo).
 * - Contra otra URL (por ejemplo producción): PW_BASE_URL=https://bf-nails.vercel.app pnpm test:e2e
 * - Si el Chromium de Playwright no está descargado, apuntá PLAYWRIGHT_CHROMIUM_PATH a un Chrome/Chromium local.
 */
const baseURL = process.env.PW_BASE_URL ?? "http://localhost:3100";
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined;

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: /.*\.spec\.ts/,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  timeout: 45_000,
  expect: { timeout: 8_000 },
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    locale: "es-AR",
    timezoneId: "America/Argentina/Buenos_Aires",
    launchOptions: { executablePath },
  },
  projects: [
    {
      name: "mobile",
      use: { ...devices["Pixel 7"], viewport: { width: 390, height: 844 }, browserName: "chromium" },
    },
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
  ],
  webServer: process.env.PW_BASE_URL
    ? undefined
    : {
        command: "pnpm build && pnpm start -p 3100",
        url: "http://localhost:3100",
        reuseExistingServer: true,
        timeout: 240_000,
      },
});

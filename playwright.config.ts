import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.BASE_URL || "http://localhost:8081";

export default defineConfig({
  testDir: "./tests",
  testMatch: /.*\.spec\.ts/,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: "list",
  timeout: 120 * 1000,
  expect: { timeout: 15 * 1000 },

  globalSetup: "./tests/global-setup.ts",

  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 15 * 1000,
    navigationTimeout: 60 * 1000
  },

  webServer: [
    {
      command: "npm --prefix ../Api run dev",
      url: "http://localhost:8084/health",
      reuseExistingServer: true,
      timeout: 60 * 1000
    },
    {
      command: "npx expo start --web --port 8081",
      env: { EXPO_PUBLIC_STAGE: "dev", CI: "1" },
      url: "http://localhost:8081",
      reuseExistingServer: true,
      timeout: 240 * 1000,
      stdout: "pipe",
      stderr: "pipe"
    }
  ],

  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        headless: true,
        viewport: { width: 800, height: 1280 }
      }
    }
  ]
});

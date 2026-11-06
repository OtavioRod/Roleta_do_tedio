import { defineConfig, devices } from "@playwright/test";

const url = process.env.E2E_URL ?? "http://localhost:8081";

export default defineConfig({
  testDir: ".",
  testMatch: /.*\.spec\.ts/,
  timeout: 120_000,
  expect: { timeout: 15_000 },
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: url,
    locale: "pt-BR",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "celular", use: { ...devices["Pixel 7"] } },
  ],
  webServer: process.env.E2E_SUBIR_APP
    ? {
        command: "npx expo start --web --port 8081",
        cwd: "..",
        url,
        reuseExistingServer: true,
        timeout: 180_000,
      }
    : undefined,
});

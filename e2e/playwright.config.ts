import { defineConfig, devices } from "@playwright/test";

// Variáveis de ambiente usadas pelos testes:
//   E2E_URL        endereço do app web (padrão http://localhost:8081)
//   E2E_EMAIL / E2E_SENHA       conta de teste 1 (e-mail já verificado)
//   E2E_EMAIL_2 / E2E_SENHA_2   conta de teste 2 (para a sala online)
//   E2E_SUBIR_APP=1             sobe o app com "expo start --web" antes de testar
//
// Use contas de TESTE (de preferência de um projeto Firebase separado).

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

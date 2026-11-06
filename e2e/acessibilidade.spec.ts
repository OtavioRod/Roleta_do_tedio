import AxeBuilder from "@axe-core/playwright";
import { expect, Page, test } from "@playwright/test";

import { entrar, temConta } from "./ajudantes";

async function verificar(page: Page) {
  const resultado = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();

  const graves = resultado.violations.filter(
    (violacao) =>
      violacao.impact === "serious" || violacao.impact === "critical",
  );

  expect(
    graves.map(
      (violacao) =>
        `${violacao.id}: ${violacao.help} (${violacao.nodes.length})`,
    ),
  ).toEqual([]);
}

test.describe("Acessibilidade automática (axe, WCAG 2.2 AA)", () => {
  test("tela de login", async ({ page }) => {
    await page.goto("/entrar");
    await expect(page.getByLabel("E-mail")).toBeVisible();

    await verificar(page);
  });

  test("a página declara o idioma", async ({ page }) => {
    await page.goto("/entrar");

    await expect(page.locator("html")).toHaveAttribute("lang", /pt/i);
  });

  test("login funciona só com o teclado", async ({ page }) => {
    await page.goto("/entrar");

    await page.getByLabel("E-mail").focus();
    await page.keyboard.press("Tab");

    await expect(page.getByLabel("Senha")).toBeFocused();
  });

  test.describe("logado", () => {
    test.skip(!temConta(1), "Defina E2E_EMAIL e E2E_SENHA");

    test("tela inicial", async ({ page }) => {
      await entrar(page);
      await verificar(page);
    });

    test("salas online", async ({ page }) => {
      await entrar(page);
      await page.goto("/salas");
      await expect(page.getByText("Salas online")).toBeVisible();

      await verificar(page);
    });

    test("perfil", async ({ page }) => {
      await entrar(page);
      await page.goto("/perfil");

      await verificar(page);
    });

    test("com movimento reduzido, as perguntas aparecem prontas", async ({
      page,
    }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });

      await entrar(page);
      await page.getByRole("button", { name: "Começar", exact: true }).click();

      await expect(
        page.getByText("Primeiro, vamos entender a situação"),
      ).toBeVisible({ timeout: 2_000 });
    });
  });
});

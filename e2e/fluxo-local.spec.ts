import { expect, test } from "@playwright/test";

import { entrar, temConta } from "./ajudantes";

test.describe("Fluxo no mesmo aparelho", () => {
  test.skip(!temConta(1), "Defina E2E_EMAIL e E2E_SENHA");

  test("a pessoa entra, começa e chega à primeira pergunta", async ({ page }) => {
    await entrar(page);

    await page.getByRole("button", { name: "Começar", exact: true }).click();

    await expect(
      page.getByText("Primeiro, vamos entender a situação"),
    ).toBeVisible();
  });

  test("o caminho para jogar online está à vista", async ({ page }) => {
    await entrar(page);

    await page.getByRole("button", { name: "Jogar online com amigos" }).click();

    await expect(page).toHaveURL(/salas|entrar/);
  });
});

test.describe("Acesso sem login", () => {
  test("rota protegida leva para o login", async ({ page }) => {
    await page.goto("/salas");

    await expect(page.getByLabel("E-mail")).toBeVisible();
  });

  test("link de sala sem login não abre a sala", async ({ page }) => {
    await page.goto("/sala/ABC123");

    await expect(page.getByLabel("E-mail")).toBeVisible();
  });
});

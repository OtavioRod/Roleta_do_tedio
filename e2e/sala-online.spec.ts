import { expect, test } from "@playwright/test";

import { entrar, responderPerguntas, temConta } from "./ajudantes";

const ATIVIDADES = [
  "Tomar um café",
  "Comer fora",
  "Ir ao cinema",
  "Passear no parque",
  "Fazer um passeio",
  "Ir a um evento",
  "Assistir a um filme",
  "Jogar alguma coisa",
];

test.describe("Sala online com duas pessoas", () => {
  test.skip(
    !temConta(1) || !temConta(2),
    "Defina E2E_EMAIL, E2E_SENHA, E2E_EMAIL_2 e E2E_SENHA_2",
  );

  test("criar, entrar pelo link, responder, roleta, votar e confirmar", async ({
    browser,
  }) => {
    const contextoA = await browser.newContext();
    const contextoB = await browser.newContext();

    const a = await contextoA.newPage();
    const b = await contextoB.newPage();

    await entrar(a, 1);
    await entrar(b, 2);

    await a.goto("/salas");
    await a.getByRole("button", { name: /Sala de casal/ }).click();

    await expect(a).toHaveURL(/\/sala\/[A-Z0-9]{6}/);

    const codigo = a.url().match(/\/sala\/([A-Z0-9]{6})/)![1];

    await b.goto(`/sala/${codigo}`);
    await b.getByRole("button", { name: "Entrar nesta sala" }).click();

    await expect(a.getByText(/2 de 2/).first()).toBeVisible();
    await a.getByRole("button", { name: "Começar", exact: true }).click();

    await Promise.all([responderPerguntas(a), responderPerguntas(b)]);

    await expect(a.getByText("A roleta decidiu")).toBeVisible({
      timeout: 45_000,
    });
    await expect(b.getByText("A roleta decidiu")).toBeVisible({
      timeout: 45_000,
    });
    await expect(a.getByText("Por que a roleta escolheu isso?")).toBeVisible();

    await a.getByRole("button", { name: "Topamos!" }).click();
    await b.getByRole("button", { name: "Topamos!" }).click();

    await expect(
      a.getByRole("button", { name: "Ver opções perto de vocês" }),
    ).toBeVisible({ timeout: 30_000 });
    await expect(
      b.getByRole("button", { name: "Ver opções perto de vocês" }),
    ).toBeVisible({ timeout: 30_000 });

    const textoA = await a.locator("body").innerText();
    const textoB = await b.locator("body").innerText();

    const escolhida = ATIVIDADES.find((nome) => textoA.includes(nome));

    expect(
      escolhida,
      "a atividade escolhida deveria aparecer na tela de A",
    ).toBeTruthy();
    expect(textoB).toContain(escolhida!);

    await contextoA.close();
    await contextoB.close();
  });
});

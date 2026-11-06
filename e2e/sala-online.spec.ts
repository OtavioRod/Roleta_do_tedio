import { expect, test } from "@playwright/test";

import { entrar, responderPerguntas, temConta } from "./ajudantes";

// Nomes das atividades do app (src/data/atividades.ts).
const ATIVIDADES = ["Tomar um café","Comer fora","Ir ao cinema","Passear no parque","Fazer um passeio","Ir a um evento","Assistir a um filme","Jogar alguma coisa"];

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

    // A cria a sala de casal.
    await a.goto("/salas");
    await a.getByRole("button", { name: /Sala de casal/ }).click();

    await expect(a).toHaveURL(/\/sala\/[A-Z0-9]{6}/);

    const codigo = a.url().match(/\/sala\/([A-Z0-9]{6})/)![1];

    // B entra pelo link.
    await b.goto(`/sala/${codigo}`);
    await b.getByRole("button", { name: "Entrar nesta sala" }).click();

    // A vê que a outra pessoa entrou e começa a rodada.
    await expect(a.getByText(/2 de 2/).first()).toBeVisible();
    await a.getByRole("button", { name: "Começar", exact: true }).click();

    // As duas respondem no próprio aparelho.
    await Promise.all([responderPerguntas(a), responderPerguntas(b)]);

    // A roleta gira e o resultado aparece para as duas, com explicação.
    await expect(a.getByText("A roleta decidiu")).toBeVisible({ timeout: 45_000 });
    await expect(b.getByText("A roleta decidiu")).toBeVisible({ timeout: 45_000 });
    await expect(a.getByText("Por que a roleta escolheu isso?")).toBeVisible();

    // As duas topam.
    await a.getByRole("button", { name: "Topamos!" }).click();
    await b.getByRole("button", { name: "Topamos!" }).click();

    await expect(
      a.getByRole("button", { name: "Ver opções perto de vocês" }),
    ).toBeVisible({ timeout: 30_000 });
    await expect(
      b.getByRole("button", { name: "Ver opções perto de vocês" }),
    ).toBeVisible({ timeout: 30_000 });

    // O resultado é o mesmo nos dois aparelhos.
    const textoA = await a.locator("body").innerText();
    const textoB = await b.locator("body").innerText();

    const escolhida = ATIVIDADES.find((nome) => textoA.includes(nome));

    expect(escolhida, "a atividade escolhida deveria aparecer na tela de A").toBeTruthy();
    expect(textoB).toContain(escolhida!);

    await contextoA.close();
    await contextoB.close();
  });
});

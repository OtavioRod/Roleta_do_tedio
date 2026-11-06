import { expect, Page } from "@playwright/test";

export function conta(numero: 1 | 2 = 1) {
  const email = numero === 1 ? process.env.E2E_EMAIL : process.env.E2E_EMAIL_2;
  const senha = numero === 1 ? process.env.E2E_SENHA : process.env.E2E_SENHA_2;

  return { email, senha };
}

export function temConta(numero: 1 | 2 = 1) {
  const { email, senha } = conta(numero);

  return Boolean(email && senha);
}

export async function entrar(page: Page, numero: 1 | 2 = 1) {
  const { email, senha } = conta(numero);

  await page.goto("/entrar");

  await page.getByLabel("E-mail").fill(email!);
  await page.getByLabel("Senha").fill(senha!);

  await page.getByRole("button", { name: "Entrar", exact: true }).click();

  await expect(page.getByText("Roleta do Tédio").first()).toBeVisible({
    timeout: 30_000,
  });
}

const AVANCAR =
  /^(Descobrir|Continuar|Descobrir meu tempo|Enviar minhas respostas)$/;

export async function responderPerguntas(page: Page) {
  for (let pergunta = 0; pergunta < 4; pergunta += 1) {
    await page
      .getByRole("button")
      .filter({ hasNotText: /Sair da sala|Usar as mesmas|Remover/ })
      .first()
      .click();

    const avancar = page.getByRole("button", { name: AVANCAR });

    if (
      await avancar
        .first()
        .isVisible()
        .catch(() => false)
    ) {
      await avancar.first().click();
    }
  }

  const enviar = page.getByRole("button", { name: "Enviar minhas respostas" });

  if (await enviar.isVisible().catch(() => false)) {
    await enviar.click();
  }
}

const CREDENCIAIS_INVALIDAS = "E-mail ou senha incorretos.";

const MENSAGENS: Record<string, string> = {
  "auth/invalid-credential": CREDENCIAIS_INVALIDAS,
  "auth/wrong-password": CREDENCIAIS_INVALIDAS,
  "auth/user-not-found": CREDENCIAIS_INVALIDAS,
  "auth/invalid-email": "O e-mail informado não é válido.",
  "auth/email-already-in-use": "Já existe uma conta com este e-mail.",
  "auth/weak-password": "A senha é fraca. Use pelo menos 8 caracteres.",
  "auth/too-many-requests":
    "Muitas tentativas. Aguarde alguns minutos e tente de novo.",
  "auth/network-request-failed":
    "Sem conexão com a internet. Verifique e tente novamente.",
  "auth/operation-not-allowed":
    "O login por e-mail e senha não está ativado no Firebase.",
  "auth/user-disabled": "Esta conta foi desativada.",
};

export function codigoErroAuth(erro: unknown) {
  return typeof erro === "object" && erro !== null && "code" in erro
    ? String((erro as { code: unknown }).code)
    : "";
}

export function mensagemErroAuth(erro: unknown) {
  return (
    MENSAGENS[codigoErroAuth(erro)] ??
    "Não foi possível concluir. Tente novamente."
  );
}

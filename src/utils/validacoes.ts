import { Genero, GENEROS } from "../constants/genero";

export const SENHA_MINIMA = 8;
export const SENHA_MAXIMA = 64;

const PADRAO_NOME = /^[A-Za-zÀ-ÖØ-öø-ÿ' .\-]+$/;

const PADRAO_EMAIL =
  /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;

const MENSAGEM_EMAIL = "Informe um e-mail válido, como nome@exemplo.com.";

export type CamposCadastro = {
  nome: string;
  email: string;
  genero: Genero | "";
  senha: string;
  confirmacao: string;
  aceitouTermos: boolean;
};

export type ErrosCadastro = Partial<Record<keyof CamposCadastro, string>>;

export function normalizarNome(nome: string) {
  return nome.trim().replace(/\s+/g, " ");
}

export function normalizarEmail(email: string) {
  return email.trim().toLowerCase();
}

export function validarNome(nome: string): string | null {
  const valor = normalizarNome(nome);

  if (valor === "") {
    return "Informe o seu nome.";
  }

  if (valor.length > 60) {
    return "O nome pode ter no máximo 60 caracteres.";
  }

  if (!PADRAO_NOME.test(valor)) {
    return "Use apenas letras, espaços, apóstrofo ou hífen no nome.";
  }

  const letras = valor.match(/[A-Za-zÀ-ÖØ-öø-ÿ]/g) ?? [];

  if (letras.length < 2) {
    return "O nome precisa ter pelo menos 2 letras.";
  }

  return null;
}

export function validarEmail(email: string): string | null {
  const valor = normalizarEmail(email);

  if (valor === "") {
    return "Informe o e-mail.";
  }

  if (valor.length > 254) {
    return "O e-mail é longo demais.";
  }

  if (!PADRAO_EMAIL.test(valor)) {
    return MENSAGEM_EMAIL;
  }

  const [local, dominio] = valor.split("@");

  if (
    local.length > 64 ||
    local.startsWith(".") ||
    local.endsWith(".") ||
    local.includes("..")
  ) {
    return MENSAGEM_EMAIL;
  }

  if (!/\.[a-z]{2,}$/.test(dominio)) {
    return "O domínio do e-mail parece incompleto.";
  }

  return null;
}

export function validarSenha(senha: string, email = ""): string | null {
  if (senha === "") {
    return "Informe a senha.";
  }

  if (senha.length < SENHA_MINIMA) {
    return `A senha precisa ter pelo menos ${SENHA_MINIMA} caracteres.`;
  }

  if (senha.length > SENHA_MAXIMA) {
    return `A senha pode ter no máximo ${SENHA_MAXIMA} caracteres.`;
  }

  if (/^\s|\s$/.test(senha)) {
    return "A senha não pode começar nem terminar com espaço.";
  }

  if (!/[A-Za-z]/.test(senha) || !/[0-9]/.test(senha)) {
    return "Use letras e números na senha.";
  }

  const parteLocal = normalizarEmail(email).split("@")[0];

  if (parteLocal.length >= 4 && senha.toLowerCase().includes(parteLocal)) {
    return "A senha não pode conter o seu e-mail.";
  }

  return null;
}

export function validarConfirmacao(
  senha: string,
  confirmacao: string,
): string | null {
  if (confirmacao === "") {
    return "Repita a senha.";
  }

  if (senha !== confirmacao) {
    return "A confirmação da senha não confere.";
  }

  return null;
}

export function validarGenero(genero: string): string | null {
  if (!GENEROS.some((opcao) => opcao.valor === genero)) {
    return "Escolha uma das opções.";
  }

  return null;
}

export function validarTermos(aceitou: boolean): string | null {
  return aceitou ? null : "É preciso aceitar para criar a conta.";
}

export function validarCadastro(campos: CamposCadastro): ErrosCadastro {
  const erros: ErrosCadastro = {};

  const nome = validarNome(campos.nome);
  const email = validarEmail(campos.email);
  const genero = validarGenero(campos.genero);
  const senha = validarSenha(campos.senha, campos.email);
  const confirmacao = validarConfirmacao(campos.senha, campos.confirmacao);
  const termos = validarTermos(campos.aceitouTermos);

  if (nome) erros.nome = nome;
  if (email) erros.email = email;
  if (genero) erros.genero = genero;
  if (senha) erros.senha = senha;
  if (confirmacao) erros.confirmacao = confirmacao;
  if (termos) erros.aceitouTermos = termos;

  return erros;
}

export function validarLogin(
  email: string,
  senha: string,
): { email?: string; senha?: string } {
  const erros: { email?: string; senha?: string } = {};

  const erroEmail = validarEmail(email);

  if (erroEmail) {
    erros.email = erroEmail;
  }

  if (senha === "") {
    erros.senha = "Informe a senha.";
  }

  return erros;
}

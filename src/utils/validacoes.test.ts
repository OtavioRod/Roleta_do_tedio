import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
    normalizarEmail,
    normalizarNome,
    validarCadastro,
    validarConfirmacao,
    validarEmail,
    validarGenero,
    validarLogin,
    validarNome,
    validarSenha,
    validarTermos,
} from "./validacoes";

const cadastroValido = {
  nome: "Maria da Silva",
  email: "maria@exemplo.com",
  genero: "feminino" as const,
  senha: "abc12345",
  confirmacao: "abc12345",
  aceitouTermos: true,
};

describe("validarEmail", () => {
  it("aceita e-mails válidos", () => {
    assert.equal(validarEmail("nome@exemplo.com"), null);
    assert.equal(
      validarEmail("  Nome.Sobrenome+teste@sub.exemplo.com.br "),
      null,
    );
  });

  it("recusa vazio, sem arroba, sem domínio e com pontos inválidos", () => {
    assert.notEqual(validarEmail(""), null);
    assert.notEqual(validarEmail("   "), null);
    assert.notEqual(validarEmail("semarroba.com"), null);
    assert.notEqual(validarEmail("nome@"), null);
    assert.notEqual(validarEmail("@exemplo.com"), null);
    assert.notEqual(validarEmail("nome@exemplo"), null);
    assert.notEqual(validarEmail("nome@exemplo..com"), null);
    assert.notEqual(validarEmail(".nome@exemplo.com"), null);
    assert.notEqual(validarEmail("na..me@exemplo.com"), null);
    assert.notEqual(validarEmail("nome @exemplo.com"), null);
    assert.notEqual(validarEmail("nome@exemplo.c"), null);
  });

  it("recusa e-mail longo demais", () => {
    assert.notEqual(validarEmail(`${"a".repeat(65)}@exemplo.com`), null);
    assert.notEqual(validarEmail(`a@${"b".repeat(250)}.com`), null);
  });

  it("normaliza para minúsculas e sem espaços", () => {
    assert.equal(normalizarEmail("  Ana@Exemplo.COM "), "ana@exemplo.com");
  });
});

describe("validarNome", () => {
  it("aceita nomes com acento, hífen e apóstrofo", () => {
    assert.equal(validarNome("João D'Ávila-Souza"), null);
    assert.equal(validarNome("Ana"), null);
  });

  it("recusa vazio, curto, com números e símbolos", () => {
    assert.notEqual(validarNome(""), null);
    assert.notEqual(validarNome("A"), null);
    assert.notEqual(validarNome("Ana123"), null);
    assert.notEqual(validarNome("<script>"), null);
    assert.notEqual(validarNome("..."), null);
  });

  it("recusa nome com mais de 60 caracteres", () => {
    assert.notEqual(validarNome("a".repeat(61)), null);
  });

  it("normaliza espaços repetidos", () => {
    assert.equal(normalizarNome("  Maria   da  Silva "), "Maria da Silva");
  });
});

describe("validarSenha", () => {
  it("aceita senha com letras e números", () => {
    assert.equal(validarSenha("abc12345"), null);
  });

  it("recusa curta, só letras, só números e com espaço nas pontas", () => {
    assert.notEqual(validarSenha(""), null);
    assert.notEqual(validarSenha("abc123"), null);
    assert.notEqual(validarSenha("abcdefgh"), null);
    assert.notEqual(validarSenha("12345678"), null);
    assert.notEqual(validarSenha(" abc12345"), null);
    assert.notEqual(validarSenha("abc12345 "), null);
  });

  it("recusa senha longa demais", () => {
    assert.notEqual(validarSenha(`a1${"x".repeat(70)}`), null);
  });

  it("recusa senha que contém o e-mail", () => {
    assert.notEqual(validarSenha("maria2024x", "maria@exemplo.com"), null);
    assert.equal(validarSenha("outraSenha9", "maria@exemplo.com"), null);
  });
});

describe("confirmação, gênero e termos", () => {
  it("confere a confirmação da senha", () => {
    assert.equal(validarConfirmacao("abc12345", "abc12345"), null);
    assert.notEqual(validarConfirmacao("abc12345", "abc12346"), null);
    assert.notEqual(validarConfirmacao("abc12345", ""), null);
  });

  it("aceita apenas gêneros da lista", () => {
    assert.equal(validarGenero("feminino"), null);
    assert.equal(validarGenero("nao-informar"), null);
    assert.notEqual(validarGenero(""), null);
    assert.notEqual(validarGenero("qualquer"), null);
  });

  it("exige o aceite dos termos", () => {
    assert.equal(validarTermos(true), null);
    assert.notEqual(validarTermos(false), null);
  });
});

describe("validarCadastro e validarLogin", () => {
  it("não retorna erros para um cadastro válido", () => {
    assert.deepEqual(validarCadastro(cadastroValido), {});
  });

  it("retorna um erro por campo inválido", () => {
    const erros = validarCadastro({
      nome: "",
      email: "ruim",
      genero: "",
      senha: "123",
      confirmacao: "456",
      aceitouTermos: false,
    });

    assert.deepEqual(Object.keys(erros).sort(), [
      "aceitouTermos",
      "confirmacao",
      "email",
      "genero",
      "nome",
      "senha",
    ]);
  });

  it("valida o login", () => {
    assert.deepEqual(validarLogin("maria@exemplo.com", "x"), {});
    assert.ok(validarLogin("ruim", "").email);
    assert.ok(validarLogin("ruim", "").senha);
  });
});

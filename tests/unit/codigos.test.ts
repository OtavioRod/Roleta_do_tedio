import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  formatarCodigoAmigo,
  gerarCodigo,
  idPar,
  normalizarCodigo,
} from "../../src/utils/codigos";

describe("códigos", () => {
  it("gera o tamanho pedido usando só letras e números sem ambiguidade", () => {
    for (let indice = 0; indice < 500; indice += 1) {
      assert.match(gerarCodigo(6), /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/);
    }
  });

  it("normaliza o que a pessoa digita", () => {
    assert.equal(normalizarCodigo(" ab-c 12! "), "ABC12");
  });

  it("formata o código de amigo com hífen só quando tem 8 caracteres", () => {
    assert.equal(formatarCodigoAmigo("ABCD2345"), "ABCD-2345");
    assert.equal(formatarCodigoAmigo("ABC123"), "ABC123");
  });

  it("o id da amizade é o mesmo nos dois sentidos (as regras do Firestore dependem disso)", () => {
    assert.equal(idPar("alice", "bob"), idPar("bob", "alice"));
    assert.equal(idPar("bob", "alice"), "alice_bob");
  });
});

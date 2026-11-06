import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { avaliarHorario, cabeNoTempo } from "../../src/utils/horarioFuncionamento";

// 3 de novembro de 2026 é terça-feira.
const terca = (hora: number, minuto = 0) => new Date(2026, 10, 3, hora, minuto);
const sabadoMadrugada = new Date(2026, 10, 7, 1, 0);

describe("avaliarHorario", () => {
  it("informa quando está aberto e em quanto tempo fecha", () => {
    const status = avaliarHorario("Mo-Fr 09:00-18:00", terca(10));

    assert.equal(status.estado, "aberto");
    assert.equal(status.fechaEmMinutos, 480);
    assert.equal(status.fechandoEmBreve, false);
  });

  it("avisa quando está perto de fechar", () => {
    const status = avaliarHorario("Mo-Fr 09:00-18:00", terca(17, 30));

    assert.equal(status.estado, "aberto");
    assert.equal(status.fechandoEmBreve, true);
  });

  it("informa quando abre de novo", () => {
    const status = avaliarHorario("Mo-Fr 09:00-18:00", terca(19));

    assert.equal(status.estado, "fechado");
    assert.match(status.texto, /abre amanhã às 09:00/);
  });

  it("entende horário que passa da meia-noite", () => {
    const status = avaliarHorario("Fr 18:00-02:00", sabadoMadrugada);

    assert.equal(status.estado, "aberto");
  });

  it("horário vazio ou ilegível vira desconhecido, nunca quebra", () => {
    assert.equal(avaliarHorario(undefined).estado, "desconhecido");
    assert.equal(avaliarHorario("").estado, "desconhecido");
    assert.equal(avaliarHorario("quando der vontade").estado, "desconhecido");
  });
});

describe("cabeNoTempo", () => {
  it("compara o tempo que falta para fechar com o tempo do grupo", () => {
    const quaseFechando = avaliarHorario("Mo-Fr 09:00-18:00", terca(17, 30));

    assert.equal(cabeNoTempo(quaseFechando, 20), true);
    assert.equal(cabeNoTempo(quaseFechando, 40), false);
  });

  it("sem informação de horário, não bloqueia o lugar", () => {
    assert.equal(cabeNoTempo(avaliarHorario(null), 120), true);
  });
});

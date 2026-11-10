import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { atividades } from "../../src/data/atividades";
import {
  apurarVotacao,
  criarSorteioDeterministico,
  escolherAtividadeDoGrupo,
  explicarResultado,
  MembroParaDecisao,
  ParticipanteGrupo,
  participantesDaRodada,
  sortearParaSala,
} from "../../src/utils/recomendacao";

const ana: ParticipanteGrupo = {
  nome: "Ana",
  humor: "tranquilo",
  gasto: "até 30",
  disposicao: "media",
  tempo: "30 minutos",
};

const bruno: ParticipanteGrupo = {
  nome: "Bruno",
  humor: "animado",
  gasto: "sem limite",
  disposicao: "alta",
  tempo: "2 horas",
};

function sorteioFixo(valores: number[]) {
  let indice = 0;

  return () => valores[indice++ % valores.length];
}

const porId = (id: string) => atividades.find((item) => item.id === id)!;

describe("escolherAtividadeDoGrupo", () => {
  it("nunca passa do menor orçamento do grupo", () => {
    const semDinheiro = { ...bruno, gasto: "R$ 0" as const };

    for (let indice = 0; indice < 200; indice += 1) {
      const { atividade, semFiltro } = escolherAtividadeDoGrupo(
        [ana, semDinheiro],
        criarSorteioDeterministico(`gasto-${indice}`),
      );

      assert.equal(semFiltro, false);
      assert.ok(
        atividade.gasto.includes("nada"),
        `${atividade.id} exige gasto, mas alguém tem R$ 0`,
      );
    }
  });

  it("respeita o menor tempo disponível", () => {
    for (let indice = 0; indice < 200; indice += 1) {
      const { atividade } = escolherAtividadeDoGrupo(
        [ana, bruno],
        criarSorteioDeterministico(`tempo-${indice}`),
      );

      assert.ok(
        atividade.tempoMinimo <= 30,
        `${atividade.id} pede ${atividade.tempoMinimo} min e o grupo só tem 30`,
      );
    }
  });

  it("avisa quando nada combina (semFiltro)", () => {
    const apertado: ParticipanteGrupo = {
      nome: "Caio",
      humor: "preguiça",
      gasto: "R$ 0",
      disposicao: "baixa",
      tempo: "30 minutos",
    };

    const { semFiltro } = escolherAtividadeDoGrupo([apertado], () => 0, [
      "cafe",
      "jogar",
      "filme-casa",
    ]);

    assert.equal(semFiltro, true);
  });

  it("nunca devolve uma atividade excluída quando há alternativas", () => {
    for (let indice = 0; indice < 100; indice += 1) {
      const { atividade } = escolherAtividadeDoGrupo(
        [ana],
        criarSorteioDeterministico(`excluir-${indice}`),
        ["cafe", "parque"],
      );

      assert.notEqual(atividade.id, "cafe");
      assert.notEqual(atividade.id, "parque");
    }
  });

  it("se tudo for excluído, volta a usar todas as atividades", () => {
    const todas = atividades.map((item) => item.id);

    const { atividade } = escolherAtividadeDoGrupo([ana], () => 0, todas);

    assert.ok(atividades.some((item) => item.id === atividade.id));
  });

  it("quem está com fome empurra restaurante quando ele é possível", () => {
    const comFome: ParticipanteGrupo = {
      nome: "Dani",
      humor: "fome",
      gasto: "sem limite",
      disposicao: "media",
      tempo: "3 horas ou mais",
    };

    const { atividade } = escolherAtividadeDoGrupo([comFome], () => 0.5);

    assert.equal(atividade.id, "restaurante");
  });
});

describe("sorteio determinístico (resultado igual para todos da sala)", () => {
  it("a mesma semente gera a mesma sequência", () => {
    const a = criarSorteioDeterministico("ABC123-1-1");
    const b = criarSorteioDeterministico("ABC123-1-1");

    for (let indice = 0; indice < 20; indice += 1) {
      assert.equal(a(), b());
    }
  });

  it("os valores ficam entre 0 e 1", () => {
    const sorteio = criarSorteioDeterministico("limites");

    for (let indice = 0; indice < 1000; indice += 1) {
      const valor = sorteio();

      assert.ok(valor >= 0 && valor < 1);
    }
  });

  it("[regressão] sala, rodada e tentativa iguais dão a mesma atividade em qualquer aparelho", () => {
    const primeiro = sortearParaSala("ZXCV12", 3, 2, [ana, bruno], ["cafe"]);
    const segundo = sortearParaSala("ZXCV12", 3, 2, [bruno, ana].reverse(), [
      "cafe",
    ]);

    assert.equal(primeiro.atividade.id, segundo.atividade.id);
    assert.equal(primeiro.semFiltro, segundo.semFiltro);
  });
});

describe("participantesDaRodada", () => {
  const membro = (
    uid: string,
    rodada: number,
    tempo = "1 hora",
  ): MembroParaDecisao => ({
    uid,
    rodada,
    nome: uid,
    respostas: {
      humor: "tranquilo",
      gasto: "até 30",
      disposicao: "media",
      tempo: tempo as ParticipanteGrupo["tempo"],
    },
    votoTentativa: 0,
    votoValor: null,
  });

  it("ignora respostas de outras rodadas e quem ainda não respondeu", () => {
    const lista = participantesDaRodada(
      [membro("b", 2), membro("a", 1), { ...membro("c", 2), respostas: null }],
      2,
    );

    assert.deepEqual(
      lista.map((item) => item.nome),
      ["b"],
    );
  });

  it("ordena por uid para que todos calculem na mesma ordem", () => {
    const lista = participantesDaRodada(
      [membro("z", 1), membro("m", 1), membro("a", 1)],
      1,
    );

    assert.deepEqual(
      lista.map((item) => item.nome),
      ["a", "m", "z"],
    );
  });
});

describe("apurarVotacao", () => {
  const voto = (
    uid: string,
    valor: "topo" | "nao" | null,
    tentativa = 1,
  ): MembroParaDecisao => ({
    uid,
    rodada: 1,
    nome: uid,
    respostas: null,
    votoTentativa: valor ? tentativa : 0,
    votoValor: valor,
  });

  it("espera todo mundo votar", () => {
    assert.equal(
      apurarVotacao([voto("a", "topo"), voto("b", null)], 1),
      "aguardando",
    );
  });

  it("confirma só com mais da metade", () => {
    assert.equal(
      apurarVotacao(
        [voto("a", "topo"), voto("b", "topo"), voto("c", "nao")],
        1,
      ),
      "confirmar",
    );
  });

  it("empate gira de novo (num casal, os dois precisam topar)", () => {
    assert.equal(
      apurarVotacao([voto("a", "topo"), voto("b", "nao")], 1),
      "girar-de-novo",
    );
    assert.equal(
      apurarVotacao([voto("a", "topo"), voto("b", "topo")], 1),
      "confirmar",
    );
  });

  it("voto de uma tentativa antiga não vale na atual", () => {
    assert.equal(
      apurarVotacao([voto("a", "topo", 1), voto("b", "topo", 1)], 2),
      "aguardando",
    );
  });
});

describe("explicarResultado", () => {
  it("diz quem limita o tempo e o orçamento", () => {
    const linhas = explicarResultado([ana, bruno], porId("cafe"), false).join(
      " ",
    );

    assert.match(linhas, /30 min \(Ana\)/);
    assert.match(linhas, /Ana/);
  });

  it("modo discreto não revela nomes", () => {
    const linhas = explicarResultado(
      [ana, bruno],
      porId("cafe"),
      false,
      true,
    ).join(" ");

    assert.ok(!linhas.includes("Ana"));
    assert.ok(!linhas.includes("Bruno"));
  });

  it("explica quando a roleta improvisou", () => {
    const linhas = explicarResultado([ana], porId("cafe"), true);

    assert.equal(linhas.length, 1);
    assert.match(linhas[0], /improvisou/);
  });

  it("não quebra sem participantes", () => {
    assert.deepEqual(explicarResultado([], porId("cafe"), false), []);
  });
});

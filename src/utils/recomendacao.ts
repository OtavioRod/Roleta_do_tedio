import {
    Disposicao,
    GastoOpcao,
    Humor,
    OPCOES_GASTO,
    OPCOES_TEMPO,
    TempoOpcao,
} from "../constants/opcoesRoleta";
import { Atividade, atividades, Gasto } from "../data/atividades";

export type ParticipanteGrupo = {
  nome: string;
  humor: Humor;
  gasto: GastoOpcao;
  disposicao: Disposicao;
  tempo: TempoOpcao;
};

function converterGasto(gasto: GastoOpcao): Gasto | null {
  return OPCOES_GASTO.find((opcao) => opcao.valor === gasto)?.categoria ?? null;
}

function converterTempo(tempo: TempoOpcao) {
  return OPCOES_TEMPO.find((opcao) => opcao.valor === tempo)?.minutos ?? 0;
}

function menorTempo(participantes: ParticipanteGrupo[]) {
  let menor = 999;

  for (const participante of participantes) {
    const tempo = converterTempo(participante.tempo);

    if (tempo < menor) {
      menor = tempo;
    }
  }

  return menor;
}

function podeSerEscolhida(
  atividade: Atividade,
  participantes: ParticipanteGrupo[],
) {
  const tempo = menorTempo(participantes);

  for (const participante of participantes) {
    const gasto = converterGasto(participante.gasto);

    if (gasto === null || !atividade.gasto.includes(gasto)) {
      return false;
    }

    if (
      !atividade.disposicao.includes(
        participante.disposicao as Atividade["disposicao"][number],
      )
    ) {
      return false;
    }
  }

  return tempo >= atividade.tempoMinimo;
}

function pontuar(atividade: Atividade, participantes: ParticipanteGrupo[]) {
  let pontos = 0;

  const tempo = menorTempo(participantes);

  if (tempo >= atividade.tempoMinimo && tempo <= atividade.tempoMaximo) {
    pontos += 4;
  } else if (tempo >= atividade.tempoMinimo) {
    pontos += 2;
  }

  for (const participante of participantes) {
    const gasto = converterGasto(participante.gasto);

    if (gasto !== null && atividade.gasto.includes(gasto)) {
      pontos += 2;
    }

    if (
      atividade.disposicao.includes(
        participante.disposicao as Atividade["disposicao"][number],
      )
    ) {
      pontos += 2;
    }

    if (
      participante.humor === "preguiça" &&
      atividade.disposicao.includes("baixa")
    ) {
      pontos += 2;
    }

    if (
      participante.humor === "animado" &&
      atividade.disposicao.includes("alta")
    ) {
      pontos += 2;
    }

    if (participante.humor === "fome" && atividade.id === "restaurante") {
      pontos += 4;
    }

    if (participante.humor === "fome" && atividade.id === "cafe") {
      pontos += 2;
    }

    if (
      participante.humor === "tranquilo" &&
      atividade.disposicao.includes("baixa")
    ) {
      pontos += 2;
    }

    if (participante.humor === "tanto faz") {
      pontos += 1;
    }
  }

  return pontos;
}

export function escolherAtividadeDoGrupo(
  participantes: ParticipanteGrupo[],
  sorteio: () => number = Math.random,
): { atividade: Atividade; semFiltro: boolean } {
  const validas = atividades.filter((atividade) =>
    podeSerEscolhida(atividade, participantes),
  );

  if (validas.length === 0) {
    return {
      atividade: atividades[Math.floor(sorteio() * atividades.length)],
      semFiltro: true,
    };
  }

  let maiorPontuacao = -1;
  let melhores: Atividade[] = [];

  for (const atividade of validas) {
    const pontuacao = pontuar(atividade, participantes);

    if (pontuacao > maiorPontuacao) {
      maiorPontuacao = pontuacao;
      melhores = [atividade];
    } else if (pontuacao === maiorPontuacao) {
      melhores.push(atividade);
    }
  }

  return {
    atividade: melhores[Math.floor(sorteio() * melhores.length)],
    semFiltro: false,
  };
}

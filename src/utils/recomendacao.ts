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
  excluirIds: string[] = [],
): { atividade: Atividade; semFiltro: boolean } {
  const permitidas = atividades.filter(
    (atividade) => !excluirIds.includes(atividade.id),
  );

  const base = permitidas.length > 0 ? permitidas : atividades;

  const validas = base.filter((atividade) =>
    podeSerEscolhida(atividade, participantes),
  );

  if (validas.length === 0) {
    return {
      atividade: base[Math.floor(sorteio() * base.length)],
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

export function criarSorteioDeterministico(semente: string): () => number {
  let estado = 1779033703 ^ semente.length;

  for (let indice = 0; indice < semente.length; indice += 1) {
    estado = Math.imul(estado ^ semente.charCodeAt(indice), 3432918353);
    estado = (estado << 13) | (estado >>> 19);
  }

  return () => {
    estado = Math.imul(estado ^ (estado >>> 16), 2246822507);
    estado = Math.imul(estado ^ (estado >>> 13), 3266489909);
    estado ^= estado >>> 16;

    return (estado >>> 0) / 4294967296;
  };
}

const ORDEM_DISPOSICAO: Disposicao[] = ["baixa", "media", "alta"];

const ROTULO_DISPOSICAO: Record<Disposicao, string> = {
  baixa: "pouca disposição",
  media: "disposição média",
  alta: "muita disposição",
};

function juntarNomes(nomes: string[]) {
  if (nomes.length <= 1) {
    return nomes[0] ?? "";
  }

  return `${nomes.slice(0, -1).join(", ")} e ${nomes[nomes.length - 1]}`;
}

export function explicarResultado(
  participantes: ParticipanteGrupo[],
  atividade: Atividade,
  semFiltro: boolean,
  ocultarNomes = false,
): string[] {
  if (participantes.length === 0) {
    return [];
  }

  if (semFiltro) {
    return [
      "Nenhuma atividade combinou com todas as respostas ao mesmo tempo, então a roleta improvisou.",
    ];
  }

  const quem = (nomes: string[]) =>
    ocultarNomes || participantes.length === 1
      ? ""
      : ` (${juntarNomes(nomes)})`;

  const linhas: string[] = [];

  const indicesGasto = participantes.map((participante) =>
    OPCOES_GASTO.findIndex((opcao) => opcao.valor === participante.gasto),
  );

  const menorIndiceGasto = Math.min(...indicesGasto);

  const limitantesGasto = participantes
    .filter((_, indice) => indicesGasto[indice] === menorIndiceGasto)
    .map((participante) => participante.nome);

  const rotuloGasto = OPCOES_GASTO[menorIndiceGasto]?.rotulo ?? "";

  const todosNoMesmoGasto = limitantesGasto.length === participantes.length;

  linhas.push(
    todosNoMesmoGasto && participantes.length > 1
      ? `Todos topam gastar ${rotuloGasto.toLowerCase()} e "${atividade.nome}" cabe nesse orçamento.`
      : `O menor orçamento do grupo é ${rotuloGasto.toLowerCase()}${quem(limitantesGasto)} e "${atividade.nome}" cabe nele.`,
  );

  const minutos = participantes.map((participante) =>
    converterTempo(participante.tempo),
  );

  const menorMinutos = Math.min(...minutos);

  const limitantesTempo = participantes
    .filter((_, indice) => minutos[indice] === menorMinutos)
    .map((participante) => participante.nome);

  linhas.push(
    `O menor tempo disponível é ${menorMinutos} min${quem(limitantesTempo)}; a atividade pede pelo menos ${atividade.tempoMinimo} min.`,
  );

  const indicesDisposicao = participantes.map((participante) =>
    ORDEM_DISPOSICAO.indexOf(participante.disposicao),
  );

  const menorIndiceDisposicao = Math.min(...indicesDisposicao);

  const limitantesDisposicao = participantes
    .filter((_, indice) => indicesDisposicao[indice] === menorIndiceDisposicao)
    .map((participante) => participante.nome);

  linhas.push(
    `Quem tem menos energia está com ${ROTULO_DISPOSICAO[ORDEM_DISPOSICAO[menorIndiceDisposicao]]}${quem(limitantesDisposicao)}, e isso combina com a atividade.`,
  );

  const comFome = participantes.some(
    (participante) => participante.humor === "fome",
  );

  const animados = participantes.some(
    (participante) => participante.humor === "animado",
  );

  if (comFome && (atividade.id === "restaurante" || atividade.id === "cafe")) {
    linhas.push("Tem gente com fome no grupo, o que deu um empurrão extra.");
  } else if (animados && atividade.disposicao.includes("alta")) {
    linhas.push(
      "Tem gente animada no grupo, o que favoreceu uma atividade mais agitada.",
    );
  }

  return linhas;
}

export type MembroParaDecisao = {
  uid: string;
  rodada: number;
  respostas: Omit<ParticipanteGrupo, "nome"> | null;
  nome: string;
  votoTentativa: number;
  votoValor: "topo" | "nao" | null;
};

export function participantesDaRodada(
  membros: MembroParaDecisao[],
  rodada: number,
): ParticipanteGrupo[] {
  return [...membros]
    .filter((membro) => membro.respostas !== null && membro.rodada === rodada)
    .sort((a, b) => (a.uid < b.uid ? -1 : 1))
    .map((membro) => ({ nome: membro.nome, ...membro.respostas! }));
}

export function sortearParaSala(
  codigo: string,
  rodada: number,
  tentativa: number,
  participantes: ParticipanteGrupo[],
  excluirIds: string[],
) {
  return escolherAtividadeDoGrupo(
    participantes,
    criarSorteioDeterministico(`${codigo}-${rodada}-${tentativa}`),
    excluirIds,
  );
}

export function apurarVotacao(
  membros: MembroParaDecisao[],
  tentativa: number,
): "aguardando" | "confirmar" | "girar-de-novo" {
  if (membros.length === 0) {
    return "aguardando";
  }

  const todosVotaram = membros.every(
    (membro) => membro.votoValor !== null && membro.votoTentativa === tentativa,
  );

  if (!todosVotaram) {
    return "aguardando";
  }

  const topo = membros.filter((membro) => membro.votoValor === "topo").length;

  return topo * 2 > membros.length ? "confirmar" : "girar-de-novo";
}

// Espelho de src/utils/recomendacao.ts. A conta precisa ser idêntica à do app,
// porque o app usa o mesmo sorteio como reserva se o servidor demorar.
const { atividades, OPCOES_GASTO, OPCOES_TEMPO } = require("./dados");

function criarSorteioDeterministico(semente) {
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

function converterGasto(gasto) {
  const opcao = OPCOES_GASTO.find((item) => item.valor === gasto);

  return opcao ? opcao.categoria : null;
}

function converterTempo(tempo) {
  const opcao = OPCOES_TEMPO.find((item) => item.valor === tempo);

  return opcao ? opcao.minutos : 0;
}

function menorTempo(participantes) {
  let menor = 999;

  for (const participante of participantes) {
    const tempo = converterTempo(participante.tempo);

    if (tempo < menor) {
      menor = tempo;
    }
  }

  return menor;
}

function podeSerEscolhida(atividade, participantes) {
  const tempo = menorTempo(participantes);

  for (const participante of participantes) {
    const gasto = converterGasto(participante.gasto);

    if (gasto === null || !atividade.gasto.includes(gasto)) {
      return false;
    }

    if (!atividade.disposicao.includes(participante.disposicao)) {
      return false;
    }
  }

  return tempo >= atividade.tempoMinimo;
}

function pontuar(atividade, participantes) {
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

    if (atividade.disposicao.includes(participante.disposicao)) {
      pontos += 2;
    }

    if (participante.humor === "preguiça" && atividade.disposicao.includes("baixa")) {
      pontos += 2;
    }

    if (participante.humor === "animado" && atividade.disposicao.includes("alta")) {
      pontos += 2;
    }

    if (participante.humor === "fome" && atividade.id === "restaurante") {
      pontos += 4;
    }

    if (participante.humor === "fome" && atividade.id === "cafe") {
      pontos += 2;
    }

    if (participante.humor === "tranquilo" && atividade.disposicao.includes("baixa")) {
      pontos += 2;
    }

    if (participante.humor === "tanto faz") {
      pontos += 1;
    }
  }

  return pontos;
}

function escolherAtividadeDoGrupo(participantes, sorteio = Math.random, excluirIds = []) {
  const permitidas = atividades.filter((atividade) => !excluirIds.includes(atividade.id));

  const base = permitidas.length > 0 ? permitidas : atividades;

  const validas = base.filter((atividade) => podeSerEscolhida(atividade, participantes));

  if (validas.length === 0) {
    return {
      atividade: base[Math.floor(sorteio() * base.length)],
      semFiltro: true,
    };
  }

  let maiorPontuacao = -1;
  let melhores = [];

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

function participantesDaRodada(membros, rodada) {
  return [...membros]
    .filter((membro) => membro.respostas && membro.rodada === rodada)
    .sort((a, b) => (a.uid < b.uid ? -1 : 1))
    .map((membro) => ({ nome: membro.nome, ...membro.respostas }));
}

function sortearParaSala(codigo, rodada, tentativa, participantes, excluirIds) {
  return escolherAtividadeDoGrupo(
    participantes,
    criarSorteioDeterministico(`${codigo}-${rodada}-${tentativa}`),
    excluirIds,
  );
}

function apurarVotacao(membros, tentativa) {
  if (membros.length === 0) {
    return "aguardando";
  }

  const todosVotaram = membros.every(
    (membro) => membro.voto && membro.voto.tentativa === tentativa && (membro.voto.valor === "topo" || membro.voto.valor === "nao"),
  );

  if (!todosVotaram) {
    return "aguardando";
  }

  const topo = membros.filter((membro) => membro.voto.valor === "topo").length;

  return topo * 2 > membros.length ? "confirmar" : "girar-de-novo";
}

module.exports = {
  criarSorteioDeterministico,
  escolherAtividadeDoGrupo,
  participantesDaRodada,
  sortearParaSala,
  apurarVotacao,
};

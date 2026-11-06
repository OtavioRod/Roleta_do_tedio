const admin = require("firebase-admin");
const { setGlobalOptions } = require("firebase-functions/v2");
const {
  onDocumentCreated,
  onDocumentUpdated,
  onDocumentWritten,
} = require("firebase-functions/v2/firestore");
const { onSchedule } = require("firebase-functions/v2/scheduler");

const { enviarPush } = require("./lib/push");
const {
  apurarVotacao,
  participantesDaRodada,
  sortearParaSala,
} = require("./lib/recomendacao");

admin.initializeApp();

const REGIAO = process.env.REGIAO_FUNCOES || "us-central1";

setGlobalOptions({ region: REGIAO, maxInstances: 10 });

const db = admin.firestore();

function igual(a, b) {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}

// ---------------------------------------------------------------------------
// Convites e amizades
// ---------------------------------------------------------------------------

exports.aoCriarConvite = onDocumentCreated("convites/{id}", async (evento) => {
  const convite = evento.data && evento.data.data();

  if (!convite || convite.estado !== "pendente") {
    return;
  }

  await enviarPush([convite.para], {
    titulo: `${convite.deNome} chamou você`,
    corpo: `Sala ${convite.salaCodigo} da Roleta do Tédio`,
    dados: { tipo: "convite", salaCodigo: convite.salaCodigo },
  });
});

exports.aoMudarAmizade = onDocumentWritten("amizades/{par}", async (evento) => {
  const antes = evento.data.before.exists ? evento.data.before.data() : null;
  const depois = evento.data.after.exists ? evento.data.after.data() : null;

  if (!depois) {
    return;
  }

  const nomes = depois.nomes || {};

  if (!antes && depois.estado === "pendente") {
    const destino = depois.membros.find((uid) => uid !== depois.solicitante);

    await enviarPush([destino], {
      titulo: `${nomes[depois.solicitante] || "Alguém"} quer ser seu amigo`,
      corpo: "Abra Salas online > Gerenciar amigos para aceitar.",
      dados: { tipo: "amizade" },
    });

    return;
  }

  if (antes && antes.estado === "pendente" && depois.estado === "aceita") {
    const aceitou = depois.membros.find((uid) => uid !== depois.solicitante);

    await enviarPush([depois.solicitante], {
      titulo: `${nomes[aceitou] || "Seu amigo"} aceitou seu pedido`,
      corpo: "Agora vocês podem se chamar para as salas.",
      dados: { tipo: "amizade" },
    });
  }
});

// ---------------------------------------------------------------------------
// Avisos da sala
// ---------------------------------------------------------------------------

exports.aoMudarSala = onDocumentUpdated("salas/{codigo}", async (evento) => {
  const antes = evento.data.before.data();
  const depois = evento.data.after.data();
  const codigo = evento.params.codigo;

  const dados = { tipo: "sala", salaCodigo: codigo };

  const membros = depois.membrosUids || [];
  const outros = membros.filter((uid) => uid !== depois.donoUid);

  if (antes.estado !== depois.estado) {
    if (depois.estado === "respondendo") {
      await enviarPush(outros, {
        titulo: "A rodada começou!",
        corpo: "Responda às perguntas para a roleta decidir.",
        dados,
      });
    }

    if (depois.estado === "resultado") {
      await enviarPush(membros, {
        titulo: "A roleta decidiu!",
        corpo: "Abra o app para ver o que saiu.",
        dados,
      });
    }

    if (depois.estado === "encerrada") {
      await enviarPush(outros, {
        titulo: "A sala foi encerrada",
        corpo: `${depois.donoNome} encerrou a sala ${codigo}.`,
        dados,
      });
    }
  } else if (
    depois.estado === "resultado" &&
    Number(depois.tentativa || 0) > Number(antes.tentativa || 0)
  ) {
    await enviarPush(membros, {
      titulo: "O grupo pediu outro giro!",
      corpo: "A roleta decidiu de novo. Abra para ver.",
      dados,
    });
  }

  if (!antes.confirmada && depois.confirmada && depois.resultado) {
    await enviarPush(membros, {
      titulo: "Topamos!",
      corpo: depois.resultado.atividadeNome,
      dados,
    });
  }

  const antigos = antes.membrosUids || [];

  const novos = membros.filter((uid) => !antigos.includes(uid));

  if (novos.length > 0 && depois.estado === "aguardando") {
    const documento = await db
      .collection("salas")
      .doc(codigo)
      .collection("membros")
      .doc(novos[0])
      .get();

    await enviarPush([depois.donoUid], {
      titulo: `${documento.get("nome") || "Alguém"} entrou na sala`,
      corpo: `${membros.length} de ${depois.limite} pessoas na sala.`,
      dados,
    });
  }

  if (antes.donoUid !== depois.donoUid) {
    await enviarPush([depois.donoUid], {
      titulo: "Você agora é o dono da sala",
      corpo: "O comando da sala passou para você.",
      dados,
    });
  }
});

// ---------------------------------------------------------------------------
// Resultado e votação calculados no servidor
// ---------------------------------------------------------------------------

exports.aoMudarMembro = onDocumentWritten(
  "salas/{codigo}/membros/{uid}",
  async (evento) => {
    const antes = evento.data.before.exists ? evento.data.before.data() : null;
    const depois = evento.data.after.exists ? evento.data.after.data() : null;

    // Presença e progresso não mudam o resultado: não faz nada.
    if (
      !depois ||
      (antes && igual(antes.respostas, depois.respostas) && igual(antes.voto, depois.voto) && antes.rodada === depois.rodada)
    ) {
      return;
    }

    const referencia = db.collection("salas").doc(evento.params.codigo);

    await db.runTransaction(async (transacao) => {
      const instantaneo = await transacao.get(referencia);

      if (!instantaneo.exists) {
        return;
      }

      const sala = instantaneo.data();

      const membrosSnap = await transacao.get(referencia.collection("membros"));

      const membros = membrosSnap.docs
        .filter((documento) => (sala.membrosUids || []).includes(documento.id))
        .map((documento) => ({ uid: documento.id, ...documento.data() }));

      if (membros.length === 0 || membros.length !== (sala.membrosUids || []).length) {
        return;
      }

      const ultima = sala.ultimaAtividadeId ? [sala.ultimaAtividadeId] : [];

      if (sala.estado === "respondendo") {
        const participantes = participantesDaRodada(membros, sala.rodada);

        if (participantes.length !== membros.length) {
          return;
        }

        const { atividade, semFiltro } = sortearParaSala(
          evento.params.codigo,
          sala.rodada,
          1,
          participantes,
          ultima,
        );

        transacao.update(referencia, {
          estado: "resultado",
          tentativa: 1,
          resultado: {
            atividadeId: atividade.id,
            atividadeNome: atividade.nome,
            semFiltro,
            tentativa: 1,
          },
        });

        return;
      }

      if (
        sala.estado === "resultado" &&
        sala.confirmada !== true &&
        Number(sala.tentativa) >= 1 &&
        sala.resultado
      ) {
        const tentativa = Number(sala.tentativa);

        const decisao = apurarVotacao(membros, tentativa);

        if (decisao === "confirmar") {
          transacao.update(referencia, {
            confirmada: true,
            ultimaAtividadeId: sala.resultado.atividadeId,
            historico: [
              ...(sala.historico || []),
              {
                rodada: sala.rodada,
                atividadeId: sala.resultado.atividadeId,
                atividadeNome: sala.resultado.atividadeNome,
              },
            ].slice(-10),
          });
        }

        if (decisao === "girar-de-novo") {
          const vetadas = [...(sala.vetadas || []), sala.resultado.atividadeId];

          const { atividade, semFiltro } = sortearParaSala(
            evento.params.codigo,
            sala.rodada,
            tentativa + 1,
            participantesDaRodada(membros, sala.rodada),
            [...vetadas, ...ultima],
          );

          transacao.update(referencia, {
            tentativa: tentativa + 1,
            vetadas,
            resultado: {
              atividadeId: atividade.id,
              atividadeNome: atividade.nome,
              semFiltro,
              tentativa: tentativa + 1,
            },
          });
        }
      }
    });
  },
);

// ---------------------------------------------------------------------------
// Limpeza automática
// ---------------------------------------------------------------------------

exports.limpezaDiaria = onSchedule(
  { schedule: "every day 04:00", timeZone: "America/Sao_Paulo" },
  async () => {
    const agora = Date.now();

    const salasAntigas = await db
      .collection("salas")
      .where("criadaEm", "<", admin.firestore.Timestamp.fromMillis(agora - 2 * 24 * 60 * 60 * 1000))
      .limit(200)
      .get();

    for (const documento of salasAntigas.docs) {
      await db.recursiveDelete(documento.ref);
    }

    const convitesAntigos = await db
      .collection("convites")
      .where("criadoEm", "<", admin.firestore.Timestamp.fromMillis(agora - 24 * 60 * 60 * 1000))
      .limit(400)
      .get();

    const lote = db.batch();

    convitesAntigos.docs.forEach((documento) => lote.delete(documento.ref));

    await lote.commit();

    console.log(
      `Limpeza: ${salasAntigas.size} salas e ${convitesAntigos.size} convites apagados.`,
    );
  },
);

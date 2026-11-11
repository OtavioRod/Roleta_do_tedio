import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import Botao from "../../components/Botao";
import ContagemPrazo from "../../components/ContagemPrazo";
import ConviteSala from "../../components/ConviteSala";
import EscolhaLocalGrupo from "../../components/EscolhaLocalGrupo";
import ExplicacaoResultado from "../../components/ExplicacaoResultado";
import { estiloPainel } from "../../components/Painel";
import PerguntasRoleta from "../../components/PerguntasRoleta";
import RoletaAtividades from "../../components/RoletaAtividades";
import Texto from "../../components/Texto";
import VotacaoResultado from "../../components/VotacaoResultado";
import { usePreferencias } from "../../context/PreferenciasContext";
import { useSessao } from "../../context/SessaoContext";
import { atividades } from "../../data/atividades";
import { Amizade, observarAmizades } from "../../services/amigos";
import { enviarConvite } from "../../services/convites";
import { anunciar, notificar } from "../../services/notificar";
import { TipoLocal } from "../../services/overpass";
import { definirSalaAberta } from "../../services/permissoes";
import {
  criarSala as _criarSalaNaoUsada,
  confirmarResultado,
  definirDiscreto,
  definirResultado,
  entrarNaSala,
  enviarProgresso,
  enviarRespostas,
  girarDeNovo,
  iniciarRodada,
  MembroSala,
  observarMembros,
  observarSala,
  registrarPresenca,
  removerParticipante,
  Respostas,
  sairDaSala,
  Sala,
  votarNoResultado,
} from "../../services/salas";
import { tocarSom } from "../../services/sons";
import { normalizarCodigo } from "../../utils/codigos";
import { compartilharTexto } from "../../utils/compartilhar";
import { mensagemErroSocial } from "../../utils/mensagensSociais";
import {
  apurarVotacao,
  criarSorteioDeterministico,
  MembroParaDecisao,
  ParticipanteGrupo,
  participantesDaRodada,
  sortearParaSala,
} from "../../utils/recomendacao";

void _criarSalaNaoUsada;

const TIPO_LOCAL_POR_ATIVIDADE: Partial<Record<string, TipoLocal>> = {
  restaurante: "restaurante",
  cafe: "cafe",
  cinema: "cinema",
  parque: "parque",
  passeio: "passeio",
};

const LIMITE_AUSENTE_MS = 90000;

type StatusPresenca = "online" | "ausente" | "conectando";

const ROTULO_PRESENCA: Record<StatusPresenca, string> = {
  online: "online",
  ausente: "sem conexão",
  conectando: "conectando...",
};

function statusDe(membro: MembroSala, agora: number): StatusPresenca {
  if (membro.visto === 0) {
    return "conectando";
  }

  return agora - membro.visto < LIMITE_AUSENTE_MS ? "online" : "ausente";
}

function paraDecisao(membros: MembroSala[]): MembroParaDecisao[] {
  return membros.map((membro) => ({
    uid: membro.uid,
    rodada: membro.rodada,
    respostas: membro.respostas,
    nome: membro.nome,
    votoTentativa: membro.voto?.tentativa ?? 0,
    votoValor: membro.voto?.valor ?? null,
  }));
}

export default function TelaSala() {
  const router = useRouter();

  const { cores } = usePreferencias();

  const { usuario, perfil } = useSessao();

  const { codigo: codigoParametro } = useLocalSearchParams<{
    codigo: string;
  }>();

  const codigo = normalizarCodigo(String(codigoParametro ?? ""));

  const uid = usuario?.uid ?? "";

  const nome = perfil?.nome || usuario?.displayName || "Pessoa";

  const [sala, setSala] = useState<Sala | null | undefined>(undefined);
  const [membros, setMembros] = useState<MembroSala[]>([]);
  const [amizades, setAmizades] = useState<Amizade[]>([]);
  const [convidados, setConvidados] = useState<Record<string, string>>({});
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);

  const [girando, setGirando] = useState(false);

  const [agora, setAgora] = useState(Date.now());

  const acaoResultado = useRef("");
  const acaoVotacao = useRef("");
  const estadoAnterior = useRef<string | null>(null);
  const tentativaAnterior = useRef(0);
  const confirmadaAnterior = useRef(false);
  const donoAnterior = useRef<string | null>(null);
  const membrosVistos = useRef<Map<string, string> | null>(null);
  const statusAnteriores = useRef<Map<string, StatusPresenca> | null>(null);
  const prontosVistos = useRef<Set<string> | null>(null);
  const progressoVisto = useRef<Map<string, number>>(new Map());

  const souMembro = Boolean(sala && sala.membrosUids.includes(uid));
  const souDono = Boolean(sala && sala.donoUid === uid);

  useEffect(() => {
    if (!codigo) {
      return undefined;
    }

    return observarSala(codigo, setSala, (falha) => {
      setSala(null);
      setErro(mensagemErroSocial(falha));
    });
  }, [codigo]);

  useEffect(() => {
    if (!codigo || !souMembro) {
      setMembros([]);

      return undefined;
    }

    return observarMembros(codigo, setMembros, (falha) =>
      setErro(mensagemErroSocial(falha)),
    );
  }, [codigo, souMembro]);

  useEffect(() => {
    if (!uid) {
      return undefined;
    }

    return observarAmizades(uid, setAmizades);
  }, [uid]);

  useEffect(() => {
    const intervalo = setInterval(() => setAgora(Date.now()), 5000);

    return () => clearInterval(intervalo);
  }, []);

  useEffect(() => {
    if (!codigo) {
      return undefined;
    }

    definirSalaAberta(codigo);

    return () => definirSalaAberta(null);
  }, [codigo]);

  useEffect(() => {
    if (!codigo || !uid || !souMembro) {
      return undefined;
    }

    registrarPresenca(codigo, uid).catch(() => undefined);

    const intervalo = setInterval(() => {
      registrarPresenca(codigo, uid).catch(() => undefined);
    }, 25000);

    return () => clearInterval(intervalo);
  }, [codigo, uid, souMembro]);

  useEffect(() => {
    if (!sala) {
      return;
    }

    const anterior = estadoAnterior.current;
    const tentativaAntes = tentativaAnterior.current;
    const confirmadaAntes = confirmadaAnterior.current;

    estadoAnterior.current = sala.estado;
    tentativaAnterior.current = sala.tentativa;
    confirmadaAnterior.current = sala.confirmada;

    if (anterior === null) {
      return;
    }

    if (anterior !== sala.estado) {
      if (sala.estado === "respondendo") {
        setGirando(false);

        if (!souDono) {
          notificar({
            titulo: "A rodada começou!",
            texto: "Responda às perguntas para a roleta decidir.",
            som: "convite",
          });
        }
      }

      if (sala.estado === "resultado") {
        setGirando(true);

        notificar({
          titulo: "A roleta vai girar!",
          texto: "Volte ao app para ver a atividade escolhida.",
          som: "nenhum",
          quando: "segundoPlano",
        });
      }

      if (sala.estado === "encerrada" && !souDono) {
        notificar({
          titulo: "A sala foi encerrada",
          texto: `${sala.donoNome} encerrou a sala ${sala.codigo}.`,
          som: "notificacao",
        });
      }
    } else if (
      sala.estado === "resultado" &&
      tentativaAntes > 0 &&
      sala.tentativa > tentativaAntes
    ) {
      setGirando(true);

      notificar({
        titulo: "O grupo pediu outro giro!",
        texto: "A roleta vai girar de novo sem a atividade recusada.",
        som: "nenhum",
        quando: "segundoPlano",
      });
    }

    if (!confirmadaAntes && sala.confirmada && sala.resultado) {
      notificar({
        titulo: "Topamos!",
        texto: sala.resultado.atividadeNome,
        som: "resultado",
        quando: "segundoPlano",
      });
    }
  }, [sala?.estado, sala?.tentativa, sala?.confirmada]);

  useEffect(() => {
    if (!sala) {
      return;
    }

    const antes = donoAnterior.current;

    donoAnterior.current = sala.donoUid;

    if (antes !== null && antes !== sala.donoUid && sala.donoUid === uid) {
      notificar({
        titulo: "Você agora é o dono da sala",
        texto: "O comando da sala passou para você.",
        som: "convite",
      });
    }
  }, [sala, uid]);

  useEffect(() => {
    if (!sala || !souMembro) {
      membrosVistos.current = null;

      return;
    }

    if (membros.length === 0 || membros.length !== sala.membrosUids.length) {
      return;
    }

    const atuais = new Map<string, string>();

    for (const membro of membros) {
      atuais.set(membro.uid, membro.nome);
    }

    const antes = membrosVistos.current;

    membrosVistos.current = atuais;

    if (antes === null) {
      return;
    }

    atuais.forEach((membroNome, membroUid) => {
      if (!antes.has(membroUid) && membroUid !== uid) {
        notificar({
          titulo: `${membroNome || "Alguém"} entrou na sala`,
          texto: `${atuais.size} de ${sala.limite} pessoas na sala.`,
          som: "entrou",
        });
      }
    });

    antes.forEach((membroNome, membroUid) => {
      if (!atuais.has(membroUid) && membroUid !== uid) {
        notificar({
          titulo: `${membroNome || "Alguém"} saiu da sala`,
          som: "notificacao",
        });
      }
    });
  }, [sala, membros, souMembro, uid]);

  useEffect(() => {
    if (!sala || !souMembro || membros.length === 0) {
      statusAnteriores.current = null;

      return;
    }

    const atuais = new Map<string, StatusPresenca>();

    for (const membro of membros) {
      atuais.set(membro.uid, statusDe(membro, agora));
    }

    const antes = statusAnteriores.current;

    statusAnteriores.current = atuais;

    if (antes === null) {
      return;
    }

    for (const membro of membros) {
      if (membro.uid === uid) {
        continue;
      }

      const antigo = antes.get(membro.uid);
      const novo = atuais.get(membro.uid);

      if (antigo === "online" && novo === "ausente") {
        notificar({
          titulo: `${membro.nome || "Alguém"} perdeu a conexão`,
          texto: "A sala continua; a pessoa pode voltar a qualquer momento.",
          som: "notificacao",
        });
      }

      if (antigo === "ausente" && novo === "online") {
        notificar({
          titulo: `${membro.nome || "Alguém"} voltou para a sala`,
          som: "entrou",
        });
      }
    }
  }, [sala, membros, souMembro, uid, agora]);

  useEffect(() => {
    if (!sala || sala.estado !== "respondendo") {
      prontosVistos.current = null;
      progressoVisto.current = new Map();

      return;
    }

    const prontosAgora = new Set(
      membros
        .filter(
          (membro) =>
            membro.respostas !== null && membro.rodada === sala.rodada,
        )
        .map((membro) => membro.uid),
    );

    const antes = prontosVistos.current;

    prontosVistos.current = prontosAgora;

    for (const membro of membros) {
      if (membro.uid === uid || sala.discreto) {
        continue;
      }

      const anteriorProgresso = progressoVisto.current.get(membro.uid) ?? 0;

      const progressoAtual =
        membro.progressoRodada === sala.rodada ? membro.progresso : 0;

      if (
        antes !== null &&
        progressoAtual > anteriorProgresso &&
        progressoAtual < 4
      ) {
        anunciar(
          `${membro.nome || "Alguém"} respondeu ${progressoAtual} de 4 perguntas.`,
        );
      }

      progressoVisto.current.set(membro.uid, progressoAtual);
    }

    if (antes === null) {
      return;
    }

    let alguemTerminou = false;

    prontosAgora.forEach((membroUid) => {
      if (!antes.has(membroUid) && membroUid !== uid) {
        alguemTerminou = true;

        const quem = sala.discreto
          ? "Alguém"
          : membros.find((membro) => membro.uid === membroUid)?.nome ||
            "Alguém";

        anunciar(`${quem} terminou de responder.`);
      }
    });

    if (alguemTerminou) {
      tocarSom("entrou");
    }
  }, [sala, membros, uid]);

  function gravarResultado(participantes: ParticipanteGrupo[]) {
    if (!sala) {
      return Promise.resolve();
    }

    const chave = `r-${sala.rodada}`;

    if (acaoResultado.current === chave) {
      return Promise.resolve();
    }

    acaoResultado.current = chave;

    const { atividade, semFiltro } = sortearParaSala(
      sala.codigo,
      sala.rodada,
      1,
      participantes,
      sala.ultimaAtividadeId ? [sala.ultimaAtividadeId] : [],
    );

    return definirResultado(sala.codigo, {
      atividadeId: atividade.id,
      atividadeNome: atividade.nome,
      semFiltro,
    }).catch((falha) => {
      acaoResultado.current = "";

      throw falha;
    });
  }

  useEffect(() => {
    if (!sala || !souMembro || sala.estado !== "respondendo") {
      return undefined;
    }

    if (membros.length === 0 || membros.length !== sala.membrosUids.length) {
      return undefined;
    }

    const participantes = participantesDaRodada(
      paraDecisao(membros),
      sala.rodada,
    );

    if (participantes.length !== membros.length) {
      return undefined;
    }

    const aoFalhar = (falha: unknown) => {
      if (souDono) {
        setErro(mensagemErroSocial(falha));
      }
    };

    if (souDono) {
      gravarResultado(participantes).catch(aoFalhar);

      return undefined;
    }

    const reserva = setTimeout(
      () => gravarResultado(participantes).catch(aoFalhar),
      10000,
    );

    return () => clearTimeout(reserva);
  }, [sala, membros, souDono, souMembro]);

  useEffect(() => {
    if (
      !sala ||
      !souDono ||
      sala.estado !== "respondendo" ||
      sala.prazoEm <= 0 ||
      agora <= sala.prazoEm ||
      membros.length === 0
    ) {
      return;
    }

    const participantes = participantesDaRodada(
      paraDecisao(membros),
      sala.rodada,
    );

    if (participantes.length >= 2) {
      gravarResultado(participantes).catch((falha) =>
        setErro(mensagemErroSocial(falha)),
      );
    }
  }, [agora, sala, membros, souDono]);

  useEffect(() => {
    if (
      !sala ||
      !souMembro ||
      sala.estado !== "resultado" ||
      sala.confirmada ||
      sala.tentativa < 1 ||
      !sala.resultado
    ) {
      return undefined;
    }

    if (membros.length === 0 || membros.length !== sala.membrosUids.length) {
      return undefined;
    }

    const dados = paraDecisao(membros);

    const decisao = apurarVotacao(dados, sala.tentativa);

    if (decisao === "aguardando") {
      return undefined;
    }

    const chave = `v-${sala.rodada}-${sala.tentativa}-${decisao}`;

    if (acaoVotacao.current === chave) {
      return undefined;
    }

    const aplicar = () => {
      if (!sala.resultado || acaoVotacao.current === chave) {
        return;
      }

      acaoVotacao.current = chave;

      const liberar = () => {
        acaoVotacao.current = "";
      };

      if (decisao === "confirmar") {
        confirmarResultado(
          sala.codigo,
          sala.rodada,
          sala.resultado,
          sala.historico,
        ).catch(liberar);

        return;
      }

      const vetadas = [...sala.vetadas, sala.resultado.atividadeId];

      const { atividade, semFiltro } = sortearParaSala(
        sala.codigo,
        sala.rodada,
        sala.tentativa + 1,
        participantesDaRodada(dados, sala.rodada),
        sala.ultimaAtividadeId ? [...vetadas, sala.ultimaAtividadeId] : vetadas,
      );

      girarDeNovo(
        sala.codigo,
        {
          atividadeId: atividade.id,
          atividadeNome: atividade.nome,
          semFiltro,
        },
        sala.tentativa + 1,
        vetadas,
      ).catch(liberar);
    };

    if (souDono) {
      aplicar();

      return undefined;
    }

    const reserva = setTimeout(aplicar, 10000);

    return () => clearTimeout(reserva);
  }, [sala, membros, souDono, souMembro]);

  async function executar(acao: () => Promise<void>) {
    setOcupado(true);
    setErro("");
    setMensagem("");

    try {
      await acao();
    } catch (falha) {
      setErro(mensagemErroSocial(falha));
    } finally {
      setOcupado(false);
    }
  }

  function entrar() {
    executar(async () => {
      await entrarNaSala(codigo, { uid, nome });
    });
  }

  function sair(passarComando = true) {
    if (!sala) {
      return;
    }

    const outros = sala.membrosUids.filter((membroUid) => membroUid !== uid);

    const proximoUid =
      souDono && passarComando === true ? outros[0] : undefined;

    const proximo = proximoUid
      ? {
          uid: proximoUid,
          nome:
            membros.find((membro) => membro.uid === proximoUid)?.nome ||
            "Participante",
        }
      : undefined;

    executar(async () => {
      await sairDaSala(sala.codigo, uid, souDono, proximo);

      router.replace("/salas");
    });
  }

  function alternarDiscreto() {
    if (!sala) {
      return;
    }

    executar(() => definirDiscreto(sala.codigo, !sala.discreto));
  }

  function continuarSemPendentes() {
    if (!sala) {
      return;
    }

    const participantes = participantesDaRodada(
      paraDecisao(membros),
      sala.rodada,
    );

    if (participantes.length < 2) {
      setErro("Precisa de pelo menos 2 pessoas que já responderam.");

      return;
    }

    executar(() => gravarResultado(participantes));
  }

  function remover(membroUid: string) {
    if (!sala) {
      return;
    }

    executar(() => removerParticipante(sala.codigo, membroUid));
  }

  function votar(valor: "topo" | "nao") {
    if (!sala) {
      return;
    }

    executar(() => votarNoResultado(sala.codigo, uid, sala.tentativa, valor));
  }

  async function compartilharCodigo() {
    const resultado = await compartilharTexto(
      `Entre na minha sala da Roleta do Tédio! Código: ${codigo}`,
    );

    if (resultado === "copiado") {
      setMensagem("Texto copiado. Cole onde quiser.");
    } else if (resultado === "falhou") {
      setErro("Não foi possível compartilhar. Passe o código manualmente.");
    }
  }

  function chamar(amizade: Amizade) {
    if (!sala) {
      return;
    }

    executar(async () => {
      const resultado = await enviarConvite(
        { uid, nome },
        { uid: amizade.amigoUid },
        { codigo: sala.codigo, tipo: sala.tipo },
      );

      setConvidados((anteriores) => ({
        ...anteriores,
        [amizade.amigoUid]: resultado,
      }));

      setMensagem(
        resultado === "enviado"
          ? `Convite enviado para ${amizade.amigoNome}.`
          : `${amizade.amigoNome} já tem um convite pendente.`,
      );
    });
  }

  function comecar() {
    if (!sala) {
      return;
    }

    executar(() => iniciarRodada(sala.codigo, sala.rodada));
  }

  function finalizarRespostas(respostas: Respostas) {
    if (!sala) {
      return;
    }

    executar(() => enviarRespostas(sala.codigo, uid, sala.rodada, respostas));
  }

  function registrarProgresso(perguntasRespondidas: number) {
    if (!sala) {
      return;
    }

    enviarProgresso(sala.codigo, uid, sala.rodada, perguntasRespondidas).catch(
      () => undefined,
    );
  }

  function continuarNoApp() {
    router.replace({ pathname: "/", params: { sala: codigo } });
  }

  if (sala === undefined) {
    return (
      <View style={styles.centro}>
        <Texto>Carregando a sala...</Texto>
      </View>
    );
  }

  if (sala === null) {
    return (
      <ScrollView contentContainerStyle={styles.conteudo}>
        <View style={styles.coluna}>
          <Texto cabecalho style={styles.titulo}>
            Sala não encontrada
          </Texto>

          {erro !== "" && (
            <Texto style={[styles.texto, { color: cores.erro }]}>{erro}</Texto>
          )}

          <Botao
            titulo="Voltar às salas"
            onPress={() => router.replace("/salas")}
          />
        </View>
      </ScrollView>
    );
  }

  if (sala.estado === "encerrada") {
    return (
      <ScrollView contentContainerStyle={styles.conteudo}>
        <View style={styles.coluna}>
          <Texto cabecalho style={styles.titulo}>
            Sala encerrada
          </Texto>

          <Texto style={styles.texto}>
            {sala.donoNome} encerrou a sala {sala.codigo}.
          </Texto>

          <Botao
            titulo="Voltar às salas"
            onPress={() => router.replace("/salas")}
          />
        </View>
      </ScrollView>
    );
  }

  if (!souMembro) {
    return (
      <ScrollView contentContainerStyle={styles.conteudo}>
        <View style={styles.coluna}>
          <Texto cabecalho style={styles.titulo}>
            Sala {sala.codigo}
          </Texto>

          <Texto style={styles.texto}>
            Sala de {sala.donoNome} ({sala.membrosUids.length} de {sala.limite}{" "}
            pessoas).
          </Texto>

          {sala.estado === "aguardando" ? (
            <Botao
              titulo="Entrar nesta sala"
              onPress={entrar}
              desabilitado={ocupado}
            />
          ) : (
            <Texto style={[styles.texto, { color: cores.erro }]}>
              Esta sala já começou e não aceita novos participantes.
            </Texto>
          )}

          {erro !== "" && (
            <Texto
              accessibilityRole="alert"
              style={[styles.texto, { color: cores.erro }]}
            >
              {erro}
            </Texto>
          )}

          <View style={styles.espaco} />

          <Botao
            titulo="Voltar às salas"
            secundario
            onPress={() => router.replace("/salas")}
          />
        </View>
      </ScrollView>
    );
  }

  const prontos = membros.filter(
    (membro) => membro.respostas !== null && membro.rodada === sala.rodada,
  ).length;

  const meuMembro = membros.find((membro) => membro.uid === uid);

  const jaRespondi = Boolean(
    meuMembro &&
    meuMembro.respostas !== null &&
    meuMembro.rodada === sala.rodada,
  );

  const amigosAceitos = amizades.filter(
    (amizade) => amizade.estado === "aceita",
  );

  const podeComecar =
    sala.tipo === "casal"
      ? sala.membrosUids.length === 2
      : sala.membrosUids.length >= 2;

  const atividade = sala.resultado
    ? atividades.find((item) => item.id === sala.resultado?.atividadeId)
    : undefined;

  const participantesRodada = participantesDaRodada(
    paraDecisao(membros),
    sala.rodada,
  );

  const pendentes = sala.membrosUids.filter((membroUid) => {
    const membro = membros.find((item) => item.uid === membroUid);

    return !(
      membro &&
      membro.respostas !== null &&
      membro.rodada === sala.rodada
    );
  });

  const ultimasRespostas =
    meuMembro && meuMembro.respostas !== null && meuMembro.rodada < sala.rodada
      ? meuMembro.respostas
      : null;

  const tipoLocal = sala.resultado
    ? TIPO_LOCAL_POR_ATIVIDADE[sala.resultado.atividadeId]
    : undefined;

  const outrosNaSala = sala.membrosUids.length > 1;

  if (sala.estado === "respondendo" && !jaRespondi) {
    return (
      <PerguntasRoleta
        key={`perguntas-${sala.rodada}`}
        nome={nome}
        enviando={ocupado}
        erro={erro}
        aoProgresso={registrarProgresso}
        aoFinalizar={finalizarRespostas}
        aoSair={() => sair()}
        ultimasRespostas={ultimasRespostas}
        prazoEm={sala.prazoEm}
      />
    );
  }

  if (girando && sala.estado === "resultado" && atividade) {
    return (
      <View style={styles.areaRoleta}>
        <RoletaAtividades
          atividades={atividades}
          selecionada={atividade}
          posicaoFixa={criarSorteioDeterministico(
            `posicao-${sala.codigo}-${sala.rodada}-${sala.tentativa}`,
          )()}
          aoConcluir={() => {
            setGirando(false);
            anunciar(`A roleta decidiu: ${atividade.nome}.`);
          }}
        />
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.conteudo}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.coluna}>
        <Texto cabecalho style={styles.titulo}>
          Sala {sala.tipo === "casal" ? "de casal" : "de amigos"}
        </Texto>

        <Texto
          style={styles.codigo}
          accessibilityLabel={`Código da sala: ${sala.codigo.split("").join(" ")}`}
        >
          {sala.codigo}
        </Texto>

        <Texto cabecalho style={styles.secao}>
          Quem está na sala ({sala.membrosUids.length} de {sala.limite})
        </Texto>

        {sala.membrosUids.map((membroUid) => {
          const membro = membros.find((item) => item.uid === membroUid);

          const respondeu =
            membro &&
            membro.respostas !== null &&
            membro.rodada === sala.rodada;

          return (
            <View
              key={membroUid}
              style={[styles.cartaoMembro, estiloPainel(cores, true)]}
            >
              <Texto style={styles.nomeMembro}>
                {membro?.nome || "Participante"}
                {membroUid === sala.donoUid ? " (dono)" : ""}
                {membroUid === uid ? " (você)" : ""}
              </Texto>

              {membro && membroUid !== uid && (
                <Texto style={[styles.nota, { color: cores.textoSecundario }]}>
                  {ROTULO_PRESENCA[statusDe(membro, agora)]}
                </Texto>
              )}

              {sala.estado === "respondendo" && (
                <Texto style={[styles.nota, { color: cores.textoSecundario }]}>
                  {respondeu
                    ? "Respondeu ✓"
                    : !sala.discreto &&
                        membro &&
                        membro.progressoRodada === sala.rodada &&
                        membro.progresso > 0
                      ? `Respondendo... pergunta ${Math.min(membro.progresso + 1, 4)} de 4`
                      : "Respondendo..."}
                </Texto>
              )}

              {souDono &&
                membroUid !== uid &&
                (sala.estado === "aguardando" ||
                  (sala.estado === "respondendo" && !respondeu)) && (
                  <Botao
                    titulo={`Remover ${membro?.nome || "participante"} da sala`}
                    secundario
                    onPress={() => remover(membroUid)}
                    desabilitado={ocupado}
                  />
                )}
            </View>
          );
        })}

        {sala.estado === "aguardando" && (
          <>
            <Texto cabecalho style={styles.secao}>
              Chamar pessoas
            </Texto>

            <ConviteSala codigo={sala.codigo} />

            <Botao
              titulo="Compartilhar o código da sala"
              onPress={compartilharCodigo}
            />

            <Texto cabecalho style={styles.subsecao}>
              Meus amigos
            </Texto>

            {amigosAceitos.length === 0 ? (
              <Texto style={[styles.nota, { color: cores.textoSecundario }]}>
                Você ainda não tem amigos salvos.
              </Texto>
            ) : (
              amigosAceitos.map((amizade) => {
                const naSala = sala.membrosUids.includes(amizade.amigoUid);

                return (
                  <View
                    key={amizade.id}
                    style={[styles.cartaoMembro, estiloPainel(cores, true)]}
                  >
                    <Texto style={styles.nomeMembro}>{amizade.amigoNome}</Texto>

                    <Botao
                      titulo={
                        naSala
                          ? "Já está na sala"
                          : convidados[amizade.amigoUid]
                            ? "Convite enviado"
                            : "Chamar"
                      }
                      secundario={
                        naSala || Boolean(convidados[amizade.amigoUid])
                      }
                      onPress={() => chamar(amizade)}
                      desabilitado={ocupado || naSala}
                    />
                  </View>
                );
              })
            )}

            <View style={styles.espaco} />

            <Botao
              titulo="Gerenciar amigos"
              secundario
              onPress={() => router.push("/amigos")}
            />

            <View style={styles.espaco} />

            {souDono ? (
              <>
                <Botao
                  titulo={
                    sala.discreto
                      ? "Modo discreto: ligado"
                      : "Modo discreto: desligado"
                  }
                  secundario
                  onPress={alternarDiscreto}
                  desabilitado={ocupado}
                />

                <Texto style={[styles.nota, { color: cores.textoSecundario }]}>
                  O modo discreto esconde o progresso e os nomes nas explicações
                  da roleta. Ele é uma opção de tela: quem entende de tecnologia
                  ainda consegue ler os dados da sala.
                </Texto>

                <View style={styles.espaco} />

                <Botao
                  titulo="Começar"
                  onPress={comecar}
                  desabilitado={!podeComecar || ocupado}
                />

                {!podeComecar && (
                  <Texto
                    style={[styles.nota, { color: cores.textoSecundario }]}
                  >
                    {sala.tipo === "casal"
                      ? "Falta a outra pessoa entrar."
                      : "Precisa de pelo menos 2 pessoas."}
                  </Texto>
                )}
              </>
            ) : (
              <Texto style={[styles.nota, { color: cores.textoSecundario }]}>
                Aguardando {sala.donoNome} começar...
                {sala.discreto ? " (modo discreto ligado)" : ""}
              </Texto>
            )}
          </>
        )}

        {sala.estado === "respondendo" && jaRespondi && (
          <>
            <Texto
              accessibilityLiveRegion="polite"
              style={[styles.texto, { marginTop: 16 }]}
            >
              Respostas enviadas. Aguardando os outros: {prontos} de{" "}
              {sala.membrosUids.length} prontos.
            </Texto>

            <ContagemPrazo prazoEm={sala.prazoEm} />

            {souDono && pendentes.length > 0 && (
              <>
                <Botao
                  titulo="Continuar sem quem falta"
                  secundario
                  onPress={continuarSemPendentes}
                  desabilitado={ocupado || prontos < 2}
                />

                <Texto style={[styles.nota, { color: cores.textoSecundario }]}>
                  {prontos < 2
                    ? "Precisa de pelo menos 2 pessoas que já responderam."
                    : "A roleta decide só com quem já respondeu. Passado o prazo, isso acontece sozinho."}
                </Texto>
              </>
            )}
          </>
        )}

        {sala.estado === "resultado" && sala.resultado && (
          <>
            <Texto cabecalho style={styles.secao}>
              A roleta decidiu
            </Texto>

            <View
              style={[
                styles.cartaoResultado,
                estiloPainel(cores),
                { backgroundColor: cores.amarelo },
              ]}
            >
              <Texto
                cabecalho
                style={[styles.resultadoTitulo, { color: cores.sobreCor }]}
              >
                {sala.resultado.atividadeNome}
              </Texto>

              <Texto style={[styles.texto, { color: cores.sobreCor }]}>
                {atividade?.descricao ?? ""}
              </Texto>
            </View>

            {atividade && (
              <ExplicacaoResultado
                participantes={participantesRodada}
                atividade={atividade}
                semFiltro={sala.resultado.semFiltro}
                ocultarNomes={sala.discreto}
              />
            )}

            {!sala.confirmada && (
              <VotacaoResultado
                tentativa={sala.tentativa}
                atividadesVetadas={sala.vetadas}
                membros={membros}
                meuVoto={meuMembro?.voto ?? null}
                ocupado={ocupado}
                aoVotar={votar}
              />
            )}

            {sala.confirmada && tipoLocal && (
              <EscolhaLocalGrupo
                sala={sala}
                membros={membros}
                uid={uid}
                souDono={souDono}
                tipoLocal={tipoLocal}
              />
            )}

            {sala.confirmada && (
              <Botao
                titulo="Ver opções perto de vocês"
                onPress={continuarNoApp}
              />
            )}

            {souDono && (
              <>
                <View style={styles.espaco} />

                <Botao
                  titulo="Nova rodada"
                  secundario
                  onPress={comecar}
                  desabilitado={ocupado}
                />
              </>
            )}
          </>
        )}

        {sala.historico.length > 0 && (
          <>
            <Texto cabecalho style={styles.secao}>
              Rodadas anteriores
            </Texto>

            {sala.historico.map((item) => (
              <Texto
                key={`${item.rodada}-${item.atividadeId}`}
                style={styles.texto}
              >
                Rodada {item.rodada}: {item.atividadeNome}
              </Texto>
            ))}
          </>
        )}

        {mensagem !== "" && (
          <Texto accessibilityRole="alert" style={styles.mensagem}>
            {mensagem}
          </Texto>
        )}

        {erro !== "" && (
          <Texto
            accessibilityRole="alert"
            style={[styles.mensagem, { color: cores.erro }]}
          >
            {erro}
          </Texto>
        )}

        <View style={styles.espacoGrande} />

        <Botao
          titulo={
            souDono && outrosNaSala
              ? "Sair da sala (passar o comando)"
              : souDono
                ? "Encerrar a sala"
                : "Sair da sala"
          }
          secundario
          onPress={() => sair()}
          desabilitado={ocupado}
        />

        {souDono && outrosNaSala && (
          <>
            <View style={styles.espaco} />

            <Botao
              titulo="Encerrar a sala para todos"
              secundario
              onPress={() => sair(false)}
              desabilitado={ocupado}
            />
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  conteudo: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 100,
  },

  coluna: {
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
  },

  areaRoleta: {
    flex: 1,
    width: "100%",
  },

  centro: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  titulo: {
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },

  codigo: {
    fontSize: 40,
    fontWeight: "bold",
    letterSpacing: 8,
    textAlign: "center",
    marginBottom: 8,
  },

  secao: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
  },

  subsecao: {
    fontSize: 17,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
  },

  texto: {
    fontSize: 16,
    lineHeight: 23,
    marginBottom: 10,
  },

  nota: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },

  mensagem: {
    fontSize: 15,
    fontWeight: "700",
    marginTop: 12,
  },

  cartaoMembro: {
    padding: 14,
    marginBottom: 14,
    marginRight: 6,
  },

  nomeMembro: {
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 4,
  },

  cartaoResultado: {
    padding: 20,
    marginBottom: 20,
    marginRight: 8,
  },

  resultadoTitulo: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },

  espaco: {
    height: 10,
  },

  espacoGrande: {
    height: 28,
  },
});

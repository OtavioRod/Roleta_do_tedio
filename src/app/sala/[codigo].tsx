import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import Botao from "../../components/Botao";
import SeletorOpcoes from "../../components/SeletorOpcoes";
import Texto from "../../components/Texto";
import {
    Disposicao,
    GastoOpcao,
    Humor,
    OPCOES_DISPOSICAO,
    OPCOES_GASTO,
    OPCOES_HUMOR,
    OPCOES_TEMPO,
    TempoOpcao,
} from "../../constants/opcoesRoleta";
import { usePreferencias } from "../../context/PreferenciasContext";
import { useSessao } from "../../context/SessaoContext";
import { atividades } from "../../data/atividades";
import { Amizade, observarAmizades } from "../../services/amigos";
import { enviarConvite } from "../../services/convites";
import {
    criarSala as _criarSalaNaoUsada,
    definirResultado,
    entrarNaSala,
    enviarRespostas,
    iniciarRodada,
    MembroSala,
    observarMembros,
    observarSala,
    sairDaSala,
    Sala,
} from "../../services/salas";
import { normalizarCodigo } from "../../utils/codigos";
import { compartilharTexto } from "../../utils/compartilhar";
import { mensagemErroSocial } from "../../utils/mensagensSociais";
import { escolherAtividadeDoGrupo } from "../../utils/recomendacao";

void _criarSalaNaoUsada;

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
  const [humor, setHumor] = useState<Humor | "">("");
  const [gasto, setGasto] = useState<GastoOpcao | "">("");
  const [disposicao, setDisposicao] = useState<Disposicao | "">("");
  const [tempo, setTempo] = useState<TempoOpcao | "">("");
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);

  const calculando = useRef(false);

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
    setHumor("");
    setGasto("");
    setDisposicao("");
    setTempo("");
  }, [sala?.rodada]);

  useEffect(() => {
    if (!sala || !souDono || sala.estado !== "respondendo") {
      calculando.current = false;

      return;
    }

    if (membros.length === 0 || membros.length !== sala.membrosUids.length) {
      return;
    }

    const todosProntos = membros.every(
      (membro) => membro.respostas !== null && membro.rodada === sala.rodada,
    );

    if (!todosProntos || calculando.current) {
      return;
    }

    calculando.current = true;

    const participantes = membros.map((membro) => ({
      nome: membro.nome,
      ...membro.respostas!,
    }));

    const { atividade, semFiltro } = escolherAtividadeDoGrupo(participantes);

    definirResultado(sala.codigo, {
      atividadeId: atividade.id,
      atividadeNome: atividade.nome,
      semFiltro,
    }).catch((falha) => {
      calculando.current = false;
      setErro(mensagemErroSocial(falha));
    });
  }, [sala, membros, souDono]);

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

  function sair() {
    if (!sala) {
      return;
    }

    executar(async () => {
      await sairDaSala(sala.codigo, uid, souDono);

      router.replace("/salas");
    });
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

  function enviar() {
    if (
      !sala ||
      humor === "" ||
      gasto === "" ||
      disposicao === "" ||
      tempo === ""
    ) {
      setErro("Responda as quatro perguntas.");
      return;
    }

    executar(() =>
      enviarRespostas(sala.codigo, uid, sala.rodada, {
        humor,
        gasto,
        disposicao,
        tempo,
      }),
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
              style={[
                styles.cartaoMembro,
                { borderColor: cores.borda, backgroundColor: cores.superficie },
              ]}
            >
              <Texto style={styles.nomeMembro}>
                {membro?.nome || "Participante"}
                {membroUid === sala.donoUid ? " (dono)" : ""}
                {membroUid === uid ? " (você)" : ""}
              </Texto>

              {sala.estado === "respondendo" && (
                <Texto style={[styles.nota, { color: cores.textoSecundario }]}>
                  {respondeu ? "Respondeu" : "Respondendo..."}
                </Texto>
              )}
            </View>
          );
        })}

        {sala.estado === "aguardando" && (
          <>
            <Texto cabecalho style={styles.secao}>
              Chamar pessoas
            </Texto>

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
                    style={[
                      styles.cartaoMembro,
                      {
                        borderColor: cores.borda,
                        backgroundColor: cores.superficie,
                      },
                    ]}
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
              </Texto>
            )}
          </>
        )}

        {sala.estado === "respondendo" && !jaRespondi && (
          <>
            <Texto cabecalho style={styles.secao}>
              Suas respostas
            </Texto>

            <SeletorOpcoes
              rotulo="Como você está agora?"
              opcoes={OPCOES_HUMOR}
              valor={humor}
              aoEscolher={setHumor}
            />

            <SeletorOpcoes
              rotulo="Quanto você pretende gastar?"
              opcoes={OPCOES_GASTO}
              valor={gasto}
              aoEscolher={setGasto}
            />

            <SeletorOpcoes
              rotulo="Qual é a sua disposição?"
              opcoes={OPCOES_DISPOSICAO}
              valor={disposicao}
              aoEscolher={setDisposicao}
            />

            <SeletorOpcoes
              rotulo="Quanto tempo você tem?"
              opcoes={OPCOES_TEMPO}
              valor={tempo}
              aoEscolher={setTempo}
            />

            <Botao
              titulo="Enviar minhas respostas"
              onPress={enviar}
              desabilitado={ocupado}
            />
          </>
        )}

        {sala.estado === "respondendo" && jaRespondi && (
          <Texto
            accessibilityLiveRegion="polite"
            style={[styles.texto, { marginTop: 16 }]}
          >
            Respostas enviadas. Aguardando os outros: {prontos} de{" "}
            {sala.membrosUids.length} prontos.
          </Texto>
        )}

        {sala.estado === "resultado" && sala.resultado && (
          <>
            <Texto cabecalho style={styles.secao}>
              A roleta decidiu
            </Texto>

            <View
              style={[styles.cartaoResultado, { borderColor: cores.texto }]}
            >
              <Texto cabecalho style={styles.resultadoTitulo}>
                {sala.resultado.atividadeNome}
              </Texto>

              <Texto style={styles.texto}>{atividade?.descricao ?? ""}</Texto>
            </View>

            {sala.resultado.semFiltro && (
              <Texto style={[styles.nota, { color: cores.textoSecundario }]}>
                Nada combinou perfeitamente com as respostas de todos, então a
                roleta improvisou.
              </Texto>
            )}

            <Botao
              titulo="Ver opções perto de vocês"
              onPress={continuarNoApp}
            />

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
          titulo={souDono ? "Encerrar a sala" : "Sair da sala"}
          secundario
          onPress={sair}
          desabilitado={ocupado}
        />
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
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },

  nomeMembro: {
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 4,
  },

  cartaoResultado: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 18,
    marginBottom: 14,
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

import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import Botao from "../components/Botao";
import Texto from "../components/Texto";
import TouchableLibras from "../components/TouchableLibras";
import { rotuloGenero } from "../constants/genero";
import { usePreferencias } from "../context/PreferenciasContext";
import { LIMITE_INATIVIDADE_MS, useSessao } from "../context/SessaoContext";
import {
  ErroEntradaNativa,
  lerEntradaNativaAtivada,
} from "../services/entradaNativa";
import {
  EstadoPermissao,
  estadoLocalizacao,
  estadoNotificacoes,
} from "../services/permissoes";

const TEXTO_ESTADO: Record<EstadoPermissao, string> = {
  concedida: "Permitida",
  negada: "Bloqueada",
  "nao-perguntada": "Ainda não decidida",
  indisponivel: "Indisponível",
};

function formatarData(data: Date | number | null | undefined) {
  if (data === null || data === undefined) {
    return "agora";
  }

  return new Date(data).toLocaleString("pt-BR");
}

function formatarContagem(ms: number) {
  const total = Math.ceil(ms / 1000);

  const minutos = Math.floor(total / 60);
  const segundos = total % 60;

  return `${String(minutos).padStart(2, "0")}:${String(segundos).padStart(2, "0")}`;
}

type LinhaProps = {
  rotulo: string;
  valor: string;
};

function Linha({ rotulo, valor }: LinhaProps) {
  const { cores } = usePreferencias();

  return (
    <View style={[styles.linha, { borderBottomColor: cores.borda }]}>
      <Texto style={[styles.rotulo, { color: cores.textoSecundario }]}>
        {rotulo}
      </Texto>

      <Texto style={styles.valor}>{valor}</Texto>
    </View>
  );
}

type SecaoProps = {
  titulo: string;
  children: React.ReactNode;
};

function Secao({ titulo, children }: SecaoProps) {
  const { cores } = usePreferencias();
  const [expandida, setExpandida] = useState(false);
  const rotacao = useSharedValue(0);

  useEffect(() => {
    const configuracao = {
      duration: 300,
      easing: Easing.inOut(Easing.ease),
    };

    rotacao.value = withTiming(expandida ? 90 : 0, configuracao);
  }, [expandida, rotacao]);

  const estiloIndicador = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotacao.value}deg` }],
  }));

  return (
    <Animated.View
      layout={LinearTransition.duration(300)}
      style={[
        styles.cartao,
        { borderColor: cores.borda, backgroundColor: cores.superficie },
      ]}
    >
      <TouchableLibras
        textoTraducao={titulo}
        accessibilityRole="button"
        accessibilityLabel={titulo}
        accessibilityState={{ expanded: expandida }}
        onPress={() => setExpandida((atual) => !atual)}
        style={styles.cabecalhoSecao}
      >
        <Texto librasIgnorado cabecalho style={styles.secao}>
          {titulo}
        </Texto>
        <Animated.Text
          style={[
            styles.indicador,
            { color: cores.destaque },
            estiloIndicador,
          ]}
        >
          ›
        </Animated.Text>
      </TouchableLibras>

      {expandida && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(120)}
        >
          {children}
        </Animated.View>
      )}
    </Animated.View>
  );
}

export default function Perfil() {
  const router = useRouter();

  const { cores } = usePreferencias();

  const {
    usuario,
    perfil,
    sessao,
    emailVerificado,
    tempoRestanteMs,
    sair,
    definirEntradaNativa,
  } = useSessao();

  const [restante, setRestante] = useState(tempoRestanteMs());
  const [preferenciaEntradaNativa, setPreferenciaEntradaNativa] = useState<{
    uid: string;
    ativada: boolean;
  } | null>(null);
  const [uidEntradaNativaCarregada, setUidEntradaNativaCarregada] = useState<
    string | null
  >(null);
  const [alterandoEntradaNativa, setAlterandoEntradaNativa] = useState(false);
  const [erroEntradaNativa, setErroEntradaNativa] = useState<{
    uid: string;
    mensagem: string;
  } | null>(null);
  const [localizacao, setLocalizacao] =
    useState<EstadoPermissao>("indisponivel");
  const [notificacoes, setNotificacoes] =
    useState<EstadoPermissao>("indisponivel");

  useEffect(() => {
    const intervalo = setInterval(() => setRestante(tempoRestanteMs()), 1000);

    return () => clearInterval(intervalo);
  }, [tempoRestanteMs]);

  useEffect(() => {
    let ativo = true;

    if (!usuario || Platform.OS === "web") {
      return undefined;
    }

    void lerEntradaNativaAtivada(usuario.uid)
      .then((ativada) => {
        if (ativo) {
          setPreferenciaEntradaNativa({ uid: usuario.uid, ativada });
        }
      })
      .catch(() => {
        if (ativo) {
          setErroEntradaNativa({
            uid: usuario.uid,
            mensagem:
              "Não foi possível carregar a preferência de entrada nativa.",
          });
        }
      })
      .finally(() => {
        if (ativo) {
          setUidEntradaNativaCarregada(usuario.uid);
        }
      });

    return () => {
      ativo = false;
    };
  }, [usuario]);

  useEffect(() => {
    let ativo = true;

    (async () => {
      const [loc, notif] = await Promise.all([
        estadoLocalizacao(),
        estadoNotificacoes(),
      ]);

      if (ativo) {
        setLocalizacao(loc);
        setNotificacoes(notif);
      }
    })();

    return () => {
      ativo = false;
    };
  }, []);

  const nome = perfil?.nome || usuario?.displayName || "Sem nome";

  const email = perfil?.email || usuario?.email || "";

  const entradaNativaAtivada =
    usuario?.uid === preferenciaEntradaNativa?.uid &&
    preferenciaEntradaNativa?.ativada === true;
  const carregandoEntradaNativa =
    !!usuario && uidEntradaNativaCarregada !== usuario.uid;
  const mensagemErroEntradaNativa =
    usuario?.uid === erroEntradaNativa?.uid
      ? erroEntradaNativa?.mensagem ?? ""
      : "";

  async function alterarEntradaNativa(ativada: boolean) {
    if (alterandoEntradaNativa) {
      return;
    }

    setAlterandoEntradaNativa(true);
    setErroEntradaNativa(null);

    try {
      await definirEntradaNativa(ativada);
      if (usuario) {
        setPreferenciaEntradaNativa({ uid: usuario.uid, ativada });
      }
    } catch (erro) {
      setErroEntradaNativa(
        {
          uid: usuario?.uid ?? "",
          mensagem:
            erro instanceof ErroEntradaNativa
              ? erro.message
              : "Não foi possível salvar a preferência de entrada nativa.",
        },
      );
    } finally {
      setAlterandoEntradaNativa(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.conteudo}>
      <View style={styles.coluna}>
        <Texto cabecalho style={styles.titulo}>
          Meu perfil
        </Texto>

        <Secao titulo="Conta conectada">
          <Linha rotulo="Nome" valor={nome} />
          <Linha rotulo="E-mail" valor={email} />
          <Linha
            rotulo="E-mail confirmado"
            valor={emailVerificado ? "Sim" : "Não"}
          />
          <Linha rotulo="Gênero" valor={rotuloGenero(perfil?.genero ?? "")} />
          <Linha rotulo="Identificador da conta" valor={usuario?.uid ?? ""} />
          <Linha
            rotulo="Conta criada em"
            valor={formatarData(perfil?.criadoEm)}
          />
          <Linha
            rotulo="Último acesso"
            valor={formatarData(perfil?.ultimoLoginEm)}
          />
        </Secao>

        {Platform.OS !== "web" && (
          <Secao titulo="Entrada nativa">
            <Texto style={styles.descricaoEntradaNativa}>
              Use a confirmação do sistema neste aparelho depois de entrar com
              sua senha. A preferência vale somente para esta conta e não salva
              sua senha.
            </Texto>

            <View style={styles.linhaEntradaNativa}>
              <Texto style={styles.rotuloEntradaNativa}>
                Ativar entrada nativa
              </Texto>

              <Switch
                value={entradaNativaAtivada}
                onValueChange={alterarEntradaNativa}
                disabled={carregandoEntradaNativa || alterandoEntradaNativa}
                accessibilityRole="switch"
                accessibilityLabel="Entrada nativa"
                accessibilityHint="Pede confirmação do sistema após o login por senha."
                accessibilityState={{
                  checked: entradaNativaAtivada,
                  disabled: carregandoEntradaNativa || alterandoEntradaNativa,
                }}
              />
            </View>

            {mensagemErroEntradaNativa !== "" && (
              <Texto
                accessibilityRole="alert"
                style={[styles.erroEntradaNativa, { color: cores.erro }]}
              >
                {mensagemErroEntradaNativa}
              </Texto>
            )}
          </Secao>
        )}

        <Secao titulo="Avisos e permissões">
          <Linha
            rotulo="Avisos por e-mail"
            valor={perfil?.notificacoes.email ? "Ativados" : "Desativados"}
          />
          <Linha
            rotulo="Notificações no aparelho"
            valor={perfil?.notificacoes.push ? "Ativadas" : "Desativadas"}
          />
          <Linha
            rotulo="Permissão de localização"
            valor={TEXTO_ESTADO[localizacao]}
          />
          <Linha
            rotulo="Permissão de notificações"
            valor={TEXTO_ESTADO[notificacoes]}
          />

          <View style={styles.botaoInterno}>
            <Botao
              titulo="Gerenciar permissões"
              secundario
              onPress={() => router.push("/permissoes")}
            />
          </View>
        </Secao>

        <Secao titulo="Sessão atual">
          <Linha rotulo="Código da sessão" valor={sessao?.id ?? ""} />
          <Linha
            rotulo="Iniciada em"
            valor={formatarData(sessao?.iniciadaEm)}
          />
          <Linha
            rotulo="Limite de inatividade"
            valor={formatarContagem(LIMITE_INATIVIDADE_MS)}
          />
          <Linha
            rotulo="Expira por inatividade em"
            valor={formatarContagem(restante)}
          />
        </Secao>

        <Texto style={[styles.nota, { color: cores.textoSecundario }]}>
          A contagem volta ao início sempre que você toca ou digita. Se ficar
          sem interagir pelo período limite, sua sessão será encerrada.
        </Texto>

        <Botao titulo="Voltar ao app" onPress={() => router.replace("/")} />

        <View style={styles.espaco} />

        <Botao titulo="Sair da conta" secundario onPress={sair} />
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
    maxWidth: 560,
    alignSelf: "center",
  },

  titulo: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 10,
  },

  secao: {
    fontSize: 20,
    fontWeight: "bold",
    flex: 1,
  },

  descricaoEntradaNativa: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },

  linhaEntradaNativa: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  rotuloEntradaNativa: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
  },

  erroEntradaNativa: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
    marginTop: 12,
  },

  cartao: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    marginTop: 16,
  },

  cabecalhoSecao: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  indicador: {
    fontSize: 26,
    fontWeight: "600",
    marginLeft: 12,
  },

  linha: {
    paddingVertical: 10,
    borderBottomWidth: 1,
  },

  rotulo: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 2,
  },

  valor: {
    fontSize: 17,
    lineHeight: 23,
  },

  botaoInterno: {
    paddingVertical: 12,
  },

  nota: {
    fontSize: 14,
    lineHeight: 20,
    marginVertical: 16,
  },

  espaco: {
    height: 10,
  },
});

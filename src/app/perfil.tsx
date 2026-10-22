import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import Botao from "../components/Botao";
import Texto from "../components/Texto";
import { rotuloGenero } from "../constants/genero";
import { usePreferencias } from "../context/PreferenciasContext";
import { LIMITE_INATIVIDADE_MS, useSessao } from "../context/SessaoContext";
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
  const [alturaConteudo, setAlturaConteudo] = useState(0);
  const rotacao = useSharedValue(0);
  const alturaAnimada = useSharedValue(0);

  useEffect(() => {
    const configuracao = {
      duration: 300,
      easing: Easing.inOut(Easing.ease),
    };

    rotacao.value = withTiming(expandida ? 90 : 0, configuracao);
    alturaAnimada.value = withTiming(
      expandida ? alturaConteudo : 0,
      configuracao,
    );
  }, [alturaAnimada, alturaConteudo, expandida, rotacao]);

  const estiloIndicador = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotacao.value}deg` }],
  }));
  const estiloConteudo = useAnimatedStyle(() => ({
    height: alturaAnimada.value,
    overflow: "hidden",
  }));

  return (
    <Animated.View
      style={[
        styles.cartao,
        { borderColor: cores.borda, backgroundColor: cores.superficie },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={titulo}
        accessibilityState={{ expanded: expandida }}
        onPress={() => setExpandida((atual) => !atual)}
        style={styles.cabecalhoSecao}
      >
        <Texto cabecalho style={styles.secao}>
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
      </Pressable>

      <Animated.View
        accessibilityElementsHidden={!expandida}
        importantForAccessibility={
          expandida ? "auto" : "no-hide-descendants"
        }
        style={[
          estiloConteudo,
          { pointerEvents: expandida ? "auto" : "none" },
        ]}
      >
        <View
          onLayout={(evento) =>
            setAlturaConteudo(evento.nativeEvent.layout.height)
          }
        >
          {children}
        </View>
      </Animated.View>
    </Animated.View>
  );
}

export default function Perfil() {
  const router = useRouter();

  const { cores } = usePreferencias();

  const { usuario, perfil, sessao, emailVerificado, tempoRestanteMs, sair } =
    useSessao();

  const [restante, setRestante] = useState(tempoRestanteMs());
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

import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  AppState,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import Botao from "../components/Botao";
import CaixaMarcacao from "../components/CaixaMarcacao";
import { estiloPainel } from "../components/Painel";
import Texto from "../components/Texto";
import { usePreferencias } from "../context/PreferenciasContext";
import { useSessao } from "../context/SessaoContext";
import {
  EstadoPermissao,
  estadoLocalizacao,
  estadoNotificacoes,
  pedirLocalizacao,
  pedirNotificacoes,
} from "../services/permissoes";

const TEXTO_ESTADO: Record<EstadoPermissao, string> = {
  concedida: "Permitida",
  negada: "Bloqueada",
  "nao-perguntada": "Ainda não decidida",
  indisponivel: "Indisponível neste aparelho ou navegador",
};

type CartaoProps = {
  titulo: string;
  icone: string;
  corIcone: "amarelo" | "verde";
  explicacao: string;
  estado: EstadoPermissao;
  ocupado: boolean;
  aoPermitir: () => void;
};

function Cartao({
  titulo,
  icone,
  corIcone,
  explicacao,
  estado,
  ocupado,
  aoPermitir,
}: CartaoProps) {
  const { cores } = usePreferencias();

  async function abrirConfiguracoes() {
    try {
      await Linking.openSettings();
    } catch (erro) {
      console.warn("Não foi possível abrir as configurações:", erro);
    }
  }

  return (
    <View style={[styles.cartao, estiloPainel(cores)]}>
      <View style={styles.cabecalho}>
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={[
            styles.icone,
            { backgroundColor: cores[corIcone], borderColor: cores.borda },
          ]}
        >
          <Texto librasIgnorado style={styles.emoji}>
            {icone}
          </Texto>
        </View>

        <Texto cabecalho style={styles.cartaoTitulo}>
          {titulo}
        </Texto>
      </View>

      <Texto style={[styles.explicacao, { color: cores.textoSecundario }]}>
        {explicacao}
      </Texto>

      <View
        style={[
          styles.selo,
          { backgroundColor: cores.fundo, borderColor: cores.borda },
        ]}
      >
        <Texto style={styles.textoSelo}>Situação: {TEXTO_ESTADO[estado]}</Texto>
      </View>

      {estado === "nao-perguntada" && (
        <Botao
          titulo={`Permitir ${titulo.toLowerCase()}`}
          onPress={aoPermitir}
          desabilitado={ocupado}
        />
      )}

      {estado === "negada" && Platform.OS !== "web" && (
        <Botao
          titulo="Abrir configurações do aparelho"
          secundario
          onPress={abrirConfiguracoes}
        />
      )}

      {estado === "negada" && Platform.OS === "web" && (
        <Texto style={[styles.estado, { color: cores.textoSecundario }]}>
          Para liberar, clique no cadeado ao lado do endereço do site, permita e
          recarregue a página.
        </Texto>
      )}
    </View>
  );
}

export default function Permissoes() {
  const router = useRouter();

  const { cores } = usePreferencias();

  const {
    perfil,
    permissoesConcluidas,
    concluirPermissoes,
    atualizarNotificacoes,
    executarSemExpirar,
  } = useSessao();

  const [localizacao, setLocalizacao] =
    useState<EstadoPermissao>("nao-perguntada");

  const [notificacoes, setNotificacoes] =
    useState<EstadoPermissao>("nao-perguntada");

  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState("");

  const atualizar = useCallback(async () => {
    setLocalizacao(await estadoLocalizacao());
    setNotificacoes(await estadoNotificacoes());
  }, []);

  useEffect(() => {
    atualizar();

    const assinatura = AppState.addEventListener("change", (estado) => {
      if (estado === "active") {
        atualizar();
      }
    });

    return () => assinatura.remove();
  }, [atualizar]);

  async function permitirLocalizacao() {
    setOcupado(true);

    try {
      setLocalizacao(await executarSemExpirar(() => pedirLocalizacao()));
    } finally {
      setOcupado(false);
    }
  }

  async function permitirNotificacoes() {
    setOcupado(true);

    setErro("");

    try {
      const resultado = await executarSemExpirar(() => pedirNotificacoes());

      setNotificacoes(resultado);

      if (resultado === "concedida") {
        await atualizarNotificacoes({ push: true });
      }
    } catch (falha) {
      console.warn("Falha ao registrar a preferência de notificação:", falha);

      setErro("Não foi possível salvar a sua preferência. Tente de novo.");
    } finally {
      setOcupado(false);
    }
  }

  async function alternarEmail(marcado: boolean) {
    setErro("");

    try {
      await atualizarNotificacoes({ email: marcado });
    } catch (falha) {
      console.warn("Falha ao salvar a preferência de e-mail:", falha);

      setErro("Não foi possível salvar a sua preferência. Tente de novo.");
    }
  }

  async function continuar() {
    await concluirPermissoes();

    router.replace("/");
  }

  const nenhumaDecisao =
    localizacao === "nao-perguntada" && notificacoes === "nao-perguntada";

  return (
    <ScrollView contentContainerStyle={styles.conteudo}>
      <View style={styles.coluna}>
        <Texto cabecalho style={styles.titulo}>
          Permissões
        </Texto>

        <Texto style={styles.intro}>
          O app funciona melhor com estas permissões. Você escolhe, e pode mudar
          depois.
        </Texto>

        <Cartao
          titulo="Localização"
          icone="📍"
          corIcone="verde"
          explicacao="Usamos a sua localização para achar restaurantes, cafés, cinemas e eventos perto de você, e para ver o clima. Ela não é salva no seu perfil."
          estado={localizacao}
          ocupado={ocupado}
          aoPermitir={permitirLocalizacao}
        />

        <Cartao
          titulo="Notificações"
          icone="🔔"
          corIcone="amarelo"
          explicacao="Para avisar você sobre novidades do app no aparelho. Se preferir, deixe para depois."
          estado={notificacoes}
          ocupado={ocupado}
          aoPermitir={permitirNotificacoes}
        />

        {Platform.OS === "web" && (
          <Texto style={[styles.nota, { color: cores.textoSecundario }]}>
            Na web, as notificações exigem uma conexão segura (https) ou
            localhost.
          </Texto>
        )}

        {Platform.OS !== "web" && __DEV__ && (
          <Texto style={[styles.nota, { color: cores.textoSecundario }]}>
            Para receber notificações remotas de verdade no Android, é preciso
            um build de desenvolvimento (no Expo Go elas não funcionam).
          </Texto>
        )}

        <View style={[styles.cartao, estiloPainel(cores)]}>
          <View style={styles.cabecalho}>
            <View
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              style={[
                styles.icone,
                { backgroundColor: cores.rosa, borderColor: cores.borda },
              ]}
            >
              <Texto librasIgnorado style={styles.emoji}>
                ✉️
              </Texto>
            </View>

            <Texto cabecalho style={styles.cartaoTitulo}>
              Avisos por e-mail
            </Texto>
          </View>

          <CaixaMarcacao
            rotulo={`Receber avisos em ${perfil?.email ?? "meu e-mail"}`}
            marcado={perfil?.notificacoes.email ?? false}
            aoAlternar={alternarEmail}
          />
        </View>

        {erro !== "" && (
          <Texto
            accessibilityRole="alert"
            style={[styles.erro, { color: cores.erro }]}
          >
            {erro}
          </Texto>
        )}

        <Botao
          titulo={
            permissoesConcluidas
              ? "Voltar ao app"
              : nenhumaDecisao
                ? "Pular por enquanto"
                : "Continuar"
          }
          onPress={continuar}
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

  titulo: {
    fontSize: 40,
    lineHeight: 44,
    marginBottom: 8,
  },

  intro: {
    fontSize: 17,
    lineHeight: 24,
    marginBottom: 22,
  },

  cartao: {
    padding: 20,
    marginBottom: 20,
    marginRight: 8,
  },

  cabecalho: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },

  icone: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },

  emoji: {
    fontSize: 22,
    lineHeight: 30,
    color: "#1E130F",
  },

  selo: {
    alignSelf: "flex-start",
    borderWidth: 2,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 2,
    marginBottom: 14,
  },

  textoSelo: {
    fontSize: 13,
    fontWeight: "700",
  },

  cartaoTitulo: {
    flex: 1,
    fontSize: 24,
    marginBottom: 0,
  },

  explicacao: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 10,
  },

  estado: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },

  nota: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 14,
  },

  erro: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 12,
  },
});

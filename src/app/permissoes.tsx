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
  explicacao: string;
  estado: EstadoPermissao;
  ocupado: boolean;
  aoPermitir: () => void;
};

function Cartao({
  titulo,
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
    <View
      style={[
        styles.cartao,
        { borderColor: cores.borda, backgroundColor: cores.superficie },
      ]}
    >
      <Texto cabecalho style={styles.cartaoTitulo}>
        {titulo}
      </Texto>

      <Texto style={styles.explicacao}>{explicacao}</Texto>

      <Texto style={[styles.estado, { color: cores.textoSecundario }]}>
        Situação: {TEXTO_ESTADO[estado]}
      </Texto>

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
          explicacao="Usamos a sua localização para achar restaurantes, cafés, cinemas e eventos perto de você, e para ver o clima. Ela não é salva no seu perfil."
          estado={localizacao}
          ocupado={ocupado}
          aoPermitir={permitirLocalizacao}
        />

        <Cartao
          titulo="Notificações"
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

        <View
          style={[
            styles.cartao,
            { borderColor: cores.borda, backgroundColor: cores.superficie },
          ]}
        >
          <Texto cabecalho style={styles.cartaoTitulo}>
            Avisos por e-mail
          </Texto>

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
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },

  intro: {
    fontSize: 16,
    lineHeight: 23,
    marginBottom: 16,
  },

  cartao: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
  },

  cartaoTitulo: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
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

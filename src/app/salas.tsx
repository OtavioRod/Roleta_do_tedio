import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import Botao from "../components/Botao";
import CampoFormulario from "../components/CampoFormulario";
import Texto from "../components/Texto";
import { usePreferencias } from "../context/PreferenciasContext";
import { useSessao } from "../context/SessaoContext";
import { criarSala, entrarNaSala, TipoSala } from "../services/salas";
import { normalizarCodigo } from "../utils/codigos";
import { mensagemErroSocial } from "../utils/mensagensSociais";

export default function Salas() {
  const router = useRouter();

  const { cores } = usePreferencias();

  const { usuario, perfil } = useSessao();

  const nome = perfil?.nome || usuario?.displayName || "Pessoa";

  const [codigo, setCodigo] = useState("");
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);

  function abrirSala(codigoSala: string) {
    router.push({ pathname: "/sala/[codigo]", params: { codigo: codigoSala } });
  }

  async function criar(tipo: TipoSala) {
    if (!usuario || ocupado) {
      return;
    }

    setOcupado(true);
    setErro("");

    try {
      abrirSala(await criarSala({ uid: usuario.uid, nome }, tipo));
    } catch (falha) {
      setErro(mensagemErroSocial(falha));
    } finally {
      setOcupado(false);
    }
  }

  async function entrar() {
    if (!usuario || ocupado) {
      return;
    }

    if (normalizarCodigo(codigo).length !== 6) {
      setErro("O código da sala tem 6 caracteres.");
      return;
    }

    setOcupado(true);
    setErro("");

    try {
      abrirSala(await entrarNaSala(codigo, { uid: usuario.uid, nome }));
    } catch (falha) {
      setErro(mensagemErroSocial(falha));
    } finally {
      setOcupado(false);
    }
  }

  return (
    <ScrollView
      contentContainerStyle={styles.conteudo}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.coluna}>
        <Texto cabecalho style={styles.titulo}>
          Salas online
        </Texto>

        <Texto style={[styles.intro, { color: cores.textoSecundario }]}>
          Cada pessoa responde no próprio aparelho, e a roleta decide pelo grupo
          todo.
        </Texto>

        <Texto cabecalho style={styles.secao}>
          Criar uma sala
        </Texto>

        <Botao
          titulo="Sala de casal (2 pessoas)"
          onPress={() => criar("casal")}
          desabilitado={ocupado}
        />

        <View style={styles.espaco} />

        <Botao
          titulo="Sala de amigos (até 10 pessoas)"
          onPress={() => criar("amigos")}
          desabilitado={ocupado}
        />

        <Texto cabecalho style={styles.secao}>
          Entrar com um código
        </Texto>

        <CampoFormulario
          rotulo="Código da sala"
          valor={codigo}
          aoMudar={(texto) => {
            setCodigo(normalizarCodigo(texto).slice(0, 6));
            setErro("");
          }}
          aoEnviar={entrar}
          maxLength={6}
        />

        <Botao
          titulo="Entrar na sala"
          onPress={entrar}
          desabilitado={ocupado}
        />

        {erro !== "" && (
          <Texto
            accessibilityRole="alert"
            style={[styles.erro, { color: cores.erro }]}
          >
            {erro}
          </Texto>
        )}

        <Texto cabecalho style={styles.secao}>
          Outras opções
        </Texto>

        <Botao
          titulo="Meus amigos"
          secundario
          onPress={() => router.push("/amigos")}
        />

        <View style={styles.espaco} />

        <Botao
          titulo="Jogar neste aparelho"
          secundario
          onPress={() => router.replace("/")}
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
    marginBottom: 8,
  },

  secao: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
  },

  erro: {
    fontSize: 15,
    fontWeight: "700",
    marginTop: 12,
  },

  espaco: {
    height: 10,
  },
});

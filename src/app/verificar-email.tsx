import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import Botao from "../components/Botao";
import Texto from "../components/Texto";
import { usePreferencias } from "../context/PreferenciasContext";
import { useSessao } from "../context/SessaoContext";
import { mensagemErroAuth } from "../utils/mensagensAuth";

const ESPERA_REENVIO_SEGUNDOS = 60;
const INTERVALO_CONFERENCIA_MS = 5000;

export default function VerificarEmail() {
  const { cores } = usePreferencias();

  const { usuario, verificarEmail, reenviarVerificacao, sair } = useSessao();

  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const [espera, setEspera] = useState(0);
  const [conferindo, setConferindo] = useState(false);

  useEffect(() => {
    const intervalo = setInterval(() => {
      verificarEmail().catch(() => undefined);
    }, INTERVALO_CONFERENCIA_MS);

    return () => clearInterval(intervalo);
  }, [verificarEmail]);

  useEffect(() => {
    if (espera <= 0) {
      return undefined;
    }

    const temporizador = setTimeout(() => setEspera(espera - 1), 1000);

    return () => clearTimeout(temporizador);
  }, [espera]);

  async function conferir() {
    setErro("");
    setMensagem("");
    setConferindo(true);

    try {
      const confirmado = await verificarEmail();

      if (!confirmado) {
        setMensagem(
          "Ainda não identificamos a confirmação. Abra o e-mail, toque no link e volte aqui.",
        );
      }
    } catch (falha) {
      setErro(mensagemErroAuth(falha));
    } finally {
      setConferindo(false);
    }
  }

  async function reenviar() {
    setErro("");
    setMensagem("");

    try {
      await reenviarVerificacao();

      setEspera(ESPERA_REENVIO_SEGUNDOS);

      setMensagem("Enviamos um novo e-mail. Confira também a caixa de spam.");
    } catch (falha) {
      setErro(mensagemErroAuth(falha));
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.conteudo}>
      <View style={styles.coluna}>
        <Texto cabecalho style={styles.titulo}>
          Confirme o seu e-mail
        </Texto>

        <Texto style={styles.texto}>
          Enviamos uma mensagem para {usuario?.email}. Toque no link dela para
          confirmar que este endereço é seu.
        </Texto>

        <Texto style={[styles.nota, { color: cores.textoSecundario }]}>
          Esta tela confere sozinha a cada poucos segundos. Se a mensagem não
          chegar, olhe a caixa de spam.
        </Texto>

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

        <Botao
          titulo={conferindo ? "Conferindo..." : "Já confirmei"}
          onPress={conferir}
          desabilitado={conferindo}
        />

        <View style={styles.espaco} />

        <Botao
          titulo={
            espera > 0
              ? `Reenviar e-mail (aguarde ${espera} s)`
              : "Reenviar e-mail"
          }
          secundario
          onPress={reenviar}
          desabilitado={espera > 0}
        />

        <View style={styles.espaco} />

        <Botao titulo="Sair" secundario onPress={sair} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  conteudo: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 16,
  },

  coluna: {
    width: "100%",
    maxWidth: 480,
    alignSelf: "center",
  },

  titulo: {
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
  },

  texto: {
    fontSize: 17,
    lineHeight: 24,
    textAlign: "center",
    marginBottom: 12,
  },

  nota: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 20,
  },

  mensagem: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 14,
  },

  espaco: {
    height: 10,
  },
});

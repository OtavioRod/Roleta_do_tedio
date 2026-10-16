import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

import { usePreferencias } from "../context/PreferenciasContext";
import { useSessao } from "../context/SessaoContext";
import Botao from "./Botao";
import Texto from "./Texto";

export default function AvisoSessao() {
  const { cores } = usePreferencias();

  const { avisoExpiracao, tempoRestanteMs, continuarConectado, sair } =
    useSessao();

  const [segundos, setSegundos] = useState(0);

  useEffect(() => {
    if (!avisoExpiracao) {
      return undefined;
    }

    const atualizar = () => setSegundos(Math.ceil(tempoRestanteMs() / 1000));

    atualizar();

    const intervalo = setInterval(atualizar, 1000);

    return () => clearInterval(intervalo);
  }, [avisoExpiracao, tempoRestanteMs]);

  if (!avisoExpiracao) {
    return null;
  }

  return (
    <View
      style={[styles.fundo, { backgroundColor: cores.sobreposicao }]}
      accessibilityViewIsModal
    >
      <View
        style={[
          styles.cartao,
          { backgroundColor: cores.fundo, borderColor: cores.borda },
        ]}
      >
        <Texto cabecalho style={styles.titulo}>
          Você ainda está aí?
        </Texto>

        <Texto accessibilityRole="alert" style={styles.texto}>
          Sua sessão vai expirar por inatividade.
        </Texto>

        <Texto style={styles.contagem}>Tempo restante: {segundos} s</Texto>

        <Botao titulo="Continuar conectado" onPress={continuarConectado} />

        <View style={styles.espaco} />

        <Botao titulo="Sair agora" secundario onPress={sair} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fundo: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    padding: 16,
    zIndex: 40,
  },

  cartao: {
    width: "100%",
    maxWidth: 480,
    alignSelf: "center",
    borderWidth: 1,
    borderRadius: 14,
    padding: 20,
  },

  titulo: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
  },

  texto: {
    fontSize: 17,
    lineHeight: 24,
    marginBottom: 8,
  },

  contagem: {
    fontSize: 16,
    marginBottom: 16,
  },

  espaco: {
    height: 10,
  },
});

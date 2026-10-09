import { ScrollView, StyleSheet, View } from "react-native";

import { PASSOS_GUIA, TITULO_GUIA } from "../constants/guiaLibras";
import { usePreferencias } from "../context/PreferenciasContext";
import Botao from "./Botao";
import Texto from "./Texto";

export default function GuiaLibras() {
  const { libras, alternarLibras } = usePreferencias();

  return (
    <ScrollView contentContainerStyle={styles.conteudo}>
      <Texto cabecalho style={styles.titulo}>
        {TITULO_GUIA}
      </Texto>

      {libras ? (
        <Texto style={styles.instrucao}>
          Clique no botão do VLibras na lateral da tela e depois clique em um
          texto abaixo para ver a tradução em Libras.
        </Texto>
      ) : (
        <View style={styles.bloco}>
          <Texto style={styles.instrucao}>
            Ligue o Libras para traduzir os textos com o avatar do VLibras.
          </Texto>

          <Botao titulo="Ligar Libras" onPress={alternarLibras} />
        </View>
      )}

      {PASSOS_GUIA.map((passo, indice) => (
        <Texto key={passo} style={styles.passo}>
          {indice + 1}. {passo}
        </Texto>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  conteudo: {
    paddingBottom: 20,
  },

  bloco: {
    marginBottom: 16,
  },

  titulo: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 12,
  },

  instrucao: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 14,
  },

  passo: {
    fontSize: 18,
    lineHeight: 26,
    marginBottom: 12,
  },
});

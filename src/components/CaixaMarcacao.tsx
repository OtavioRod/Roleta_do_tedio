import { StyleSheet, View } from "react-native";

import { usePreferencias } from "../context/PreferenciasContext";
import Texto from "./Texto";
import TouchableLibras from "./TouchableLibras";

type Props = {
  rotulo: string;
  marcado: boolean;
  aoAlternar: (marcado: boolean) => void;
  erro?: string;
};

export default function CaixaMarcacao({
  rotulo,
  marcado,
  aoAlternar,
  erro,
}: Props) {
  const { cores } = usePreferencias();

  return (
    <View style={styles.container}>
      <TouchableLibras
        textoTraducao={rotulo}
        onPress={() => aoAlternar(!marcado)}
        activeOpacity={0.7}
        accessibilityRole="checkbox"
        accessibilityLabel={rotulo}
        accessibilityState={{ checked: marcado }}
        style={styles.linha}
      >
        <View
          style={[
            styles.caixa,
            {
              borderColor: erro ? cores.erro : cores.botao,
              backgroundColor: marcado ? cores.botao : "transparent",
            },
          ]}
        >
          {marcado && (
            <Texto
              librasIgnorado
              style={[styles.marca, { color: cores.botaoTexto }]}
            >
              ✓
            </Texto>
          )}
        </View>

        <Texto librasIgnorado style={styles.rotulo}>
          {rotulo}
        </Texto>
      </TouchableLibras>

      {erro ? (
        <Texto
          accessibilityRole="alert"
          style={[styles.erro, { color: cores.erro }]}
        >
          {erro}
        </Texto>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginBottom: 12,
  },

  linha: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 48,
  },

  caixa: {
    width: 26,
    height: 26,
    borderWidth: 2,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },

  marca: {
    fontSize: 16,
    fontWeight: "bold",
    lineHeight: 20,
  },

  rotulo: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
  },

  erro: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 4,
  },
});

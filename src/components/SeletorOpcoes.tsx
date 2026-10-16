import { StyleSheet, TouchableOpacity, View } from "react-native";

import { usePreferencias } from "../context/PreferenciasContext";
import Texto from "./Texto";

type Opcao<T extends string> = { valor: T; rotulo: string };

type Props<T extends string> = {
  rotulo: string;
  opcoes: readonly Opcao<T>[];
  valor: T | "";
  aoEscolher: (valor: T) => void;
  erro?: string;
};

export default function SeletorOpcoes<T extends string>({
  rotulo,
  opcoes,
  valor,
  aoEscolher,
  erro,
}: Props<T>) {
  const { cores } = usePreferencias();

  return (
    <View
      style={styles.container}
      accessibilityRole="radiogroup"
      accessibilityLabel={rotulo}
    >
      <Texto style={styles.rotulo}>{rotulo}</Texto>

      <View style={styles.opcoes}>
        {opcoes.map((opcao) => {
          const marcada = opcao.valor === valor;

          return (
            <TouchableOpacity
              key={opcao.valor}
              onPress={() => aoEscolher(opcao.valor)}
              activeOpacity={0.7}
              accessibilityRole="radio"
              accessibilityLabel={opcao.rotulo}
              accessibilityState={{ checked: marcada, selected: marcada }}
              style={[
                styles.opcao,
                {
                  borderColor: marcada ? cores.botao : cores.borda,
                  backgroundColor: marcada ? cores.botao : "transparent",
                },
              ]}
            >
              <Texto
                style={[
                  styles.texto,
                  { color: marcada ? cores.botaoTexto : cores.texto },
                ]}
              >
                {marcada ? "● " : "○ "}
                {opcao.rotulo}
              </Texto>
            </TouchableOpacity>
          );
        })}
      </View>

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
    marginBottom: 16,
  },

  rotulo: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },

  opcoes: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  opcao: {
    minHeight: 48,
    borderWidth: 2,
    borderRadius: 8,
    paddingHorizontal: 14,
    justifyContent: "center",
  },

  texto: {
    fontSize: 16,
    fontWeight: "600",
  },

  erro: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 6,
  },
});

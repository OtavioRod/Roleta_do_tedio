import { StyleSheet, View } from "react-native";

import { usePreferencias } from "../context/PreferenciasContext";

type Props = {
  total: number;
  atual: number;
};

export default function BarraProgresso({ total, atual }: Props) {
  const { cores } = usePreferencias();

  return (
    <View
      style={styles.linha}
      accessibilityRole="progressbar"
      accessibilityLabel={`Pergunta ${Math.min(atual + 1, total)} de ${total}`}
      accessibilityValue={{ min: 0, max: total, now: atual }}
    >
      {Array.from({ length: total }, (_, indice) => (
        <View
          key={indice}
          style={[
            styles.parte,
            {
              borderColor: cores.borda,
              backgroundColor: indice < atual ? cores.primaria : cores.superficie,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  linha: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
  },

  parte: {
    flex: 1,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
});

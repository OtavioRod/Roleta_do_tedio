import { ReactNode } from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";

import { Cores, usePreferencias } from "../context/PreferenciasContext";

export function estiloPainel(cores: Cores, pequeno = false): ViewStyle {
  const deslocamento = pequeno ? 4 : 8;

  return {
    backgroundColor: cores.superficie,
    borderColor: cores.borda,
    borderWidth: 2,
    borderRadius: pequeno ? 16 : 24,
    boxShadow: `${deslocamento}px ${deslocamento}px 0px 0px ${cores.sombra}`,
  };
}

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  pequeno?: boolean;
};

export default function Painel({ children, style, pequeno = false }: Props) {
  const { cores } = usePreferencias();

  return (
    <View style={[styles.base, estiloPainel(cores, pequeno), style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    padding: 20,
    marginBottom: 16,
    marginRight: 8,
  },
});

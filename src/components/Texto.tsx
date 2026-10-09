import { StyleSheet, Text, TextProps } from "react-native";

import { usePreferencias } from "../context/PreferenciasContext";

type TextoProps = TextProps & {
  cabecalho?: boolean;
};

export default function Texto({ style, cabecalho, ...resto }: TextoProps) {
  const { cores, escala } = usePreferencias();

  const achatado = StyleSheet.flatten(style) ?? {};

  const tamanho = (achatado.fontSize ?? 16) * escala;

  const estiloFinal = {
    color: cores.texto,
    ...achatado,
    fontSize: tamanho,
    ...(achatado.lineHeight
      ? { lineHeight: achatado.lineHeight * escala }
      : {}),
  };

  return (
    <Text
      {...resto}
      accessibilityRole={cabecalho ? "header" : resto.accessibilityRole}
      style={estiloFinal}
    />
  );
}

import { isValidElement, type ReactNode } from "react";
import {
  StyleSheet,
  Text,
  TextProps,
  type NativeMethods,
} from "react-native";

import { usePreferencias } from "../context/PreferenciasContext";
import { useVLibrasTouch } from "../hooks/useVLibrasTouch";

type TextoProps = TextProps & {
  cabecalho?: boolean;
  librasIgnorado?: boolean;
};

function extrairTexto(conteudo: ReactNode): string {
  if (typeof conteudo === "string" || typeof conteudo === "number") {
    return String(conteudo);
  }

  if (Array.isArray(conteudo)) {
    return conteudo.map(extrairTexto).join("");
  }

  if (isValidElement<{ children?: ReactNode }>(conteudo)) {
    return extrairTexto(conteudo.props.children);
  }

  return "";
}

export default function Texto({
  style,
  cabecalho,
  librasIgnorado = false,
  ...resto
}: TextoProps) {
  const { cores, escala } = usePreferencias();
  const { ref, onPress: onPressTraduzir } = useVLibrasTouch<
    Text & NativeMethods
  >(extrairTexto(resto.children), resto.onPress);

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
      ref={librasIgnorado ? undefined : ref}
      onPress={librasIgnorado ? resto.onPress : onPressTraduzir}
      accessibilityRole={cabecalho ? "header" : resto.accessibilityRole}
      style={estiloFinal}
    />
  );
}

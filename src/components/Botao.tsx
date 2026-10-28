import { StyleSheet } from "react-native";

import { usePreferencias } from "../context/PreferenciasContext";
import Texto from "./Texto";
import TouchableLibras from "./TouchableLibras";

type BotaoProps = {
  titulo: string;
  onPress: () => void;
  desabilitado?: boolean;
  selecionado?: boolean;
  secundario?: boolean;
  rotulo?: string;
  dica?: string;
};

export default function Botao({
  titulo,
  onPress,
  desabilitado = false,
  selecionado,
  secundario = false,
  rotulo,
  dica,
}: BotaoProps) {
  const { cores } = usePreferencias();

  const fundo = desabilitado
    ? cores.botaoDesabilitado
    : secundario
      ? "transparent"
      : cores.botao;

  const corTexto = desabilitado
    ? cores.botaoTexto
    : secundario
      ? cores.botao
      : cores.botaoTexto;

  return (
    <TouchableLibras
      textoTraducao={rotulo ?? titulo}
      onPress={onPress}
      disabled={desabilitado}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={rotulo ?? titulo}
      accessibilityHint={dica}
      accessibilityState={{ disabled: desabilitado, selected: selecionado }}
      style={[
        styles.botao,
        {
          backgroundColor: fundo,
          borderColor: desabilitado ? cores.botaoDesabilitado : cores.botao,
        },
      ]}
    >
      <Texto
        librasIgnorado
        style={[styles.texto, { color: corTexto }]}
      >
        {titulo}
      </Texto>
    </TouchableLibras>
  );
}

const styles = StyleSheet.create({
  botao: {
    minHeight: 48,
    borderRadius: 8,
    borderWidth: 2,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  texto: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});

import { useState } from "react";
import { StyleSheet } from "react-native";

import { usePreferencias } from "../context/PreferenciasContext";
import { tocarSom } from "../services/sons";
import Texto from "./Texto";
import TouchableLibras from "./TouchableLibras";

type BotaoProps = {
  titulo: string;
  onPress: () => void;
  desabilitado?: boolean;
  selecionado?: boolean;
  secundario?: boolean;
  pequeno?: boolean;
  rotulo?: string;
  dica?: string;
  semSom?: boolean;
};

export default function Botao({
  titulo,
  onPress,
  desabilitado = false,
  selecionado,
  secundario = false,
  pequeno = false,
  rotulo,
  dica,
  semSom = false,
}: BotaoProps) {
  const { cores } = usePreferencias();

  const [pressionado, setPressionado] = useState(false);

  const fundo = desabilitado
    ? cores.botaoDesabilitado
    : secundario
      ? cores.superficie
      : cores.botao;

  const corTexto = desabilitado
    ? cores.botaoTexto
    : secundario
      ? cores.texto
      : cores.botaoTexto;

  const deslocamento = pequeno ? 2 : 4;

  const sombra =
    desabilitado || pressionado
      ? "0px 0px 0px 0px transparent"
      : `${deslocamento}px ${deslocamento}px 0px 0px ${cores.sombra}`;

  return (
    <TouchableLibras
      textoTraducao={rotulo ?? titulo}
      onPress={() => {
        if (!semSom) {
          tocarSom("clique");
        }

        onPress();
      }}
      onPressIn={() => setPressionado(true)}
      onPressOut={() => setPressionado(false)}
      disabled={desabilitado}
      activeOpacity={1}
      accessibilityRole="button"
      accessibilityLabel={rotulo ?? titulo}
      accessibilityHint={dica}
      accessibilityState={{ disabled: desabilitado, selected: selecionado }}
      style={[
        styles.botao,
        pequeno ? styles.pequeno : null,
        {
          backgroundColor: fundo,
          borderColor: cores.borda,
          boxShadow: sombra,
          transform: pressionado
            ? [{ translateX: deslocamento }, { translateY: deslocamento }]
            : [],
          opacity: desabilitado ? 0.7 : 1,
        },
      ]}
    >
      <Texto
        librasIgnorado
        style={[
          styles.texto,
          pequeno ? styles.textoPequeno : null,
          { color: corTexto },
        ]}
      >
        {titulo}
      </Texto>
    </TouchableLibras>
  );
}

const styles = StyleSheet.create({
  botao: {
    minHeight: 52,
    borderRadius: 999,
    borderWidth: 2,
    paddingHorizontal: 22,
    paddingVertical: 12,
    marginRight: 4,
    marginBottom: 4,
    alignItems: "center",
    justifyContent: "center",
  },

  pequeno: {
    minHeight: 40,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginRight: 2,
    marginBottom: 2,
  },

  texto: {
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
  },

  textoPequeno: {
    fontSize: 14,
  },
});

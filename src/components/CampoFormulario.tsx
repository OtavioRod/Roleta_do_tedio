import { useState } from "react";
import {
  Pressable,
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
} from "react-native";

import { usePreferencias } from "../context/PreferenciasContext";
import Texto from "./Texto";

type Props = {
  rotulo: string;
  valor: string;
  aoMudar: (texto: string) => void;
  aoEnviar?: () => void;
  senha?: boolean;
  teclado?: TextInputProps["keyboardType"];
  autoComplete?: TextInputProps["autoComplete"];
  maxLength?: number;
  erro?: string;
  ajuda?: string;
};

export default function CampoFormulario({
  rotulo,
  valor,
  aoMudar,
  aoEnviar,
  senha = false,
  teclado = "default",
  autoComplete,
  maxLength,
  erro,
  ajuda,
}: Props) {
  const { cores, escala } = usePreferencias();

  const [mostrar, setMostrar] = useState(false);
  const [focado, setFocado] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.cabecalho}>
        <Texto style={styles.rotulo}>{rotulo}</Texto>

        {senha && (
          <Pressable
            onPress={() => setMostrar((anterior) => !anterior)}
            accessibilityRole="button"
            accessibilityLabel={mostrar ? "Ocultar senha" : "Mostrar senha"}
            hitSlop={10}
          >
            <Texto
              librasIgnorado
              style={[styles.mostrar, { color: cores.primariaTexto }]}
            >
              {mostrar ? "Ocultar" : "Mostrar senha"}
            </Texto>
          </Pressable>
        )}
      </View>

      <TextInput
        style={[
          styles.input,
          {
            color: cores.texto,
            borderColor: erro ? cores.erro : cores.borda,
            backgroundColor: cores.fundo,
            fontSize: 18 * escala,
            fontFamily: "Figtree_500Medium",
            boxShadow: focado ? `4px 4px 0px 0px ${cores.sombra}` : "none",
          },
        ]}
        value={valor}
        onChangeText={aoMudar}
        onSubmitEditing={aoEnviar}
        onFocus={() => setFocado(true)}
        onBlur={() => setFocado(false)}
        secureTextEntry={senha && !mostrar}
        keyboardType={teclado}
        autoComplete={autoComplete}
        autoCapitalize={senha || teclado === "email-address" ? "none" : "words"}
        autoCorrect={false}
        maxLength={maxLength}
        returnKeyType={aoEnviar ? "done" : "next"}
        accessibilityLabel={rotulo}
        placeholderTextColor={cores.textoSecundario}
      />

      {ajuda && !erro ? (
        <Texto style={[styles.ajuda, { color: cores.textoSecundario }]}>
          {ajuda}
        </Texto>
      ) : null}

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
    marginBottom: 18,
  },

  cabecalho: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },

  rotulo: {
    fontSize: 16,
    fontWeight: "700",
  },

  mostrar: {
    fontSize: 14,
    fontWeight: "700",
    textDecorationLine: "underline",
  },

  input: {
    width: "100%",
    minHeight: 50,
    borderWidth: 2,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },

  ajuda: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
  },

  erro: {
    fontSize: 14,
    fontWeight: "700",
    marginTop: 6,
  },
});

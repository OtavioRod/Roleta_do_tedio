import { useState } from "react";
import { StyleSheet, TextInput, TextInputProps, View } from "react-native";

import { usePreferencias } from "../context/PreferenciasContext";
import Botao from "./Botao";
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

  return (
    <View style={styles.container}>
      <Texto style={styles.rotulo}>{rotulo}</Texto>

      <TextInput
        style={[
          styles.input,
          {
            color: cores.texto,
            borderColor: erro ? cores.erro : cores.borda,
            backgroundColor: cores.fundo,
            fontSize: 18 * escala,
          },
        ]}
        value={valor}
        onChangeText={aoMudar}
        onSubmitEditing={aoEnviar}
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

      {senha && (
        <View style={styles.mostrar}>
          <Botao
            titulo={mostrar ? "Ocultar senha" : "Mostrar senha"}
            secundario
            onPress={() => setMostrar((anterior) => !anterior)}
          />
        </View>
      )}

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
    marginBottom: 6,
  },

  input: {
    width: "100%",
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  ajuda: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
  },

  mostrar: {
    marginTop: 8,
    alignSelf: "flex-start",
  },

  erro: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 6,
  },
});

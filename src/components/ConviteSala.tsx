import { useState } from "react";
import { StyleSheet, View } from "react-native";
import QRCode from "react-native-qrcode-svg";

import { usePreferencias } from "../context/PreferenciasContext";
import { montarLinkSala } from "../services/linkSala";
import { compartilharTexto } from "../utils/compartilhar";
import Botao from "./Botao";
import Texto from "./Texto";

type Props = {
  codigo: string;
};

export default function ConviteSala({ codigo }: Props) {
  const { cores } = usePreferencias();

  const [aviso, setAviso] = useState("");

  const link = montarLinkSala(codigo);

  async function compartilhar() {
    const resultado = await compartilharTexto(
      `Entre na minha sala da Roleta do Tédio: ${link}\nCódigo da sala: ${codigo}`,
    );

    setAviso(
      resultado === "copiado"
        ? "Link copiado. É só colar na conversa."
        : resultado === "falhou"
          ? "Não foi possível compartilhar. Copie o link abaixo."
          : "",
    );
  }

  return (
    <View style={[styles.caixa, { borderColor: cores.borda }]}>
      <Texto cabecalho style={styles.titulo}>
        Chame por link ou QR code
      </Texto>

      <View
        style={styles.qr}
        accessible
        accessibilityRole="image"
        accessibilityLabel={`QR code da sala ${codigo}. Aponte a câmera para entrar.`}
      >
        <QRCode value={link} size={160} backgroundColor="#FFFFFF" color="#000000" />
      </View>

      <Texto selectable style={styles.link}>
        {link}
      </Texto>

      <Botao titulo="Compartilhar link da sala" secundario onPress={compartilhar} />

      {aviso !== "" && (
        <Texto accessibilityRole="alert" style={styles.aviso}>
          {aviso}
        </Texto>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  caixa: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    alignItems: "center",
  },

  titulo: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 12,
  },

  qr: {
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },

  link: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 12,
  },

  aviso: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
  },
});

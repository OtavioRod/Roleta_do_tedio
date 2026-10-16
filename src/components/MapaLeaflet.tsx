import { useMemo } from "react";
import { Linking, Platform, StyleSheet, View } from "react-native";
import { WebView, WebViewMessageEvent } from "react-native-webview";

import { usePreferencias } from "../context/PreferenciasContext";
import { Local } from "../services/overpass";
import { montarHtmlMapa } from "../utils/htmlMapa";
import { montarMarcadores } from "../utils/marcadoresMapa";
import Texto from "./Texto";

type Props = {
  latitude: number;
  longitude: number;
  locais: Local[];
};

const PREFIXOS_PERMITIDOS = [
  "https://www.google.com/maps/",
  "https://www.openstreetmap.org/",
];

async function abrirSeguro(url: string) {
  if (!PREFIXOS_PERMITIDOS.some((prefixo) => url.startsWith(prefixo))) {
    return;
  }

  try {
    await Linking.openURL(url);
  } catch (erro) {
    console.error("Não foi possível abrir o link do mapa:", erro);
  }
}

export default function MapaLeaflet({ latitude, longitude, locais }: Props) {
  const { escala } = usePreferencias();

  const html = useMemo(
    () =>
      montarHtmlMapa(
        latitude,
        longitude,
        montarMarcadores(latitude, longitude, locais),
        escala,
      ),
    [latitude, longitude, locais, escala],
  );

  function aoReceberMensagem(evento: WebViewMessageEvent) {
    abrirSeguro(evento.nativeEvent.data);
  }

  if (Platform.OS === "web") {
    return (
      <View style={styles.container}>
        <Texto style={styles.webTexto}>
          O mapa está disponível no aplicativo.
        </Texto>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        source={{ html }}
        originWhitelist={["*"]}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        setSupportMultipleWindows={false}
        onMessage={aoReceberMensagem}
        style={styles.mapa}
        accessibilityLabel="Mapa com os lugares encontrados"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: 400,
    overflow: "hidden",
    borderRadius: 12,
  },

  mapa: {
    flex: 1,
  },

  webTexto: {
    flex: 1,
    textAlign: "center",
    padding: 20,
    fontSize: 16,
  },
});

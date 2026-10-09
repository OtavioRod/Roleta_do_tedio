import { useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";

import { PASSOS_GUIA, TITULO_GUIA } from "../constants/guiaLibras";
import { usePreferencias } from "../context/PreferenciasContext";
import Botao from "./Botao";
import Texto from "./Texto";

function montarHtml(escala: number, fundo: string, texto: string) {
  const tamanho = Math.round(18 * escala);

  const passos = PASSOS_GUIA.map((passo) => `<li>${passo}</li>`).join("");

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
html, body { margin: 0; padding: 0; width: 100%; overflow-x: hidden; }
body { padding: 16px; box-sizing: border-box; font-family: sans-serif; font-size: ${tamanho}px; line-height: 1.5; background: ${fundo}; color: ${texto}; }
h1 { font-size: ${Math.round(tamanho * 1.3)}px; }
li { margin-bottom: 14px; }
</style>
</head>
<body>
<div vw class="enabled">
<div vw-access-button class="active"></div>
<div vw-plugin-wrapper><div class="vw-plugin-top-wrapper"></div></div>
</div>
<h1>${TITULO_GUIA}</h1>
<p>Toque no botão do VLibras e depois toque em um texto para ver em Libras.</p>
<ol>${passos}</ol>
<script src="https://vlibras.gov.br/app/vlibras-plugin.js"></script>
<script>new window.VLibras.Widget('https://vlibras.gov.br/app');</script>
</body>
</html>`;
}

export default function GuiaLibras() {
  const { cores, escala } = usePreferencias();

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(false);
  const [tentativa, setTentativa] = useState(0);

  const html = useMemo(
    () => montarHtml(escala, cores.fundo, cores.texto),
    [escala, cores.fundo, cores.texto],
  );

  function tentarNovamente() {
    setErro(false);
    setCarregando(true);
    setTentativa((anterior) => anterior + 1);
  }

  if (erro) {
    return (
      <View style={styles.centro}>
        <Texto style={styles.mensagem} accessibilityRole="alert">
          Não foi possível carregar o guia em Libras. Verifique a internet e
          tente novamente.
        </Texto>

        <Botao titulo="Tentar novamente" onPress={tentarNovamente} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        key={tentativa}
        originWhitelist={["*"]}
        source={{ html, baseUrl: "https://vlibras.gov.br/" }}
        javaScriptEnabled
        domStorageEnabled
        setSupportMultipleWindows={false}
        mixedContentMode="always"
        androidLayerType="hardware"
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        onLoadEnd={() => setCarregando(false)}
        onError={() => {
          setCarregando(false);
          setErro(true);
        }}
        style={{ flex: 1, backgroundColor: cores.fundo }}
        accessibilityLabel="Guia do aplicativo com tradução em Libras"
      />

      {carregando && (
        <View style={styles.carregando}>
          <ActivityIndicator size="large" color={cores.destaque} />

          <Texto style={styles.mensagem}>Carregando guia em Libras...</Texto>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  carregando: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    pointerEvents: "none",
  },

  centro: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    padding: 16,
  },

  mensagem: {
    fontSize: 16,
    lineHeight: 22,
    textAlign: "center",
  },
});

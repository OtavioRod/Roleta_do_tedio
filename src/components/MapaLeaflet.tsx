import { Platform, StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";

type Local = {
  id: string;
  nome: string;
  latitude: number;
  longitude: number;
  endereco: string;
};

type Props = {
  latitude: number;
  longitude: number;
  locais: Local[];
};

export default function MapaLeaflet({ latitude, longitude, locais }: Props) {
  const marcadores = [
    {
      id: "usuario",
      nome: "Sua localização",
      latitude,
      longitude,
      endereco: "Localização atual",
    },
    ...locais,
  ];

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
        />

        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        />

        <style>
          html,
          body,
          #map {
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
          }

          body {
            overflow: hidden;
          }
        </style>
      </head>

      <body>
        <div id="map"></div>

        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

        <script>
          const latitude = ${latitude};
          const longitude = ${longitude};

          const locais = ${JSON.stringify(marcadores)};

          const map = L.map("map").setView(
            [latitude, longitude],
            14
          );

          L.tileLayer(
            "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            {
              maxZoom: 19,
              attribution: "&copy; OpenStreetMap contributors"
            }
          ).addTo(map);

          locais.forEach((local) => {
            const marcador = L.marker([
              local.latitude,
              local.longitude
            ]).addTo(map);

            marcador.bindPopup(
              "<strong>" +
              local.nome +
              "</strong><br>" +
              local.endereco
            );
          });

          if (locais.length > 1) {
            const pontos = locais.map((local) => [
              local.latitude,
              local.longitude
            ]);

            const limites = L.latLngBounds(pontos);

            map.fitBounds(limites, {
              padding: [30, 30]
            });
          }
        </script>
      </body>
    </html>
  `;

  if (Platform.OS === "web") {
    return (
      <View style={styles.container}>
        <Text style={styles.webTexto}>
          O mapa está disponível no aplicativo.
        </Text>
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
        style={styles.mapa}
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
    justifyContent: "center",
    textAlign: "center",
    textAlignVertical: "center",
    padding: 20,
    fontSize: 16,
  },
});

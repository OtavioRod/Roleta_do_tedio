import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MapaLeaflet from "./MapaLeaflet";

type Local = {
  id: string;
  nome: string;
  latitude: number;
  longitude: number;
  endereco: string;
};

type Props = {
  titulo: string;
  locais: Local[];
  latitude: number;
  longitude: number;
  mostrarMapa?: boolean;
  onMostrarMapa?: () => void;
};

export default function ResultadoLocais({
  titulo,
  locais,
  latitude,
  longitude,
  mostrarMapa = false,
  onMostrarMapa,
}: Props) {
  return (
    <View style={styles.areaResultado}>
      <View style={styles.container}>
        <Text style={styles.titulo}>{titulo}</Text>

        {locais.length === 0 ? (
          <View style={styles.semResultados}>
            <Text style={styles.semResultadosTitulo}>
              Não encontramos opções próximas.
            </Text>

            <Text style={styles.semResultadosTexto}>
              Isso pode acontecer porque o OpenStreetMap ainda não possui esses
              locais cadastrados na região.
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.quantidade}>
              {locais.length} opção(ões) encontrada(s)
            </Text>

            <View style={styles.lista}>
              {locais.map((local) => (
                <View key={local.id} style={styles.card}>
                  <Text style={styles.nome}>{local.nome}</Text>

                  <Text style={styles.endereco}>{local.endereco}</Text>

                  <View style={styles.coordenadasContainer}>
                    <Text style={styles.coordenadasLabel}>Coordenadas</Text>

                    <Text style={styles.coordenadas}>
                      {local.latitude.toFixed(5)}, {local.longitude.toFixed(5)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            {onMostrarMapa && (
              <TouchableOpacity
                style={styles.botaoMapa}
                onPress={onMostrarMapa}
                activeOpacity={0.8}
              >
                <Text style={styles.textoBotaoMapa}>
                  {mostrarMapa ? "Ocultar mapa" : "Visualizar no mapa"}
                </Text>
              </TouchableOpacity>
            )}

            {mostrarMapa && (
              <View style={styles.mapaContainer}>
                <MapaLeaflet
                  latitude={latitude}
                  longitude={longitude}
                  locais={locais}
                />
              </View>
            )}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  areaResultado: {
    width: "100%",
    maxWidth: 900,
    alignSelf: "center",
    minWidth: 0,
  },

  container: {
    width: "100%",
    minWidth: 0,
    marginTop: 20,
    paddingBottom: 30,
  },

  titulo: {
    width: "100%",
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "800",
    marginBottom: 10,
    color: "#171717",
    flexShrink: 1,
  },

  quantidade: {
    width: "100%",
    fontSize: 15,
    lineHeight: 21,
    marginBottom: 14,
    color: "#555555",
    flexShrink: 1,
  },

  lista: {
    width: "100%",
    minWidth: 0,
  },

  card: {
    width: "100%",
    minWidth: 0,
    borderWidth: 1,
    borderColor: "#dddddd",
    borderRadius: 14,
    padding: 18,
    marginBottom: 14,
    backgroundColor: "#ffffff",
  },

  nome: {
    width: "100%",
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "800",
    marginBottom: 9,
    color: "#171717",
    flexShrink: 1,
  },

  endereco: {
    width: "100%",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 14,
    color: "#444444",
    flexShrink: 1,
  },

  coordenadasContainer: {
    width: "100%",
    minWidth: 0,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#eeeeee",
  },

  coordenadasLabel: {
    fontSize: 11,
    lineHeight: 16,
    color: "#777777",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 3,
  },

  coordenadas: {
    width: "100%",
    fontSize: 13,
    lineHeight: 19,
    color: "#666666",
    flexShrink: 1,
  },

  botaoMapa: {
    width: "100%",
    minHeight: 48,
    backgroundColor: "#222222",
    paddingVertical: 13,
    paddingHorizontal: 15,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },

  textoBotaoMapa: {
    color: "#ffffff",
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "700",
    textAlign: "center",
    flexShrink: 1,
  },

  mapaContainer: {
    width: "100%",
    minWidth: 0,
    marginTop: 15,
    overflow: "hidden",
    borderRadius: 12,
  },

  semResultados: {
    width: "100%",
    minWidth: 0,
    borderWidth: 1,
    borderColor: "#dddddd",
    borderRadius: 14,
    padding: 18,
    backgroundColor: "#ffffff",
  },

  semResultadosTitulo: {
    width: "100%",
    fontSize: 18,
    lineHeight: 23,
    fontWeight: "800",
    marginBottom: 8,
    color: "#222222",
    flexShrink: 1,
  },

  semResultadosTexto: {
    width: "100%",
    fontSize: 15,
    lineHeight: 22,
    color: "#555555",
    flexShrink: 1,
  },
});

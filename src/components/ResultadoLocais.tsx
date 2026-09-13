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

          {locais.map((local) => (
            <View key={local.id} style={styles.card}>
              <Text style={styles.nome}>{local.nome}</Text>

              <Text style={styles.endereco}>{local.endereco}</Text>

              <Text style={styles.coordenadas}>
                {local.latitude.toFixed(5)}, {local.longitude.toFixed(5)}
              </Text>
            </View>
          ))}

          {onMostrarMapa && (
            <TouchableOpacity style={styles.botaoMapa} onPress={onMostrarMapa}>
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
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginTop: 20,
  },

  titulo: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },

  quantidade: {
    fontSize: 15,
    marginBottom: 12,
  },

  card: {
    borderWidth: 1,
    borderColor: "#cccccc",
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },

  nome: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 6,
  },

  endereco: {
    fontSize: 15,
    marginBottom: 6,
  },

  coordenadas: {
    fontSize: 12,
    color: "#777777",
  },

  botaoMapa: {
    backgroundColor: "#222222",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },

  textoBotaoMapa: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },

  mapaContainer: {
    width: "100%",
    marginTop: 15,
    overflow: "hidden",
    borderRadius: 10,
  },

  semResultados: {
    borderWidth: 1,
    borderColor: "#cccccc",
    borderRadius: 10,
    padding: 16,
  },

  semResultadosTitulo: {
    fontSize: 17,
    fontWeight: "bold",
    marginBottom: 8,
  },

  semResultadosTexto: {
    fontSize: 15,
    lineHeight: 21,
  },
});

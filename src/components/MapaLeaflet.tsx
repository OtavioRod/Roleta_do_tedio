import { Platform, Text, View } from "react-native";

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
  if (Platform.OS !== "web") {
    return (
      <View
        style={{
          height: 400,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text>O mapa está disponível na versão web.</Text>
      </View>
    );
  }

  return (
    <View
      style={{
        width: "100%",
        height: 400,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text>Carregando mapa...</Text>
    </View>
  );
}

import { useEffect, useState } from "react";
import { ActivityIndicator, Platform, Text, View } from "react-native";

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
  const [Mapa, setMapa] = useState<any>(null);

  useEffect(() => {
    if (Platform.OS !== "web") {
      return;
    }

    let ativo = true;

    async function carregarLeaflet() {
      const leaflet = await import("leaflet");
      await import("leaflet/dist/leaflet.css");
      const reactLeaflet = await import("react-leaflet");

      if (!ativo) {
        return;
      }

      const iconeUsuario = new leaflet.Icon({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });

      function CentralizarMapa() {
        const mapa = reactLeaflet.useMap();

        useEffect(() => {
          mapa.setView([latitude, longitude], 14);
        }, [mapa, latitude, longitude]);

        return null;
      }

      setMapa(() => ({
        MapContainer: reactLeaflet.MapContainer,
        Marker: reactLeaflet.Marker,
        Popup: reactLeaflet.Popup,
        TileLayer: reactLeaflet.TileLayer,
        CentralizarMapa,
        iconeUsuario,
      }));
    }

    carregarLeaflet();

    return () => {
      ativo = false;
    };
  }, [latitude, longitude]);

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

  if (!Mapa) {
    return (
      <View
        style={{
          width: "100%",
          height: 400,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 10 }}>Carregando mapa...</Text>
      </View>
    );
  }

  const {
    MapContainer,
    Marker,
    Popup,
    TileLayer,
    CentralizarMapa,
    iconeUsuario,
  } = Mapa;

  return (
    <MapContainer
      center={[latitude, longitude]}
      zoom={14}
      style={{
        width: "100%",
        height: 400,
      }}
    >
      <CentralizarMapa />

      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <Marker position={[latitude, longitude]} icon={iconeUsuario}>
        <Popup>Você está aqui</Popup>
      </Marker>

      {locais.map((local) => (
        <Marker key={local.id} position={[local.latitude, local.longitude]}>
          <Popup>
            <strong>{local.nome}</strong>
            <br />
            {local.endereco}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

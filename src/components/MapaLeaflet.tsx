import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";

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

const iconeUsuario = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function CentralizarMapa({
  latitude,
  longitude,
}: {
  latitude: number;
  longitude: number;
}) {
  const map = useMap();

  map.setView([latitude, longitude], 14);

  return null;
}

export default function MapaLeaflet({ latitude, longitude, locais }: Props) {
  return (
    <MapContainer
      center={[latitude, longitude]}
      zoom={14}
      style={{
        width: "100%",
        height: 400,
      }}
    >
      <CentralizarMapa latitude={latitude} longitude={longitude} />

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

import type { Map as LeafletMap } from "leaflet";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";

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

export default function MapaLeaflet({
  latitude,
  longitude,
  locais,
}: Props) {
  const mapaRef = useRef<HTMLDivElement | null>(null);
  const instanciaMapa = useRef<LeafletMap | null>(null);

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let ativo = true;

    async function carregarMapa() {
      try {
        setCarregando(true);
        setErro("");

        const leaflet = await import("leaflet");
        const L = leaflet.default;

        if (!ativo || !mapaRef.current) {
          return;
        }

        if (!document.querySelector('link[data-leaflet-css="true"]')) {
          const link = document.createElement("link");

          link.rel = "stylesheet";
          link.href =
            "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";

          link.setAttribute("data-leaflet-css", "true");

          document.head.appendChild(link);
        }

        if (instanciaMapa.current) {
          instanciaMapa.current.remove();
          instanciaMapa.current = null;
        }

        const mapa = L.map(mapaRef.current).setView(
          [latitude, longitude],
          14
        );

        instanciaMapa.current = mapa;

        L.tileLayer(
          "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
          {
            maxZoom: 19,
            attribution: "&copy; OpenStreetMap contributors",
          }
        ).addTo(mapa);

        const iconeUsuario = L.icon({
          iconUrl:
            "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
          iconRetinaUrl:
            "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
          shadowUrl:
            "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41],
        });

        L.marker([latitude, longitude], {
          icon: iconeUsuario,
        })
          .addTo(mapa)
          .bindPopup("<strong>Você está aqui</strong>");

        locais.forEach((local) => {
          L.marker([local.latitude, local.longitude])
            .addTo(mapa)
            .bindPopup(
              `<strong>${local.nome}</strong><br>${local.endereco}`
            );
        });

        if (locais.length > 0) {
          const pontos = [
            [latitude, longitude] as [number, number],
            ...locais.map(
              (local) =>
                [local.latitude, local.longitude] as [
                  number,
                  number
                ]
            ),
          ];

          mapa.fitBounds(L.latLngBounds(pontos), {
            padding: [30, 30],
          });
        }

        if (ativo) {
          setCarregando(false);
        }
      } catch (error) {
        console.error("Erro ao inicializar mapa:", error);

        if (ativo) {
          setErro("Não foi possível carregar o mapa.");
          setCarregando(false);
        }
      }
    }

    carregarMapa();

    return () => {
      ativo = false;

      if (instanciaMapa.current) {
        instanciaMapa.current.remove();
        instanciaMapa.current = null;
      }
    };
  }, [latitude, longitude, locais]);

  if (erro) {
    return (
      <View
        style={{
          width: "100%",
          height: 400,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text>{erro}</Text>
      </View>
    );
  }

  return (
    <View
      style={{
        width: "100%",
        height: 400,
        position: "relative",
      }}
    >
      <div
        ref={mapaRef}
        style={{
          width: "100%",
          height: "400px",
          borderRadius: "8px",
          overflow: "hidden",
        }}
      />

      {carregando && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(255,255,255,0.8)",
          }}
        >
          <ActivityIndicator size="large" />
          <Text style={{ marginTop: 10 }}>
            Carregando mapa...
          </Text>
        </View>
      )}
    </View>
  );
}
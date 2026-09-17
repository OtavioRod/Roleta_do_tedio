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

declare global {
  interface Window {
    L: any;
  }
}

export default function MapaLeaflet({ latitude, longitude, locais }: Props) {
  const mapaRef = useRef<HTMLDivElement | null>(null);
  const instanciaMapa = useRef<any>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let ativo = true;

    async function carregarMapa() {
      try {
        setCarregando(true);
        setErro("");

        if (!window.L) {
          await new Promise<void>((resolve, reject) => {
            const scriptExistente = document.querySelector(
              'script[data-leaflet="true"]',
            );

            if (scriptExistente) {
              scriptExistente.addEventListener("load", () => resolve());
              scriptExistente.addEventListener("error", () =>
                reject(new Error("Não foi possível carregar o Leaflet.")),
              );
              return;
            }

            const link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
            document.head.appendChild(link);

            const script = document.createElement("script");
            script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
            script.async = true;
            script.setAttribute("data-leaflet", "true");

            script.onload = () => resolve();
            script.onerror = () =>
              reject(new Error("Não foi possível carregar o Leaflet."));

            document.body.appendChild(script);
          });
        }

        if (!ativo || !mapaRef.current || !window.L) {
          return;
        }

        if (instanciaMapa.current) {
          instanciaMapa.current.remove();
          instanciaMapa.current = null;
        }

        const L = window.L;

        const mapa = L.map(mapaRef.current).setView([latitude, longitude], 14);

        instanciaMapa.current = mapa;

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "&copy; OpenStreetMap contributors",
        }).addTo(mapa);

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
            .bindPopup(`<strong>${local.nome}</strong><br>${local.endereco}`);
        });

        setCarregando(false);
      } catch (error) {
        if (!ativo) {
          return;
        }

        console.error(error);
        setErro("Não foi possível carregar o mapa.");
        setCarregando(false);
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
          <Text style={{ marginTop: 10 }}>Carregando mapa...</Text>
        </View>
      )}
    </View>
  );
}

import type { Map as LeafletMap } from "leaflet";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { usePreferencias } from "../context/PreferenciasContext";
import { Local } from "../services/overpass";
import {
  EstadoMarcador,
  MarcadorMapa,
  montarMarcadores,
} from "../utils/marcadoresMapa";
import Texto from "./Texto";

type Props = {
  latitude: number;
  longitude: number;
  locais: Local[];
};

const URL_CSS_LEAFLET = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";

const COR_MARCADOR: Record<EstadoMarcador, string> = {
  aberto: "#1b5e20",
  fechado: "#b00020",
  desconhecido: "#555555",
  usuario: "#0b5fff",
};

const SIMBOLO_MARCADOR: Record<EstadoMarcador, string> = {
  aberto: "●",
  fechado: "○",
  desconhecido: "?",
  usuario: "★",
};

function abrirLink(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

function criarPino(estado: EstadoMarcador) {
  const pino = document.createElement("div");

  pino.textContent = SIMBOLO_MARCADOR[estado];

  Object.assign(pino.style, {
    width: "30px",
    height: "30px",
    boxSizing: "border-box",
    borderRadius: "50%",
    border: "3px solid #ffffff",
    boxShadow: "0 1px 5px rgba(0,0,0,0.6)",
    background: COR_MARCADOR[estado],
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: "15px",
    lineHeight: "24px",
    textAlign: "center",
  });

  return pino;
}

function criarBotao(
  texto: string,
  url: string,
  secundario: boolean,
  fonte: number,
) {
  const botao = document.createElement("button");

  botao.type = "button";
  botao.textContent = texto;

  Object.assign(botao.style, {
    display: "block",
    width: "100%",
    marginTop: "6px",
    padding: "9px",
    fontSize: `${fonte}px`,
    fontWeight: "600",
    cursor: "pointer",
    border: "2px solid #0b5fff",
    borderRadius: "6px",
    background: secundario ? "#ffffff" : "#0b5fff",
    color: secundario ? "#0b5fff" : "#ffffff",
  });

  botao.addEventListener("click", () => abrirLink(url));

  return botao;
}

function criarBalao(marcador: MarcadorMapa, escala: number) {
  const fonte = Math.round(15 * escala);

  const balao = document.createElement("div");

  Object.assign(balao.style, {
    fontSize: `${fonte}px`,
    lineHeight: "1.4",
    minWidth: "190px",
  });

  const titulo = document.createElement("strong");

  titulo.textContent = marcador.nome;

  Object.assign(titulo.style, {
    display: "block",
    fontSize: `${Math.round(fonte * 1.15)}px`,
    marginBottom: "6px",
  });

  balao.appendChild(titulo);

  const adicionarLinha = (texto: string) => {
    if (!texto) {
      return;
    }

    const linha = document.createElement("div");

    linha.textContent = texto;
    linha.style.marginBottom = "6px";

    balao.appendChild(linha);
  };

  adicionarLinha(
    marcador.status
      ? `${SIMBOLO_MARCADOR[marcador.estado]} ${marcador.status}`
      : "",
  );
  adicionarLinha(marcador.distancia);
  adicionarLinha(marcador.endereco);

  if (marcador.rota) {
    balao.appendChild(criarBotao("Como chegar", marcador.rota, false, fonte));
  }

  if (marcador.conferir) {
    balao.appendChild(
      criarBotao("Ver no Google Maps", marcador.conferir, true, fonte),
    );
  }

  if (marcador.dados) {
    balao.appendChild(
      criarBotao("Dados no OpenStreetMap", marcador.dados, true, fonte),
    );
  }

  return balao;
}

export default function MapaLeaflet({ latitude, longitude, locais }: Props) {
  const { cores, escala } = usePreferencias();

  const mapaRef = useRef<HTMLDivElement | null>(null);
  const instanciaMapa = useRef<LeafletMap | null>(null);

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let ativo = true;

    let temporizador: ReturnType<typeof setTimeout> | undefined;

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
          link.href = URL_CSS_LEAFLET;

          link.setAttribute("data-leaflet-css", "true");

          document.head.appendChild(link);
        }

        if (instanciaMapa.current) {
          instanciaMapa.current.remove();
          instanciaMapa.current = null;
        }

        const mapa = L.map(mapaRef.current).setView([latitude, longitude], 14);

        instanciaMapa.current = mapa;

        mapa.attributionControl.setPrefix(false);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
        }).addTo(mapa);

        const marcadores = montarMarcadores(latitude, longitude, locais);

        marcadores.forEach((marcador) => {
          const icone = L.divIcon({
            className: "",
            html: criarPino(marcador.estado),
            iconSize: [30, 30],
            iconAnchor: [15, 15],
            popupAnchor: [0, -15],
          });

          L.marker([marcador.latitude, marcador.longitude], {
            icon: icone,
            title: marcador.nome,
            alt: marcador.nome,
          })
            .addTo(mapa)
            .bindPopup(criarBalao(marcador, escala));
        });

        if (marcadores.length > 1) {
          const pontos = marcadores.map(
            (marcador) =>
              [marcador.latitude, marcador.longitude] as [number, number],
          );

          mapa.fitBounds(L.latLngBounds(pontos), {
            padding: [30, 30],
          });
        }

        temporizador = setTimeout(() => {
          instanciaMapa.current?.invalidateSize();
        }, 150);

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

      if (temporizador) {
        clearTimeout(temporizador);
      }

      if (instanciaMapa.current) {
        instanciaMapa.current.remove();
        instanciaMapa.current = null;
      }
    };
  }, [latitude, longitude, locais, escala]);

  if (erro) {
    return (
      <View style={styles.erro}>
        <Texto accessibilityRole="alert">{erro}</Texto>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <div
        ref={mapaRef}
        role="region"
        aria-label="Mapa com os lugares encontrados"
        style={{
          width: "100%",
          height: "400px",
          borderRadius: "8px",
          overflow: "hidden",
        }}
      />

      {carregando && (
        <View
          style={[styles.carregando, { backgroundColor: cores.fundo }]}
          accessibilityRole="progressbar"
          accessibilityLabel="Carregando mapa"
        >
          <ActivityIndicator size="large" color={cores.destaque} />

          <Texto style={styles.textoCarregando}>Carregando mapa...</Texto>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: 400,
    position: "relative",
  },

  erro: {
    width: "100%",
    height: 400,
    justifyContent: "center",
    alignItems: "center",
  },

  carregando: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    opacity: 0.9,
  },

  textoCarregando: {
    marginTop: 10,
  },
});

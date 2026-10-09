import { useEffect, useMemo, useState } from "react";
import { Linking, Platform, StyleSheet, View } from "react-native";

import { usePreferencias } from "../context/PreferenciasContext";
import { Local } from "../services/overpass";
import { urlSessoes } from "../utils/cinema";
import {
  avaliarHorario,
  EstadoHorario,
  StatusHorario,
} from "../utils/horarioFuncionamento";
import { urlRota } from "../utils/mapas";
import BadgeHorario from "./BadgeHorario";
import Botao from "./Botao";
import MapaLeaflet from "./MapaLeaflet";
import Texto from "./Texto";

type Props = {
  titulo: string;
  locais: Local[];
  latitude: number;
  longitude: number;
  mostrarMapa?: boolean;
  onMostrarMapa?: () => void;
  mostrarSessoes?: boolean;
  minutosDisponiveis?: number;
};

type ItemLocal = {
  local: Local;
  status: StatusHorario;
};

const PRIORIDADE: Record<EstadoHorario, number> = {
  aberto: 0,
  desconhecido: 1,
  fechado: 2,
};

function useAgora(intervaloMs = 60000) {
  const [agora, setAgora] = useState(() => new Date());

  useEffect(() => {
    const identificador = setInterval(() => setAgora(new Date()), intervaloMs);

    return () => clearInterval(identificador);
  }, [intervaloMs]);

  return agora;
}

function formatarDistancia(metros?: number) {
  if (metros === undefined) {
    return null;
  }

  if (metros < 1000) {
    return `${metros} m de você`;
  }

  return `${(metros / 1000).toFixed(1).replace(".", ",")} km de você`;
}

async function abrirLink(url: string) {
  try {
    await Linking.openURL(url);
  } catch (erro) {
    console.error("Não foi possível abrir o link:", erro);
  }
}

export default function ResultadoLocais({
  titulo,
  locais,
  latitude,
  longitude,
  mostrarMapa = false,
  onMostrarMapa,
  mostrarSessoes = false,
  minutosDisponiveis,
}: Props) {
  const { cores } = usePreferencias();

  const agora = useAgora();

  const [mostrarFechados, setMostrarFechados] = useState(false);

  const [mapaVisivel, setMapaVisivel] = useState(mostrarMapa);

  useEffect(() => {
    setMapaVisivel(mostrarMapa);
  }, [mostrarMapa]);

  function alternarMapa() {
    setMapaVisivel((anterior) => !anterior);

    onMostrarMapa?.();
  }

  const itens = useMemo<ItemLocal[]>(
    () =>
      locais
        .map((local) => ({
          local,
          status: avaliarHorario(local.horario, agora),
        }))
        .sort(
          (a, b) =>
            PRIORIDADE[a.status.estado] - PRIORIDADE[b.status.estado] ||
            (a.local.distanciaMetros ?? 0) - (b.local.distanciaMetros ?? 0),
        ),
    [locais, agora],
  );

  const totalFechados = useMemo(
    () => itens.filter((item) => item.status.estado === "fechado").length,
    [itens],
  );

  const visiveis = useMemo(
    () =>
      mostrarFechados
        ? itens
        : itens.filter((item) => item.status.estado !== "fechado"),
    [itens, mostrarFechados],
  );

  const idsVisiveis = visiveis.map((item) => item.local.id).join("|");

  const locaisVisiveis = useMemo(
    () => visiveis.map((item) => item.local),
    [idsVisiveis],
  );

  const todosFechados = itens.length > 0 && visiveis.length === 0;

  return (
    <View style={styles.areaResultado}>
      <View style={styles.container}>
        <Texto cabecalho style={styles.titulo}>
          {titulo}
        </Texto>

        {locais.length === 0 ? (
          <View
            style={[
              styles.semResultados,
              { borderColor: cores.borda, backgroundColor: cores.superficie },
            ]}
          >
            <Texto cabecalho style={styles.semResultadosTitulo}>
              Não encontramos opções próximas.
            </Texto>

            <Texto style={styles.semResultadosTexto}>
              Isso pode acontecer porque o OpenStreetMap ainda não possui esses
              locais cadastrados na região.
            </Texto>
          </View>
        ) : (
          <>
            <Texto
              style={[styles.quantidade, { color: cores.textoSecundario }]}
              accessibilityLiveRegion="polite"
            >
              {visiveis.length} opção(ões) encontrada(s)
              {!mostrarFechados && totalFechados > 0
                ? ` · ${totalFechados} fechado(s) oculto(s)`
                : ""}
            </Texto>

            {totalFechados > 0 && (
              <View style={styles.espacoFiltro}>
                <Botao
                  titulo={
                    mostrarFechados
                      ? "Ocultar lugares fechados"
                      : "Mostrar lugares fechados"
                  }
                  selecionado={mostrarFechados}
                  secundario
                  onPress={() => setMostrarFechados((anterior) => !anterior)}
                />
              </View>
            )}

            {todosFechados && (
              <Texto
                accessibilityRole="alert"
                style={[styles.aviso, { color: cores.erro }]}
              >
                Todos os lugares encontrados estão fechados agora.
              </Texto>
            )}

            <View style={styles.lista}>
              {visiveis.map(({ local, status }) => {
                const distancia = formatarDistancia(local.distanciaMetros);

                const site = local.website;

                const telefone = local.telefone;

                return (
                  <View
                    key={local.id}
                    style={[
                      styles.card,
                      {
                        borderColor: cores.borda,
                        backgroundColor: cores.superficie,
                      },
                    ]}
                  >
                    <Texto cabecalho style={styles.nome}>
                      {local.nome}
                    </Texto>

                    <BadgeHorario
                      status={status}
                      minutosDisponiveis={minutosDisponiveis}
                    />

                    {distancia && (
                      <Texto
                        style={[
                          styles.distancia,
                          { color: cores.textoSecundario },
                        ]}
                      >
                        {distancia}
                      </Texto>
                    )}

                    <Texto
                      style={[
                        styles.endereco,
                        { color: cores.textoSecundario },
                      ]}
                    >
                      {local.endereco}
                    </Texto>

                    {telefone && (
                      <Texto
                        style={[
                          styles.endereco,
                          { color: cores.textoSecundario },
                        ]}
                      >
                        Telefone: {telefone}
                      </Texto>
                    )}

                    <View style={styles.acoes}>
                      <View style={styles.acao}>
                        <Botao
                          titulo="Como chegar"
                          rotulo={`Como chegar em ${local.nome}`}
                          dica="Abre o aplicativo de mapas com a rota"
                          onPress={() =>
                            abrirLink(
                              urlRota(
                                local.latitude,
                                local.longitude,
                                local.nome,
                              ),
                            )
                          }
                        />
                      </View>

                      {mostrarSessoes && (
                        <View style={styles.acao}>
                          <Botao
                            titulo="Ver sessões de hoje"
                            rotulo={`Ver sessões de hoje em ${local.nome}`}
                            dica="Abre uma busca na internet com a programação deste cinema"
                            secundario
                            onPress={() => abrirLink(urlSessoes(local))}
                          />
                        </View>
                      )}

                      {site && (
                        <View style={styles.acao}>
                          <Botao
                            titulo="Site"
                            rotulo={`Abrir o site de ${local.nome}`}
                            secundario
                            onPress={() => abrirLink(site)}
                          />
                        </View>
                      )}

                      {telefone && Platform.OS !== "web" && (
                        <View style={styles.acao}>
                          <Botao
                            titulo="Ligar"
                            rotulo={`Ligar para ${local.nome}`}
                            secundario
                            onPress={() =>
                              abrirLink(
                                `tel:${telefone.replace(/[^\d+]/g, "")}`,
                              )
                            }
                          />
                        </View>
                      )}
                    </View>

                    <View
                      style={[
                        styles.coordenadasContainer,
                        { borderTopColor: cores.borda },
                      ]}
                      accessibilityElementsHidden
                      importantForAccessibility="no-hide-descendants"
                    >
                      <Texto
                        style={[
                          styles.coordenadasLabel,
                          { color: cores.textoSecundario },
                        ]}
                      >
                        Coordenadas
                      </Texto>

                      <Texto
                        style={[
                          styles.coordenadas,
                          { color: cores.textoSecundario },
                        ]}
                      >
                        {local.latitude.toFixed(5)},{" "}
                        {local.longitude.toFixed(5)}
                      </Texto>
                    </View>
                  </View>
                );
              })}
            </View>

            <Botao
              titulo={mapaVisivel ? "Ocultar mapa" : "Visualizar no mapa"}
              selecionado={mapaVisivel}
              onPress={alternarMapa}
            />

            {mapaVisivel && locaisVisiveis.length > 0 && (
              <View style={styles.mapaContainer}>
                <MapaLeaflet
                  latitude={latitude}
                  longitude={longitude}
                  locais={locaisVisiveis}
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
    flexShrink: 1,
  },

  quantidade: {
    width: "100%",
    fontSize: 15,
    lineHeight: 21,
    marginBottom: 14,
    flexShrink: 1,
  },

  espacoFiltro: {
    marginBottom: 14,
  },

  aviso: {
    width: "100%",
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "600",
    marginBottom: 14,
  },

  lista: {
    width: "100%",
    minWidth: 0,
    marginBottom: 4,
  },

  card: {
    width: "100%",
    minWidth: 0,
    borderWidth: 1,
    borderRadius: 14,
    padding: 18,
    marginBottom: 14,
  },

  nome: {
    width: "100%",
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "800",
    marginBottom: 6,
    flexShrink: 1,
  },

  distancia: {
    width: "100%",
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "600",
    marginBottom: 4,
    flexShrink: 1,
  },

  endereco: {
    width: "100%",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 10,
    flexShrink: 1,
  },

  acoes: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },

  acao: {
    flexGrow: 1,
    minWidth: 140,
  },

  coordenadasContainer: {
    width: "100%",
    minWidth: 0,
    paddingTop: 10,
    borderTopWidth: 1,
  },

  coordenadasLabel: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 3,
  },

  coordenadas: {
    width: "100%",
    fontSize: 13,
    lineHeight: 19,
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
    borderRadius: 14,
    padding: 18,
  },

  semResultadosTitulo: {
    width: "100%",
    fontSize: 18,
    lineHeight: 23,
    fontWeight: "800",
    marginBottom: 8,
    flexShrink: 1,
  },

  semResultadosTexto: {
    width: "100%",
    fontSize: 15,
    lineHeight: 22,
    flexShrink: 1,
  },
});

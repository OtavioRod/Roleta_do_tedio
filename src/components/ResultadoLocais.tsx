import { useEffect, useMemo, useState } from "react";
import { Linking, Platform, StyleSheet, View } from "react-native";

import { usePreferencias } from "../context/PreferenciasContext";
import { Local, obterUltimoDiagnostico } from "../services/overpass";
import { urlSessoes } from "../utils/cinema";
import {
  avaliarHorario,
  EstadoHorario,
  StatusHorario,
} from "../utils/horarioFuncionamento";
import { urlBuscaNoMapa, urlRota } from "../utils/mapas";
import BadgeHorario from "./BadgeHorario";
import Botao from "./Botao";
import MapaLeaflet from "./MapaLeaflet";
import { estiloPainel } from "./Painel";
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

function explicarFalta(diagnostico: ReturnType<typeof obterUltimoDiagnostico>) {
  const raioKm = Math.round(diagnostico.raioMaximoMetros / 1000);

  const area = raioKm > 0 ? ` num raio de até ${raioKm} km` : "";

  if (diagnostico.servidor === "falhou" && diagnostico.direto === "falhou") {
    return "Não conseguimos consultar nenhuma fonte de mapas agora. Confira a internet e tente de novo em instantes. O mapa abaixo mostra onde você está.";
  }

  if (diagnostico.direto === "vazio" || diagnostico.servidor === "vazio") {
    return `Consultamos o OpenStreetMap${area} e não há esse tipo de lugar cadastrado por aí. O mapa abaixo mostra onde você está.`;
  }

  return "Isso pode acontecer porque o OpenStreetMap ainda não possui esses locais cadastrados na região. O mapa abaixo mostra onde você está.";
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
          <View style={[styles.semResultados, estiloPainel(cores)]}>
            <Texto cabecalho style={styles.semResultadosTitulo}>
              Não encontramos opções próximas.
            </Texto>

            <Texto style={styles.semResultadosTexto}>
              {explicarFalta(obterUltimoDiagnostico())}
            </Texto>

            <View style={styles.mapaContainer}>
              <MapaLeaflet
                latitude={latitude}
                longitude={longitude}
                locais={[]}
              />
            </View>
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
                const instagram = local.instagram;
                const facebook = local.facebook;
                const telefone = local.telefone;
                const osmUrl = local.osmUrl;

                const semHorario = status.estado === "desconhecido";

                return (
                  <View
                    key={local.id}
                    style={[styles.card, estiloPainel(cores, true)]}
                  >
                    <Texto cabecalho style={styles.nome}>
                      {local.nome}
                    </Texto>

                    <BadgeHorario
                      status={status}
                      minutosDisponiveis={minutosDisponiveis}
                    />

                    {semHorario && (
                      <Texto
                        style={[
                          styles.notaDados,
                          { color: cores.textoSecundario },
                        ]}
                      >
                        {local.fonte === "google"
                          ? "Horário não informado pelo Google Maps."
                          : "Horário não cadastrado no OpenStreetMap."}
                      </Texto>
                    )}

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

                    {local.fonte && local.fonte !== "osm" && (
                      <View
                        style={[
                          styles.selo,
                          {
                            backgroundColor:
                              local.fonte === "google"
                                ? cores.amarelo
                                : cores.verde,
                            borderColor: cores.borda,
                          },
                        ]}
                      >
                        <Texto librasIgnorado style={styles.textoSelo}>
                          {local.fonte === "google"
                            ? "Encontrado pelo Google Maps"
                            : "Encontrado pela busca do OpenStreetMap"}
                        </Texto>
                      </View>
                    )}

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

                      {semHorario && (
                        <View style={styles.acao}>
                          <Botao
                            titulo="Ver horário no Google Maps"
                            rotulo={`Ver horário de ${local.nome} no Google Maps`}
                            dica="Abre o Google Maps para você conferir o horário"
                            secundario
                            onPress={() =>
                              abrirLink(
                                urlBuscaNoMapa(
                                  local.latitude,
                                  local.longitude,
                                  local.nome,
                                ),
                              )
                            }
                          />
                        </View>
                      )}

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

                      {instagram && (
                        <View style={styles.acao}>
                          <Botao
                            titulo="Instagram"
                            rotulo={`Abrir o Instagram de ${local.nome}`}
                            secundario
                            onPress={() => abrirLink(instagram)}
                          />
                        </View>
                      )}

                      {facebook && (
                        <View style={styles.acao}>
                          <Botao
                            titulo="Facebook"
                            rotulo={`Abrir o Facebook de ${local.nome}`}
                            secundario
                            onPress={() => abrirLink(facebook)}
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
                    >
                      <View
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

                      {osmUrl && (
                        <View style={styles.linkDados}>
                          <Botao
                            titulo="Ver dados no OpenStreetMap"
                            rotulo={`Ver os dados cadastrados de ${local.nome} no OpenStreetMap`}
                            dica="Mostra todas as informações que existem sobre este lugar"
                            secundario
                            onPress={() => abrirLink(osmUrl)}
                          />
                        </View>
                      )}
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
    padding: 18,
    marginBottom: 18,
    marginRight: 6,
  },

  selo: {
    alignSelf: "flex-start",
    borderWidth: 2,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 2,
    marginBottom: 10,
  },

  textoSelo: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1E130F",
  },

  nome: {
    width: "100%",
    fontSize: 20,
    lineHeight: 26,
    marginBottom: 6,
    flexShrink: 1,
  },

  notaDados: {
    width: "100%",
    fontSize: 13,
    lineHeight: 18,
    marginTop: -6,
    marginBottom: 10,
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

  linkDados: {
    marginTop: 10,
    alignSelf: "flex-start",
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
    padding: 18,
    marginBottom: 8,
    marginRight: 8,
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

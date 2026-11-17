export type ElementoBruto = {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: {
    lat: number;
    lon: number;
  };
  tags?: Record<string, string>;
};

export type ResultadoDireto = {
  elementos: ElementoBruto[];
  fontes: string[];
};

const ESPELHOS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.openstreetmap.fr/api/interpreter",
];

const LIMITE_ESPELHO_MS = 22000;
const ESPERA_RESPOSTA_VAZIA_MS = 6000;
const LIMITE_NOMINATIM_MS = 12000;
const INTERVALO_NOMINATIM_MS = 1100;

const CONSULTAS_NOMINATIM: Record<string, Record<string, string>[]> = {
  restaurante: [{ amenity: "restaurant" }],
  cafe: [{ amenity: "cafe" }, { q: "cafeteria" }],
  cinema: [{ amenity: "cinema" }],
  parque: [{ q: "parque" }, { q: "praça" }],
  passeio: [{ q: "museu" }, { q: "mirante" }, { q: "ponto turístico" }],
};

function esperar(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function montarConsulta(
  latitude: number,
  longitude: number,
  raio: number,
  filtros: string[],
) {
  const blocos = filtros
    .map((filtro) => `${filtro}(around:${raio},${latitude},${longitude});`)
    .join("\n");

  return `[out:json][timeout:25];\n(\n${blocos}\n);\nout center tags;`;
}

async function consultarEspelho(
  endereco: string,
  consulta: string,
): Promise<ElementoBruto[]> {
  const controlador = new AbortController();

  const temporizador = setTimeout(() => controlador.abort(), LIMITE_ESPELHO_MS);

  try {
    const resposta = await fetch(endereco, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      },
      body: `data=${encodeURIComponent(consulta)}`,
      signal: controlador.signal,
    });

    if (!resposta.ok) {
      throw new Error(`Overpass respondeu ${resposta.status}`);
    }

    const dados = await resposta.json();

    if (!dados || !Array.isArray(dados.elements)) {
      throw new Error("Resposta inválida do Overpass.");
    }

    if (
      dados.elements.length === 0 &&
      typeof dados.remark === "string" &&
      /error|timed out|out of memory|rate/i.test(dados.remark)
    ) {
      throw new Error(dados.remark);
    }

    return dados.elements as ElementoBruto[];
  } finally {
    clearTimeout(temporizador);
  }
}

function primeiraComResultado(
  tentativas: Promise<ElementoBruto[]>[],
): Promise<ElementoBruto[]> {
  return new Promise((resolve, reject) => {
    let pendentes = tentativas.length;
    let vazia: ElementoBruto[] | null = null;
    let temporizador: ReturnType<typeof setTimeout> | null = null;
    let resolvido = false;

    const concluir = (valor: ElementoBruto[]) => {
      if (resolvido) {
        return;
      }

      resolvido = true;

      if (temporizador) {
        clearTimeout(temporizador);
      }

      resolve(valor);
    };

    const encerrarUma = () => {
      pendentes -= 1;

      if (pendentes === 0 && !resolvido) {
        if (vazia) {
          concluir(vazia);
        } else {
          resolvido = true;

          if (temporizador) {
            clearTimeout(temporizador);
          }

          reject(new Error("Nenhum servidor Overpass respondeu."));
        }
      }
    };

    tentativas.forEach((tentativa) => {
      tentativa
        .then((elementos) => {
          if (elementos.length > 0) {
            concluir(elementos);

            return;
          }

          if (!vazia) {
            vazia = elementos;

            temporizador = setTimeout(() => {
              if (vazia) {
                concluir(vazia);
              }
            }, ESPERA_RESPOSTA_VAZIA_MS);
          }

          encerrarUma();
        })
        .catch(() => encerrarUma());
    });
  });
}

function caixaDeBusca(latitude: number, longitude: number, raio: number) {
  const grausLatitude = raio / 111320;

  const grausLongitude =
    raio / (111320 * Math.max(Math.cos((latitude * Math.PI) / 180), 0.01));

  return [
    longitude - grausLongitude,
    latitude + grausLatitude,
    longitude + grausLongitude,
    latitude - grausLatitude,
  ]
    .map((valor) => valor.toFixed(6))
    .join(",");
}

type ItemNominatim = {
  osm_type?: string;
  osm_id?: number | string;
  lat?: string;
  lon?: string;
  name?: string;
  display_name?: string;
  address?: Record<string, string>;
  extratags?: Record<string, string>;
};

function limpar(tags: Record<string, string | undefined>) {
  const resultado: Record<string, string> = {};

  for (const [chave, valor] of Object.entries(tags)) {
    if (typeof valor === "string" && valor.trim() !== "") {
      resultado[chave] = valor.trim();
    }
  }

  return resultado;
}

function converterNominatim(item: ItemNominatim): ElementoBruto | null {
  const tipo = item.osm_type;
  const id = Number(item.osm_id);
  const lat = Number(item.lat);
  const lon = Number(item.lon);

  if (
    !tipo ||
    !["node", "way", "relation"].includes(tipo) ||
    !Number.isFinite(id) ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lon)
  ) {
    return null;
  }

  const endereco = item.address ?? {};
  const extras = item.extratags ?? {};

  const nome = item.name || (item.display_name ?? "").split(",")[0];

  if (!nome) {
    return null;
  }

  return {
    type: tipo,
    id,
    lat,
    lon,
    tags: limpar({
      name: nome,
      "addr:street": endereco.road,
      "addr:housenumber": endereco.house_number,
      "addr:suburb": endereco.suburb || endereco.neighbourhood,
      "addr:city":
        endereco.city ||
        endereco.town ||
        endereco.village ||
        endereco.municipality,
      opening_hours: extras.opening_hours,
      website: extras.website || extras["contact:website"],
      phone: extras.phone || extras["contact:phone"],
      fonte: "nominatim",
    }),
  };
}

async function buscarNominatim(
  latitude: number,
  longitude: number,
  raio: number,
  tipo: string,
) {
  const consultas = CONSULTAS_NOMINATIM[tipo] ?? [];

  const vistos = new Set<string>();
  const elementos: ElementoBruto[] = [];

  let falhas = 0;

  for (let indice = 0; indice < consultas.length; indice += 1) {
    if (indice > 0) {
      await esperar(INTERVALO_NOMINATIM_MS);
    }

    const parametros = new URLSearchParams({
      format: "jsonv2",
      limit: "30",
      addressdetails: "1",
      extratags: "1",
      "accept-language": "pt-BR",
      viewbox: caixaDeBusca(latitude, longitude, raio),
      bounded: "1",
      ...consultas[indice],
    });

    const controlador = new AbortController();

    const temporizador = setTimeout(
      () => controlador.abort(),
      LIMITE_NOMINATIM_MS,
    );

    try {
      const resposta = await fetch(
        `https://nominatim.openstreetmap.org/search?${parametros.toString()}`,
        { signal: controlador.signal },
      );

      if (!resposta.ok) {
        falhas += 1;
        continue;
      }

      const dados = await resposta.json();

      if (!Array.isArray(dados)) {
        falhas += 1;
        continue;
      }

      for (const item of dados as ItemNominatim[]) {
        const elemento = converterNominatim(item);

        if (!elemento) {
          continue;
        }

        const chave = `${elemento.type}-${elemento.id}`;

        if (!vistos.has(chave)) {
          vistos.add(chave);
          elementos.push(elemento);
        }
      }
    } catch {
      falhas += 1;
    } finally {
      clearTimeout(temporizador);
    }
  }

  return { elementos, falhas, consultas: consultas.length };
}

export async function buscarDireto(
  latitude: number,
  longitude: number,
  raio: number,
  tipo: string,
  filtros: string[],
): Promise<ResultadoDireto> {
  const minimo = tipo === "cinema" ? 1 : 5;

  const fontes: string[] = [];

  let elementos: ElementoBruto[] = [];
  let overpassFalhou = false;

  try {
    const consulta = montarConsulta(latitude, longitude, raio, filtros);

    elementos = await primeiraComResultado(
      ESPELHOS.map((endereco) => consultarEspelho(endereco, consulta)),
    );

    if (elementos.length > 0) {
      fontes.push("overpass");
    }
  } catch {
    overpassFalhou = true;
  }

  if (elementos.length < minimo) {
    const nominatim = await buscarNominatim(latitude, longitude, raio, tipo);

    if (nominatim.elementos.length > 0) {
      elementos = elementos.concat(nominatim.elementos);
      fontes.push("nominatim");
    }

    if (
      overpassFalhou &&
      nominatim.elementos.length === 0 &&
      nominatim.consultas > 0 &&
      nominatim.falhas === nominatim.consultas
    ) {
      throw new Error("As fontes abertas do mapa não responderam.");
    }
  } else if (overpassFalhou) {
    throw new Error("As fontes abertas do mapa não responderam.");
  }

  return { elementos, fontes };
}

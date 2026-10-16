import { BACKEND_URL } from "./config";

export type TipoLocal =
  | "restaurante"
  | "cafe"
  | "cinema"
  | "parque"
  | "passeio";

export type Local = {
  id: string;
  nome: string;
  latitude: number;
  longitude: number;
  endereco: string;
  horario?: string;
  website?: string;
  telefone?: string;
  instagram?: string;
  facebook?: string;
  osmUrl?: string;
  distanciaMetros?: number;
};

type TagsOverpass = {
  name?: string;
  brand?: string;
  operator?: string;

  "addr:street"?: string;
  "addr:housenumber"?: string;
  "addr:suburb"?: string;
  "addr:city"?: string;

  opening_hours?: string;

  website?: string;
  "contact:website"?: string;
  url?: string;

  phone?: string;
  "contact:phone"?: string;
  mobile?: string;
  "contact:mobile"?: string;

  instagram?: string;
  "contact:instagram"?: string;
  facebook?: string;
  "contact:facebook"?: string;
};

type ElementoOverpass = {
  type: string;
  id: number;

  lat?: number;
  lon?: number;

  center?: {
    lat: number;
    lon: number;
  };

  tags?: TagsOverpass;
};

type RespostaOverpass = {
  elements: ElementoOverpass[];
};

const TEMPO_LIMITE_MS = 45000;
const ESPERA_NOVA_TENTATIVA_MS = 3000;
const LIMITE_RESULTADOS = 20;
const RAIO_MAXIMO = 30000;
const LIMITE_DUPLICADO_GRAUS = 0.0003;
const ENDERECO_PADRAO = "Endereço não informado";
const ERRO_TEMPO_ESGOTADO = "tempo-esgotado";

class ErroHttp extends Error {
  status: number;

  constructor(status: number) {
    super(`Erro ao consultar backend: ${status}`);

    this.status = status;
  }
}

function esperar(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function obterFiltros(tipo: TipoLocal): string[] {
  switch (tipo) {
    case "restaurante":
      return ['nwr["amenity"="restaurant"]'];

    case "cafe":
      return ['nwr["amenity"="cafe"]', 'nwr["shop"="coffee"]'];

    case "cinema":
      return ['nwr["amenity"="cinema"]'];

    case "parque":
      return ['nwr["leisure"="park"]', 'nwr["leisure"="garden"]'];

    case "passeio":
      return [
        'nwr["tourism"="attraction"]',
        'nwr["tourism"="museum"]',
        'nwr["tourism"="gallery"]',
        'nwr["tourism"="viewpoint"]',
        'nwr["tourism"="zoo"]',
        'nwr["tourism"="theme_park"]',
      ];

    default:
      return [];
  }
}

function limparTexto(valor?: string) {
  const texto = valor?.trim();

  return texto ? texto : undefined;
}

function normalizarSite(valor?: string) {
  const texto = limparTexto(valor);

  if (!texto) {
    return undefined;
  }

  return /^https?:\/\//i.test(texto) ? texto : `https://${texto}`;
}

function normalizarRede(valor: string | undefined, base: string) {
  const texto = limparTexto(valor);

  if (!texto) {
    return undefined;
  }

  if (/^https?:\/\//i.test(texto)) {
    return texto;
  }

  const usuario = texto.replace(/^@/, "").replace(/^\/+/, "");

  if (usuario === "" || /\s/.test(usuario)) {
    return undefined;
  }

  return `${base}${usuario}`;
}

function normalizarNome(nome: string) {
  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function obterNome(elemento: ElementoOverpass): string | null {
  return (
    elemento.tags?.name ??
    elemento.tags?.brand ??
    elemento.tags?.operator ??
    null
  );
}

function obterCoordenadas(elemento: ElementoOverpass): {
  latitude: number;
  longitude: number;
} | null {
  if (elemento.lat !== undefined && elemento.lon !== undefined) {
    return {
      latitude: elemento.lat,
      longitude: elemento.lon,
    };
  }

  if (elemento.center) {
    return {
      latitude: elemento.center.lat,
      longitude: elemento.center.lon,
    };
  }

  return null;
}

function obterEndereco(elemento: ElementoOverpass): string {
  const rua = elemento.tags?.["addr:street"];

  const numero = elemento.tags?.["addr:housenumber"];

  const bairro = elemento.tags?.["addr:suburb"];

  const cidade = elemento.tags?.["addr:city"];

  const endereco = [rua, numero, bairro, cidade].filter(Boolean).join(", ");

  return endereco || ENDERECO_PADRAO;
}

function calcularDistancia(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) {
  const raioTerra = 6371000;

  const paraRadianos = (graus: number) => (graus * Math.PI) / 180;

  const diferencaLat = paraRadianos(lat2 - lat1);
  const diferencaLon = paraRadianos(lon2 - lon1);

  const a =
    Math.sin(diferencaLat / 2) ** 2 +
    Math.cos(paraRadianos(lat1)) *
      Math.cos(paraRadianos(lat2)) *
      Math.sin(diferencaLon / 2) ** 2;

  return Math.round(2 * raioTerra * Math.asin(Math.sqrt(a)));
}

function transformarElemento(
  elemento: ElementoOverpass,
  origemLat: number,
  origemLon: number,
): Local | null {
  const nome = obterNome(elemento);

  const coordenadas = obterCoordenadas(elemento);

  if (!nome || !coordenadas) {
    return null;
  }

  const tags = elemento.tags;

  return {
    id: `${elemento.type}-${elemento.id}`,
    nome,
    latitude: coordenadas.latitude,
    longitude: coordenadas.longitude,
    endereco: obterEndereco(elemento),
    horario: limparTexto(tags?.opening_hours),
    website: normalizarSite(
      tags?.website ?? tags?.["contact:website"] ?? tags?.url,
    ),
    telefone: limparTexto(
      tags?.phone ??
        tags?.["contact:phone"] ??
        tags?.mobile ??
        tags?.["contact:mobile"],
    ),
    instagram: normalizarRede(
      tags?.instagram ?? tags?.["contact:instagram"],
      "https://www.instagram.com/",
    ),
    facebook: normalizarRede(
      tags?.facebook ?? tags?.["contact:facebook"],
      "https://www.facebook.com/",
    ),
    osmUrl: `https://www.openstreetmap.org/${elemento.type}/${elemento.id}`,
    distanciaMetros: calcularDistancia(
      origemLat,
      origemLon,
      coordenadas.latitude,
      coordenadas.longitude,
    ),
  };
}

function mesclar(base: Local, outro: Local): Local {
  return {
    ...base,
    endereco:
      base.endereco === ENDERECO_PADRAO ? outro.endereco : base.endereco,
    horario: base.horario ?? outro.horario,
    website: base.website ?? outro.website,
    telefone: base.telefone ?? outro.telefone,
    instagram: base.instagram ?? outro.instagram,
    facebook: base.facebook ?? outro.facebook,
  };
}

function processarElementos(
  elementos: ElementoOverpass[],
  origemLat: number,
  origemLon: number,
): Local[] {
  const idsVistos = new Set<string>();

  const candidatos: Local[] = [];

  for (const elemento of elementos) {
    const local = transformarElemento(elemento, origemLat, origemLon);

    if (local && !idsVistos.has(local.id)) {
      idsVistos.add(local.id);
      candidatos.push(local);
    }
  }

  candidatos.sort(
    (a, b) => (a.distanciaMetros ?? 0) - (b.distanciaMetros ?? 0),
  );

  const unicos: Local[] = [];

  for (const candidato of candidatos) {
    const nomeCandidato = normalizarNome(candidato.nome);

    const indice = unicos.findIndex(
      (item) =>
        normalizarNome(item.nome) === nomeCandidato &&
        Math.abs(item.latitude - candidato.latitude) < LIMITE_DUPLICADO_GRAUS &&
        Math.abs(item.longitude - candidato.longitude) < LIMITE_DUPLICADO_GRAUS,
    );

    if (indice >= 0) {
      unicos[indice] = mesclar(unicos[indice], candidato);
    } else {
      unicos.push(candidato);
    }
  }

  return unicos;
}

function montarRaios(raio: number) {
  const raios = [raio, raio * 3, raio * 6].map((valor) =>
    Math.min(valor, RAIO_MAXIMO),
  );

  return raios.filter((valor, indice) => raios.indexOf(valor) === indice);
}

async function consultarBackend(corpo: object): Promise<RespostaOverpass> {
  for (let tentativa = 0; tentativa < 2; tentativa += 1) {
    const controlador = new AbortController();

    const temporizador = setTimeout(() => controlador.abort(), TEMPO_LIMITE_MS);

    try {
      const resposta = await fetch(`${BACKEND_URL}/locais`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(corpo),
        signal: controlador.signal,
      });

      if (!resposta.ok) {
        throw new ErroHttp(resposta.status);
      }

      const dados = await resposta.json();

      if (!dados || !Array.isArray(dados.elements)) {
        throw new Error("Resposta inesperada do servidor.");
      }

      return dados as RespostaOverpass;
    } catch (erro) {
      if (erro instanceof Error && erro.name === "AbortError") {
        throw new Error(ERRO_TEMPO_ESGOTADO);
      }

      const repetivel = erro instanceof ErroHttp ? erro.status >= 500 : true;

      if (tentativa === 0 && repetivel) {
        await esperar(ESPERA_NOVA_TENTATIVA_MS);
        continue;
      }

      throw erro;
    } finally {
      clearTimeout(temporizador);
    }
  }

  throw new Error("Falha ao consultar o servidor.");
}

export async function buscarLocais(
  latitude: number,
  longitude: number,
  tipo: TipoLocal,
  raio = 5000,
): Promise<Local[]> {
  const filtros = obterFiltros(tipo);

  if (filtros.length === 0) {
    return [];
  }

  const minimo = tipo === "cinema" ? 1 : 5;

  const raios = montarRaios(raio);

  let locais: Local[] = [];

  let consultaConcluida = false;

  for (let indice = 0; indice < raios.length; indice += 1) {
    try {
      const dados = await consultarBackend({
        latitude,
        longitude,
        tipo,
        raio: raios[indice],
        filtros,
      });

      consultaConcluida = true;

      locais = processarElementos(dados.elements, latitude, longitude);

      if (__DEV__) {
        const comHorario = locais.filter((local) => local.horario).length;

        const comSite = locais.filter(
          (local) => local.website || local.instagram || local.facebook,
        ).length;

        console.log(
          `[locais] ${tipo}: ${locais.length} lugares · ${comHorario} com horário · ${comSite} com site ou rede social (raio de ${raios[indice]} m)`,
        );
      }

      if (locais.length >= minimo) {
        break;
      }
    } catch (erro) {
      if (!consultaConcluida) {
        console.warn("Falha na busca de locais:", erro);

        throw erro;
      }

      if (__DEV__) {
        console.warn(
          `[locais] ${tipo}: a busca com raio de ${raios[indice]} m falhou; usando o resultado anterior.`,
          erro,
        );
      }

      break;
    }
  }

  return locais.slice(0, LIMITE_RESULTADOS);
}

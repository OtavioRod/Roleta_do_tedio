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
  tags?: {
    name?: string;
    brand?: string;
    operator?: string;
    "addr:street"?: string;
    "addr:housenumber"?: string;
    "addr:city"?: string;
  };
};

type RespostaOverpass = {
  elements: ElementoOverpass[];
};

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

function obterFiltros(tipo: TipoLocal): string[] {
  switch (tipo) {
    case "restaurante":
      return ['nwr["amenity"="restaurant"]', 'nwr["amenity"="fast_food"]'];

    case "cafe":
      return ['nwr["amenity"="cafe"]'];

    case "cinema":
      return ['nwr["amenity"="cinema"]'];

    case "parque":
      return ['nwr["leisure"="park"]'];

    case "passeio":
      return [
        'nwr["tourism"="attraction"]',
        'nwr["tourism"="museum"]',
        'nwr["tourism"="gallery"]',
        'nwr["tourism"="viewpoint"]',
      ];

    default:
      return [];
  }
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
  const cidade = elemento.tags?.["addr:city"];

  const endereco = [rua, numero, cidade].filter(Boolean).join(", ");

  return endereco || "Endereço não informado";
}

function transformarElemento(
  elemento: ElementoOverpass,
  index: number,
): Local | null {
  const nome = obterNome(elemento);
  const coordenadas = obterCoordenadas(elemento);

  if (!nome || !coordenadas) {
    return null;
  }

  return {
    id: `${elemento.type}-${elemento.id}-${index}`,
    nome,
    latitude: coordenadas.latitude,
    longitude: coordenadas.longitude,
    endereco: obterEndereco(elemento),
  };
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

  const consultas = filtros
    .map((filtro) => `${filtro}(around:${raio},${latitude},${longitude});`)
    .join("\n");

  const consulta = `
    [out:json][timeout:25];
    (
      ${consultas}
    );
    out center tags;
  `;

  const resposta = await fetch(
    `${OVERPASS_URL}?data=${encodeURIComponent(consulta)}`,
  );

  if (!resposta.ok) {
    throw new Error(`Erro ao consultar Overpass: ${resposta.status}`);
  }

  const dados: RespostaOverpass = await resposta.json();

  const locais = dados.elements
    .map(transformarElemento)
    .filter((local): local is Local => local !== null);

  const locaisUnicos = locais.filter(
    (local, index, lista) =>
      lista.findIndex(
        (item) =>
          item.nome.toLowerCase() === local.nome.toLowerCase() &&
          Math.abs(item.latitude - local.latitude) < 0.0001 &&
          Math.abs(item.longitude - local.longitude) < 0.0001,
      ) === index,
  );

  return locaisUnicos.slice(0, 20);
}

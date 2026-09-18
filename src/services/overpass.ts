const BACKEND_URL = "https://roleta-do-tedio.onrender.com";

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

//const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

function obterFiltros(tipo: TipoLocal): string[] {
  switch (tipo) {
    case "restaurante":
      return [
        'nwr["amenity"="restaurant"]',
        'nwr["amenity"="fast_food"]',
        'nwr["amenity"="food_court"]',
      ];

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
  raio = 10000,
): Promise<Local[]> {
  console.log("    INICIANDO BUSCA OVERPASS    ");

  console.log("Tipo recebido:", tipo);

  console.log("Latitude recebida:", latitude);

  console.log("Longitude recebida:", longitude);

  console.log("Raio da busca:", raio, "metros");

  const filtros = obterFiltros(tipo);

  console.log("Filtros utilizados:", filtros);

  if (filtros.length === 0) {
    console.log("Nenhum filtro encontrado para o tipo:", tipo);

    return [];
  } try {
    const resposta = await fetch(`${BACKEND_URL}/locais`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        latitude,
        longitude,
        tipo,
        raio,
        filtros,
      }),
    });

    console.log("Status da resposta do backend:", resposta.status);

    if (!resposta.ok) {
      throw new Error(`Erro ao consultar backend: ${resposta.status}`);
    }

    const dados: RespostaOverpass = await resposta.json();

    console.log(
      "Quantidade de elementos encontrados:",
      dados.elements.length,
    );

    console.log(
      "Primeiros elementos encontrados:",
      dados.elements.slice(0, 5),
    );

    const locais = dados.elements
      .map(transformarElemento)
      .filter((local): local is Local => local !== null);

    console.log(
      "Quantidade de locais após transformação:",
      locais.length,
    );

    console.log("Locais transformados:", locais.slice(0, 5));

    const locaisUnicos = locais.filter(
      (local, index, lista) =>
        lista.findIndex(
          (item) =>
            item.nome.toLowerCase() === local.nome.toLowerCase() &&
            Math.abs(item.latitude - local.latitude) < 0.0001 &&
            Math.abs(item.longitude - local.longitude) < 0.0001,
        ) === index,
    );

    console.log(
      "Quantidade de locais únicos:",
      locaisUnicos.length,
    );

    console.log(
      "Locais finais:",
      locaisUnicos.slice(0, 20),
    );

    console.log("   FIM DA BUSCA OVERPASS   ");

    return locaisUnicos.slice(0, 20);
  } catch (erro) {
    console.error("ERRO NA BUSCA OVERPASS:", erro);

    throw erro;
  }
}


const resposta = await fetch(`${BACKEND_URL}/locais`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    latitude,
    longitude,
    tipo,
    raio,
    filtros,
  }),
});

console.log("Status da resposta Overpass:", resposta.status);

if (!resposta.ok) {
  throw new Error(`Erro ao consultar Overpass: ${resposta.status}`);
}

const dados: RespostaOverpass = await resposta.json();

console.log("Quantidade de elementos encontrados:", dados.elements.length);

console.log("Primeiros elementos encontrados:", dados.elements.slice(0, 5));

const locais = dados.elements
  .map(transformarElemento)
  .filter((local): local is Local => local !== null);

console.log("Quantidade de locais após transformação:", locais.length);

console.log("Locais transformados:", locais.slice(0, 5));

const locaisUnicos = locais.filter(
  (local, index, lista) =>
    lista.findIndex(
      (item) =>
        item.nome.toLowerCase() === local.nome.toLowerCase() &&
        Math.abs(item.latitude - local.latitude) < 0.0001 &&
        Math.abs(item.longitude - local.longitude) < 0.0001,
    ) === index,
);

console.log("Quantidade de locais únicos:", locaisUnicos.length);

console.log("Locais finais:", locaisUnicos.slice(0, 20));

console.log("   FIM DA BUSCA OVERPASS   ");

return locaisUnicos.slice(0, 20);
} catch (erro) {
  console.error("ERRO NA BUSCA OVERPASS:", erro);

  throw erro;
}
}

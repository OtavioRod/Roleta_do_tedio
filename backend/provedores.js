const INTERVALO_NOMINATIM_MS = () =>
  process.env.NOMINATIM_INTERVALO_MS !== undefined
    ? Number(process.env.NOMINATIM_INTERVALO_MS)
    : 1100;

const TEMPO_LIMITE_MS = 12000;

const CONSULTAS_NOMINATIM = {
  restaurante: [{ amenity: "restaurant" }],
  cafe: [{ amenity: "cafe" }, { q: "cafeteria" }],
  cinema: [{ amenity: "cinema" }],
  parque: [{ q: "parque" }, { q: "praça" }],
  passeio: [{ q: "museu" }, { q: "mirante" }, { q: "ponto turístico" }],
};

const TIPOS_GOOGLE = {
  restaurante: ["restaurant"],
  cafe: ["cafe", "coffee_shop"],
  cinema: ["movie_theater"],
  parque: ["park"],
  passeio: ["tourist_attraction", "museum", "art_gallery"],
};

const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let filaNominatim = Promise.resolve();
let ultimaChamadaNominatim = 0;

function aguardarVezNominatim() {
  const vez = filaNominatim.then(async () => {
    const espera = ultimaChamadaNominatim + INTERVALO_NOMINATIM_MS() - Date.now();

    if (espera > 0) {
      await esperar(espera);
    }

    ultimaChamadaNominatim = Date.now();
  });

  filaNominatim = vez.catch(() => undefined);

  return vez;
}

function limparTags(tags) {
  const resultado = {};

  for (const [chave, valor] of Object.entries(tags)) {
    if (typeof valor === "string" && valor.trim() !== "") {
      resultado[chave] = valor.trim();
    }
  }

  return resultado;
}

function caixaDeBusca(latitude, longitude, raio) {
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

function converterNominatim(resultado) {
  const tipoOsm = resultado.osm_type;
  const idOsm = Number(resultado.osm_id);
  const latitude = Number(resultado.lat);
  const longitude = Number(resultado.lon);

  if (
    !["node", "way", "relation"].includes(tipoOsm) ||
    !Number.isFinite(idOsm) ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    return null;
  }

  const endereco = resultado.address ?? {};
  const extras = resultado.extratags ?? {};

  const nome =
    resultado.name ||
    (typeof resultado.display_name === "string"
      ? resultado.display_name.split(",")[0]
      : "");

  if (!nome) {
    return null;
  }

  return {
    type: tipoOsm,
    id: idOsm,
    lat: latitude,
    lon: longitude,
    tags: limparTags({
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

async function buscarNominatim({ latitude, longitude, raio, tipo }) {
  const consultas = CONSULTAS_NOMINATIM[tipo] ?? [];

  const vistos = new Set();
  const elementos = [];

  for (const consulta of consultas) {
    const parametros = new URLSearchParams({
      format: "jsonv2",
      limit: "30",
      addressdetails: "1",
      extratags: "1",
      "accept-language": "pt-BR",
      viewbox: caixaDeBusca(latitude, longitude, raio),
      bounded: "1",
      ...consulta,
    });

    try {
      await aguardarVezNominatim();

      const resposta = await fetch(
        `https://nominatim.openstreetmap.org/search?${parametros.toString()}`,
        {
          headers: {
            Accept: "application/json",
            "User-Agent":
              process.env.NOMINATIM_USER_AGENT || "RoletaDoTedio/1.0",
          },
          signal: AbortSignal.timeout(TEMPO_LIMITE_MS),
        },
      );

      if (!resposta.ok) {
        continue;
      }

      const dados = await resposta.json();

      if (!Array.isArray(dados)) {
        continue;
      }

      for (const item of dados) {
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
    } catch (erro) {
      console.error("Falha ao consultar o Nominatim:", erro.message);
    }
  }

  return elementos;
}

function numeroDoTexto(texto) {
  let hash = 7;

  for (let indice = 0; indice < texto.length; indice += 1) {
    hash = (hash * 31 + texto.charCodeAt(indice)) % 2147483647;
  }

  return hash;
}

function converterGoogle(lugar) {
  const nome = lugar.displayName && lugar.displayName.text;
  const local = lugar.location;

  if (
    !nome ||
    !local ||
    !Number.isFinite(local.latitude) ||
    !Number.isFinite(local.longitude)
  ) {
    return null;
  }

  return {
    type: "node",
    id: numeroDoTexto(String(lugar.id || nome)),
    lat: local.latitude,
    lon: local.longitude,
    tags: limparTags({
      name: nome,
      "addr:street": lugar.formattedAddress,
      website: lugar.websiteUri,
      "google:uri": lugar.googleMapsUri,
      "google:place_id": lugar.id,
      fonte: "google",
    }),
  };
}

async function buscarGoogle({ latitude, longitude, raio, tipo }) {
  const chave = process.env.GOOGLE_MAPS_API_KEY;
  const tipos = TIPOS_GOOGLE[tipo];

  if (!chave || !tipos) {
    return [];
  }

  try {
    const resposta = await fetch(
      "https://places.googleapis.com/v1/places:searchNearby",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": chave,
          "X-Goog-FieldMask":
            "places.id,places.displayName,places.formattedAddress,places.location,places.googleMapsUri,places.websiteUri",
        },
        body: JSON.stringify({
          includedTypes: tipos,
          maxResultCount: 20,
          rankPreference: "DISTANCE",
          languageCode: "pt-BR",
          regionCode: "BR",
          locationRestriction: {
            circle: {
              center: { latitude, longitude },
              radius: Math.min(raio, 50000),
            },
          },
        }),
        signal: AbortSignal.timeout(TEMPO_LIMITE_MS),
      },
    );

    if (!resposta.ok) {
      console.error("Google Places respondeu com erro:", resposta.status);

      return [];
    }

    const dados = await resposta.json();

    if (!dados || !Array.isArray(dados.places)) {
      return [];
    }

    return dados.places.map(converterGoogle).filter(Boolean);
  } catch (erro) {
    console.error("Falha ao consultar o Google Places:", erro.message);

    return [];
  }
}

module.exports = {
  buscarNominatim,
  buscarGoogle,
  caixaDeBusca,
  converterNominatim,
  converterGoogle,
};

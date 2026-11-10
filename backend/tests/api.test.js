process.env.OVERPASS_ESPERA_VAZIA_MS = "60";
process.env.NOMINATIM_INTERVALO_MS = "0";

const { after, before, beforeEach, describe, it } = require("node:test");
const assert = require("node:assert/strict");

const consultasAoBanco = [];

const poolSimulado = {
  query: async (sql, parametros) => {
    consultasAoBanco.push({ sql, parametros });

    if (/INSERT/i.test(sql)) {
      return {
        rows: [{ id: 1, atividade: parametros[0], modalidade: parametros[1] }],
      };
    }

    return { rows: [{ id: 1, atividade: "Café", modalidade: null }] };
  },
};

const caminhoDb = require.resolve("../db");

require.cache[caminhoDb] = {
  id: caminhoDb,
  filename: caminhoDb,
  loaded: true,
  exports: poolSimulado,
};

const ELEMENTO = {
  type: "node",
  id: 1,
  lat: -22.9,
  lon: -42.5,
  tags: { name: "Café Teste", amenity: "cafe" },
};

let comportamentos = {};
let chamadasOverpass = 0;

const fetchReal = global.fetch;

function responder(corpo, status = 200) {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const HOSTS = [
  "overpass.private.coffee",
  "maps.mail.ru",
  "overpass-api.de",
  "overpass.kumi.systems",
  "overpass.openstreetmap.fr",
];

const NOMINATIM = "nominatim.openstreetmap.org";
const GOOGLE = "places.googleapis.com";

function definirOverpass(porHost) {
  comportamentos = porHost;
}

global.fetch = async (url, opcoes) => {
  const endereco = String(url);

  if (endereco.startsWith("http://127.0.0.1")) {
    return fetchReal(url, opcoes);
  }

  chamadasOverpass += 1;

  const host = new URL(endereco).hostname;

  const comportamento = comportamentos[host];

  if (!comportamento) {
    return responder({ elements: [] });
  }

  return comportamento(endereco, opcoes);
};

const app = require("../server");

let servidor;
let base;

const FILTROS = ['nwr["amenity"="cafe"]', 'nwr["shop"="coffee"]'];

let proximaLatitude = -22.0;

function corpoValido(extra = {}) {
  proximaLatitude -= 0.01; // cada teste usa uma posição nova para não pegar cache

  return {
    latitude: proximaLatitude,
    longitude: -42.5,
    tipo: "cafe",
    raio: 5000,
    filtros: FILTROS,
    ...extra,
  };
}

async function post(caminho, corpo) {
  const resposta = await fetch(`${base}${caminho}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(corpo),
  });

  return { status: resposta.status, corpo: await resposta.json() };
}

const consoleOriginal = { log: console.log, error: console.error };

before(async () => {
  console.log = () => undefined;
  console.error = () => undefined;

  await new Promise((resolve) => {
    servidor = app.listen(0, "127.0.0.1", resolve);
  });

  base = `http://127.0.0.1:${servidor.address().port}`;
});

after(async () => {
  console.log = consoleOriginal.log;
  console.error = consoleOriginal.error;

  global.fetch = fetchReal;

  await new Promise((resolve) => servidor.close(resolve));
});

beforeEach(() => {
  comportamentos = {};
  chamadasOverpass = 0;
  consultasAoBanco.length = 0;
});

describe("GET /", () => {
  it("responde que o backend está no ar", async () => {
    const resposta = await fetchReal(`${base}/`);

    assert.equal(resposta.status, 200);
    assert.match((await resposta.json()).mensagem, /funcionando/);
  });
});

describe("POST /locais — validação de entrada", () => {
  const invalidos = {
    "sem filtros": { filtros: undefined },
    "lista de filtros vazia": { filtros: [] },
    "filtros demais": { filtros: Array(13).fill('nwr["amenity"="cafe"]') },
    "filtro que tenta injetar comandos": {
      filtros: ['nwr["amenity"="cafe"];out;(._;>;);node["x"="y"]'],
    },
    "filtro que não é texto": { filtros: [42] },
    "raio gigante (usar o servidor como proxy aberto)": { raio: 1000000000 },
    "raio pequeno demais": { raio: 10 },
    "raio em texto": { raio: "5000" },
    "latitude fora do mundo": { latitude: 999 },
    "longitude fora do mundo": { longitude: -999 },
    "latitude em texto": { latitude: "-22.9" },
    "latitude infinita": { latitude: null },
  };

  for (const [nome, extra] of Object.entries(invalidos)) {
    it(`recusa ${nome}`, async () => {
      const { status } = await post("/locais", corpoValido(extra));

      assert.equal(status, 400);
      assert.equal(
        chamadasOverpass,
        0,
        "nem deveria ter consultado o Overpass",
      );
    });
  }

  it("aceita todos os filtros que o app realmente usa", async () => {
    definirOverpass({
      "overpass-api.de": async () => responder({ elements: [ELEMENTO] }),
    });

    const usados = [
      'nwr["amenity"="restaurant"]',
      'nwr["amenity"="cafe"]',
      'nwr["shop"="coffee"]',
      'nwr["amenity"="cinema"]',
      'nwr["leisure"="park"]',
      'nwr["tourism"="theme_park"]',
    ];

    const { status } = await post("/locais", corpoValido({ filtros: usados }));

    assert.equal(status, 200);
  });
});

describe("POST /locais — busca no Overpass", () => {
  it("[regressão] um espelho que responde vazio e rápido não vence quem tem resultado", async () => {
    definirOverpass({
      "overpass.private.coffee": async () => responder({ elements: [] }),
      "overpass-api.de": async () => {
        await esperar(30);

        return responder({ elements: [ELEMENTO] });
      },
    });

    const { status, corpo } = await post("/locais", corpoValido());

    assert.equal(status, 200);
    assert.equal(corpo.elements.length, 1);
  });

  it("[regressão] resposta vazia com aviso de erro do Overpass conta como falha", async () => {
    definirOverpass({
      "overpass.private.coffee": async () =>
        responder({
          elements: [],
          remark:
            'runtime error: Query timed out in "query" at line 3 after 26 seconds.',
        }),
      "overpass.kumi.systems": async () => {
        await esperar(30);

        return responder({ elements: [ELEMENTO] });
      },
    });

    const { status, corpo } = await post("/locais", corpoValido());

    assert.equal(status, 200);
    assert.equal(corpo.elements.length, 1);
  });

  it("se todos respondem vazio de verdade, devolve vazio", async () => {
    definirOverpass({});

    const { status, corpo } = await post("/locais", corpoValido());

    assert.equal(status, 200);
    assert.deepEqual(corpo.elements, []);
  });

  it("se todos os servidores falham, responde 500", async () => {
    definirOverpass(
      Object.fromEntries(
        HOSTS.map((host) => [host, async () => responder({ erro: "x" }, 503)]),
      ),
    );

    const { status, corpo } = await post("/locais", corpoValido());

    assert.equal(status, 500);
    assert.match(corpo.mensagem, /Erro ao buscar locais/);
  });

  it("guarda no cache o que tem resultado", async () => {
    definirOverpass({
      "overpass-api.de": async () => responder({ elements: [ELEMENTO] }),
    });

    const corpoFixo = corpoValido();

    await post("/locais", corpoFixo);

    const depoisDaPrimeira = chamadasOverpass;

    const segunda = await post("/locais", corpoFixo);

    assert.equal(segunda.status, 200);
    assert.equal(
      chamadasOverpass,
      depoisDaPrimeira,
      "a segunda busca deveria vir do cache",
    );
  });

  it("[regressão] não guarda no cache resultado vazio", async () => {
    const corpoFixo = corpoValido();

    await post("/locais", corpoFixo);

    const depoisDaPrimeira = chamadasOverpass;

    definirOverpass({
      "overpass-api.de": async () => responder({ elements: [ELEMENTO] }),
    });

    const segunda = await post("/locais", corpoFixo);

    assert.ok(chamadasOverpass > depoisDaPrimeira, "deveria consultar de novo");
    assert.equal(segunda.corpo.elements.length, 1);
  });
});

const RESULTADO_NOMINATIM = (id, nome) => ({
  osm_type: "node",
  osm_id: id,
  lat: "-22.91",
  lon: "-42.51",
  name: nome,
  address: {
    road: "Rua das Flores",
    house_number: "10",
    suburb: "Centro",
    city: "Saquarema",
  },
  extratags: {
    opening_hours: "Mo-Su 08:00-20:00",
    website: "https://exemplo.com",
  },
});

const LUGAR_GOOGLE = (id, nome) => ({
  id,
  displayName: { text: nome },
  formattedAddress: "Av. Oceânica, 100 - Saquarema",
  location: { latitude: -22.92, longitude: -42.52 },
  googleMapsUri: `https://maps.google.com/?cid=${id}`,
  websiteUri: "https://exemplo.com",
});

describe("POST /locais — Nominatim (busca do OpenStreetMap usada pelo Leaflet)", () => {
  it("entra quando o Overpass não encontra nada", async () => {
    definirOverpass({
      [NOMINATIM]: async () =>
        responder([
          RESULTADO_NOMINATIM(11, "Café do Mar"),
          RESULTADO_NOMINATIM(12, "Padaria Sol"),
        ]),
    });

    const { status, corpo } = await post("/locais", corpoValido());

    assert.equal(status, 200);
    assert.ok(corpo.fontes.includes("nominatim"));
    assert.ok(corpo.elements.length >= 2);

    const cafe = corpo.elements.find(
      (elemento) => elemento.tags.name === "Café do Mar",
    );

    assert.equal(cafe.tags.fonte, "nominatim");
    assert.equal(cafe.tags["addr:street"], "Rua das Flores");
    assert.equal(cafe.tags.opening_hours, "Mo-Su 08:00-20:00");
  });

  it("limita a busca à área pedida e se identifica", async () => {
    let enderecoChamado = "";
    let cabecalhos = {};

    definirOverpass({
      [NOMINATIM]: async (endereco, opcoes) => {
        enderecoChamado = endereco;
        cabecalhos = opcoes.headers;

        return responder([]);
      },
    });

    await post("/locais", corpoValido());

    const parametros = new URL(enderecoChamado).searchParams;

    assert.equal(parametros.get("bounded"), "1");
    assert.match(
      parametros.get("viewbox"),
      /^-?\d+\.\d+,-?\d+\.\d+,-?\d+\.\d+,-?\d+\.\d+$/,
    );
    assert.match(cabecalhos["User-Agent"], /RoletaDoTedio/);
  });

  it("não é consultado quando o Overpass já achou o suficiente", async () => {
    const lugares = Array.from({ length: 6 }, (_, indice) => ({
      ...ELEMENTO,
      id: 100 + indice,
    }));

    let chamadas = 0;

    definirOverpass({
      "overpass-api.de": async () => responder({ elements: lugares }),
      [NOMINATIM]: async () => {
        chamadas += 1;

        return responder([]);
      },
    });

    const { corpo } = await post("/locais", corpoValido());

    assert.equal(corpo.elements.length, 6);
    assert.equal(chamadas, 0);
  });

  it("ignora resposta de erro do Nominatim sem derrubar a busca", async () => {
    definirOverpass({
      "overpass-api.de": async () => responder({ elements: [ELEMENTO] }),
      [NOMINATIM]: async () => responder({ erro: "limite" }, 429),
    });

    const { status, corpo } = await post("/locais", corpoValido());

    assert.equal(status, 200);
    assert.equal(corpo.elements.length, 1);
  });
});

describe("POST /locais — Google Maps (Places API)", () => {
  beforeEach(() => {
    process.env.GOOGLE_MAPS_API_KEY = "chave-de-teste";
  });

  after(() => {
    delete process.env.GOOGLE_MAPS_API_KEY;
  });

  it("entra quando nem o Overpass nem o Nominatim encontram nada", async () => {
    let corpoEnviado = null;
    let cabecalhos = {};

    definirOverpass({
      [GOOGLE]: async (endereco, opcoes) => {
        corpoEnviado = JSON.parse(opcoes.body);
        cabecalhos = opcoes.headers;

        return responder({ places: [LUGAR_GOOGLE("abc", "Cafeteria Praia")] });
      },
    });

    const { status, corpo } = await post("/locais", corpoValido());

    assert.equal(status, 200);
    assert.deepEqual(corpo.fontes, ["google"]);

    const lugar = corpo.elements[0];

    assert.equal(lugar.tags.name, "Cafeteria Praia");
    assert.equal(lugar.tags.fonte, "google");
    assert.equal(lugar.tags["google:uri"], "https://maps.google.com/?cid=abc");
    assert.equal(lugar.tags["addr:street"], "Av. Oceânica, 100 - Saquarema");

    assert.deepEqual(corpoEnviado.includedTypes, ["cafe", "coffee_shop"]);
    assert.equal(corpoEnviado.locationRestriction.circle.radius, 5000);
    assert.equal(cabecalhos["X-Goog-Api-Key"], "chave-de-teste");
    assert.match(cabecalhos["X-Goog-FieldMask"], /places\.googleMapsUri/);
  });

  it("não gasta a cota do Google quando já há resultado do OpenStreetMap", async () => {
    let chamadas = 0;

    definirOverpass({
      "overpass-api.de": async () => responder({ elements: [ELEMENTO] }),
      [GOOGLE]: async () => {
        chamadas += 1;

        return responder({ places: [] });
      },
    });

    await post("/locais", corpoValido());

    assert.equal(chamadas, 0);
  });

  it("não usa o Google sem chave configurada", async () => {
    delete process.env.GOOGLE_MAPS_API_KEY;

    let chamadas = 0;

    definirOverpass({
      [GOOGLE]: async () => {
        chamadas += 1;

        return responder({ places: [LUGAR_GOOGLE("x", "Qualquer")] });
      },
    });

    const { corpo } = await post("/locais", corpoValido());

    assert.equal(chamadas, 0);
    assert.deepEqual(corpo.elements, []);
  });

  it("não guarda resultado do Google no cache (termos de uso)", async () => {
    let chamadas = 0;

    definirOverpass({
      [GOOGLE]: async () => {
        chamadas += 1;

        return responder({ places: [LUGAR_GOOGLE("abc", "Cafeteria Praia")] });
      },
    });

    const corpoFixo = corpoValido();

    await post("/locais", corpoFixo);
    await post("/locais", corpoFixo);

    assert.equal(chamadas, 2);
  });

  it("falha do Google não derruba a busca", async () => {
    definirOverpass({
      [GOOGLE]: async () =>
        responder({ error: { message: "chave inválida" } }, 403),
    });

    const { status, corpo } = await post("/locais", corpoValido());

    assert.equal(status, 200);
    assert.deepEqual(corpo.elements, []);
  });
});

describe("/sessoes", () => {
  it("recusa sessão sem atividade", async () => {
    const { status } = await post("/sessoes", { modalidade: "casal" });

    assert.equal(status, 400);
    assert.equal(consultasAoBanco.length, 0);
  });

  it("salva a sessão usando parâmetros (sem montar SQL com texto do usuário)", async () => {
    const malicioso = "'); DROP TABLE sessoes; --";

    const { status, corpo } = await post("/sessoes", {
      atividade: malicioso,
      modalidade: "amigos",
    });

    assert.equal(status, 201);
    assert.equal(corpo.sessao.atividade, malicioso);
    assert.deepEqual(consultasAoBanco[0].parametros, [malicioso, "amigos"]);
    assert.ok(!consultasAoBanco[0].sql.includes("DROP TABLE"));
  });

  it("lista as sessões", async () => {
    const resposta = await fetchReal(`${base}/sessoes`);

    assert.equal(resposta.status, 200);
    assert.ok(Array.isArray((await resposta.json()).sessoes));
  });

  it.todo(
    "GET /sessoes deveria exigir autenticação (hoje qualquer pessoa lista tudo)",
  );
  it.todo("POST /sessoes deveria ter limite de requisições por IP");
});

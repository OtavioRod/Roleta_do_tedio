import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

import { buscarDireto } from "../../src/services/buscaDireta";

const FILTROS = ['nwr["amenity"="restaurant"]'];

const ELEMENTO = {
  type: "node",
  id: 1,
  lat: -22.9,
  lon: -42.5,
  tags: { name: "Restaurante Teste" },
};

type Chamada = { endereco: string; opcoes?: RequestInit };

const fetchOriginal = globalThis.fetch;

let chamadas: Chamada[] = [];
let respostas: Record<string, (chamada: Chamada) => Promise<Response>> = {};

function json(corpo: unknown, status = 200) {
  return new Response(JSON.stringify(corpo), { status });
}

const esperar = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

beforeEach(() => {
  chamadas = [];
  respostas = {};

  globalThis.fetch = (async (entrada: RequestInfo | URL, opcoes?: RequestInit) => {
    const endereco = String(entrada);

    const chamada = { endereco, opcoes };

    chamadas.push(chamada);

    const host = new URL(endereco).hostname;

    const resposta = respostas[host];

    return resposta ? resposta(chamada) : json({ elements: [] });
  }) as typeof fetch;
});

afterEach(() => {
  globalThis.fetch = fetchOriginal;
});

describe("buscarDireto (sem chave, direto do aparelho)", () => {
  it("usa o Overpass e devolve o que achou", async () => {
    respostas["overpass-api.de"] = async () => json({ elements: Array(6).fill(ELEMENTO) });

    const { elementos, fontes } = await buscarDireto(-22.9, -42.5, 5000, "restaurante", FILTROS);

    assert.equal(elementos.length, 6);
    assert.deepEqual(fontes, ["overpass"]);
  });

  it("[regressão] um espelho que responde vazio e rápido não vence quem tem resultado", async () => {
    respostas["overpass.private.coffee"] = async () => json({ elements: [] });
    respostas["overpass-api.de"] = async () => {
      await esperar(30);

      return json({ elements: Array(6).fill(ELEMENTO) });
    };

    const { elementos } = await buscarDireto(-22.9, -42.5, 5000, "restaurante", FILTROS);

    assert.equal(elementos.length, 6);
  });

  it("[regressão] não envia cabeçalhos que obrigariam o navegador a pedir permissão (CORS)", async () => {
    respostas["overpass-api.de"] = async () => json({ elements: Array(6).fill(ELEMENTO) });

    await buscarDireto(-22.9, -42.5, 5000, "restaurante", FILTROS);

    for (const chamada of chamadas) {
      const cabecalhos = Object.keys((chamada.opcoes?.headers ?? {}) as Record<string, string>);

      assert.ok(
        cabecalhos.every((nome) => nome.toLowerCase() === "content-type"),
        `cabeçalhos extras em ${chamada.endereco}: ${cabecalhos.join(", ")}`,
      );
    }
  });

  it("monta a consulta com o raio e a posição pedidos", async () => {
    let corpo = "";

    respostas["overpass-api.de"] = async (chamada) => {
      corpo = decodeURIComponent(String(chamada.opcoes?.body).replace("data=", ""));

      return json({ elements: Array(6).fill(ELEMENTO) });
    };

    await buscarDireto(-22.9, -42.5, 7000, "restaurante", FILTROS);

    assert.match(corpo, /\[out:json\]/);
    assert.match(corpo, /nwr\["amenity"="restaurant"\]\(around:7000,-22.9,-42.5\)/);
    assert.match(corpo, /out center tags;/);
  });

  it("completa com o Nominatim quando o Overpass acha pouco", async () => {
    respostas["overpass-api.de"] = async () => json({ elements: [ELEMENTO] });
    respostas["nominatim.openstreetmap.org"] = async () =>
      json([
        {
          osm_type: "node",
          osm_id: 77,
          lat: "-22.91",
          lon: "-42.51",
          name: "Cantina do Porto",
          address: { road: "Rua do Porto", city: "Saquarema" },
        },
      ]);

    const { elementos, fontes } = await buscarDireto(-22.9, -42.5, 5000, "restaurante", FILTROS);

    assert.ok(fontes.includes("nominatim"));
    assert.ok(elementos.some((item) => item.tags?.name === "Cantina do Porto"));
  });

  it("devolve vazio sem erro quando as fontes respondem e não há lugares", async () => {
    const { elementos } = await buscarDireto(-22.9, -42.5, 5000, "restaurante", FILTROS);

    assert.deepEqual(elementos, []);
  });

  it("avisa com erro quando nenhuma fonte responde", async () => {
    globalThis.fetch = (async () => {
      throw new TypeError("Failed to fetch");
    }) as typeof fetch;

    await assert.rejects(
      buscarDireto(-22.9, -42.5, 5000, "restaurante", FILTROS),
      /não responderam/,
    );
  });
});

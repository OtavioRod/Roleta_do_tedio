// Testes de carga, estresse, pico e resistência do backend (k6).
//
//   k6 run -e PERFIL=carga     -e URL=https://SEU-BACKEND testes/carga/k6-backend.js
//   k6 run -e PERFIL=estresse  ...
//   k6 run -e PERFIL=pico      ...
//   k6 run -e PERFIL=resistencia ...
//
// ATENÇÃO
//  - Rode contra um ambiente de TESTE (o /sessoes grava no banco só se ESCREVER=1).
//  - /locais depende de servidores públicos do Overpass. Por padrão este teste usa
//    sempre as mesmas coordenadas (respostas vêm do cache do backend) para NÃO
//    sobrecarregar esses servidores. Com LOCAIS_FRIO=1 cada requisição usa uma
//    posição nova e consulta o Overpass de verdade: use poucas VUs.

import http from "k6/http";
import { check, sleep } from "k6";

const URL_BASE = __ENV.URL || "http://localhost:3000";
const ESCREVER = __ENV.ESCREVER === "1";
const FRIO = __ENV.LOCAIS_FRIO === "1";

const PERFIS = {
  carga: [
    { duration: "1m", target: 20 },
    { duration: "5m", target: 20 },
    { duration: "30s", target: 0 },
  ],
  estresse: [
    { duration: "2m", target: 50 },
    { duration: "3m", target: 100 },
    { duration: "3m", target: 200 },
    { duration: "3m", target: 300 },
    { duration: "1m", target: 0 },
  ],
  pico: [
    { duration: "20s", target: 5 },
    { duration: "10s", target: 150 },
    { duration: "1m", target: 150 },
    { duration: "10s", target: 5 },
    { duration: "1m", target: 5 },
  ],
  resistencia: [
    { duration: "2m", target: 15 },
    { duration: "30m", target: 15 },
    { duration: "1m", target: 0 },
  ],
};

export const options = {
  stages: PERFIS[__ENV.PERFIL || "carga"],
  thresholds: {
    http_req_failed: ["rate<0.01"],
    "http_req_duration{rota:raiz}": ["p(95)<300"],
    "http_req_duration{rota:locais}": ["p(95)<1500"],
  },
};

const FILTROS = ['nwr["amenity"="cafe"]', 'nwr["shop"="coffee"]'];

export default function () {
  const raiz = http.get(`${URL_BASE}/`, { tags: { rota: "raiz" } });

  check(raiz, { "raiz responde 200": (r) => r.status === 200 });

  const latitude = FRIO ? -22.9 - Math.random() * 0.5 : -22.9;

  const locais = http.post(
    `${URL_BASE}/locais`,
    JSON.stringify({
      latitude,
      longitude: -42.5,
      tipo: "cafe",
      raio: 5000,
      filtros: FILTROS,
    }),
    { headers: { "Content-Type": "application/json" }, tags: { rota: "locais" } },
  );

  check(locais, {
    "locais responde 200": (r) => r.status === 200,
    "locais devolve a lista": (r) => Array.isArray(r.json("elements")),
  });

  const invalido = http.post(
    `${URL_BASE}/locais`,
    JSON.stringify({ latitude: 0, longitude: 0, raio: 1e9, filtros: ["x"] }),
    { headers: { "Content-Type": "application/json" }, tags: { rota: "invalido" } },
  );

  check(invalido, { "entrada inválida é recusada com 400": (r) => r.status === 400 });

  if (ESCREVER) {
    const sessao = http.post(
      `${URL_BASE}/sessoes`,
      JSON.stringify({ atividade: "Teste de carga", modalidade: "k6" }),
      { headers: { "Content-Type": "application/json" }, tags: { rota: "sessoes" } },
    );

    check(sessao, { "sessão salva": (r) => r.status === 201 });
  }

  sleep(1);
}

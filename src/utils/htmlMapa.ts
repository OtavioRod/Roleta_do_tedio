import { MarcadorMapa } from "./marcadoresMapa";

function paraJsonSeguro(valor: unknown) {
  return JSON.stringify(valor)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

export function montarHtmlMapa(
  latitude: number,
  longitude: number,
  marcadores: MarcadorMapa[],
  escala: number,
) {
  const dados = paraJsonSeguro(marcadores);

  const lat = Number.isFinite(latitude) ? latitude : 0;
  const lon = Number.isFinite(longitude) ? longitude : 0;

  const fonte = Math.round(15 * escala);
  const fonteTitulo = Math.round(fonte * 1.15);

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<style>
html, body, #map { width: 100%; height: 100%; margin: 0; padding: 0; }
body { overflow: hidden; font-family: sans-serif; }
.pino { width: 30px; height: 30px; border-radius: 50%; border: 3px solid #ffffff; box-shadow: 0 1px 5px rgba(0,0,0,0.6); color: #ffffff; font-weight: bold; font-size: 15px; line-height: 24px; text-align: center; box-sizing: border-box; }
.aberto { background: #1b5e20; }
.fechado { background: #b00020; }
.desconhecido { background: #555555; }
.usuario { background: #0b5fff; }
.balao { font-size: ${fonte}px; line-height: 1.4; min-width: 190px; }
.balao h3 { margin: 0 0 6px 0; font-size: ${fonteTitulo}px; }
.balao p { margin: 0 0 6px 0; }
.balao button { display: block; width: 100%; margin-top: 6px; padding: 9px; font-size: ${fonte}px; font-weight: 600; border: 2px solid #0b5fff; border-radius: 6px; background: #0b5fff; color: #ffffff; }
.balao button.sec { background: #ffffff; color: #0b5fff; }
</style>
</head>
<body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
(function () {
  var marcadores = ${dados};
  var simbolos = { aberto: "●", fechado: "○", desconhecido: "?", usuario: "★" };

  var mapa = L.map("map").setView([${lat}, ${lon}], 14);

  mapa.attributionControl.setPrefix(false);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(mapa);

  function abrir(url) {
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(url);
    } else {
      window.open(url, "_blank", "noopener");
    }
  }

  mapa.attributionControl.getContainer().addEventListener("click", function (evento) {
    var link = evento.target.closest("a");

    if (link) {
      evento.preventDefault();
      abrir(link.href);
    }
  });

  function criarBotao(texto, url, secundario) {
    var botao = document.createElement("button");

    botao.type = "button";
    botao.textContent = texto;

    if (secundario) {
      botao.className = "sec";
    }

    botao.addEventListener("click", function () {
      abrir(url);
    });

    return botao;
  }

  marcadores.forEach(function (m) {
    var estado = simbolos[m.estado] ? m.estado : "desconhecido";

    var icone = L.divIcon({
      className: "",
      html: '<div class="pino ' + estado + '">' + simbolos[estado] + "</div>",
      iconSize: [30, 30],
      iconAnchor: [15, 15],
      popupAnchor: [0, -15]
    });

    var marcador = L.marker([m.latitude, m.longitude], {
      icon: icone,
      title: m.nome,
      alt: m.nome
    }).addTo(mapa);

    var balao = document.createElement("div");
    balao.className = "balao";

    var titulo = document.createElement("h3");
    titulo.textContent = m.nome;
    balao.appendChild(titulo);

    function linha(texto) {
      if (!texto) {
        return;
      }

      var paragrafo = document.createElement("p");
      paragrafo.textContent = texto;
      balao.appendChild(paragrafo);
    }

    linha(m.status ? simbolos[estado] + " " + m.status : "");
    linha(m.distancia);
    linha(m.endereco);

    if (m.rota) {
      balao.appendChild(criarBotao("Como chegar", m.rota, false));
    }

    if (m.conferir) {
      balao.appendChild(criarBotao("Ver no Google Maps", m.conferir, true));
    }

    if (m.dados) {
      balao.appendChild(criarBotao("Dados no OpenStreetMap", m.dados, true));
    }

    marcador.bindPopup(balao);
  });

  if (marcadores.length > 1) {
    var pontos = marcadores.map(function (m) {
      return [m.latitude, m.longitude];
    });

    mapa.fitBounds(L.latLngBounds(pontos), { padding: [30, 30] });
  }
})();
</script>
</body>
</html>`;
}

import { useEffect } from "react";

import { usePreferencias } from "../context/PreferenciasContext";

const ID_CONTAINER = "vlibras-container";
const ID_SCRIPT = "vlibras-script";
const URL_APP = "https://vlibras.gov.br/app";

type VLibrasGlobal = {
  VLibras?: { Widget: new (caminho: string) => unknown };
};

let widgetCriado = false;

function criarWidget() {
  const global = window as unknown as VLibrasGlobal;

  if (!widgetCriado && global.VLibras) {
    new global.VLibras.Widget(URL_APP);

    widgetCriado = true;
  }
}

export default function VLibrasWidget() {
  const { libras } = usePreferencias();

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    let container = document.getElementById(ID_CONTAINER);

    if (!container) {
      container = document.createElement("div");
      container.id = ID_CONTAINER;
      container.setAttribute("vw", "");
      container.className = "enabled";
      container.innerHTML =
        '<div vw-access-button class="active"></div>' +
        '<div vw-plugin-wrapper><div class="vw-plugin-top-wrapper"></div></div>';

      document.body.appendChild(container);
    }

    container.style.display = libras ? "block" : "none";

    if (!libras) {
      return;
    }

    const existente = document.getElementById(ID_SCRIPT);

    if (existente) {
      criarWidget();
      return;
    }

    const script = document.createElement("script");

    script.id = ID_SCRIPT;
    script.src = "https://vlibras.gov.br/app/vlibras-plugin.js";
    script.async = true;
    script.onload = criarWidget;

    document.body.appendChild(script);
  }, [libras]);

  return null;
}

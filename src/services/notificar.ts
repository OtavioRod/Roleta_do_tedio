import { AppState, Platform } from "react-native";

import { exibirNotificacaoLocal } from "./permissoes";
import { NomeSom, tocarSom } from "./sons";

export type Aviso = {
  id: number;
  titulo: string;
  texto?: string;
};

type Ouvinte = (aviso: Aviso) => void;

const ouvintes = new Set<Ouvinte>();

let contador = 0;
let sistemaPermitido = true;

export function observarAvisos(ouvinte: Ouvinte) {
  ouvintes.add(ouvinte);

  return () => {
    ouvintes.delete(ouvinte);
  };
}

export function definirSistemaPermitido(permitido: boolean) {
  sistemaPermitido = permitido;
}

export function aplicativoEmSegundoPlano() {
  if (Platform.OS === "web") {
    return typeof document !== "undefined" && document.hidden;
  }

  return AppState.currentState !== "active";
}

type OpcoesNotificar = {
  titulo: string;
  texto?: string;
  som?: NomeSom | "nenhum";
  quando?: "sempre" | "segundoPlano";
  naTela?: boolean;
};

export function notificar({
  titulo,
  texto,
  som = "notificacao",
  quando = "sempre",
  naTela = true,
}: OpcoesNotificar) {
  const segundoPlano = aplicativoEmSegundoPlano();

  if (quando === "segundoPlano" && !segundoPlano) {
    return;
  }

  if (som !== "nenhum") {
    tocarSom(som);
  }

  if (segundoPlano) {
    if (sistemaPermitido) {
      exibirNotificacaoLocal(titulo, texto ?? "").catch(() => undefined);
    }

    return;
  }

  if (!naTela) {
    return;
  }

  contador += 1;

  const aviso: Aviso = { id: contador, titulo, texto };

  ouvintes.forEach((ouvinte) => ouvinte(aviso));
}

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

import { normalizarCodigo } from "../utils/codigos";

const CHAVE_PENDENTE = "roleta-do-tedio:sala-pendente";

export function extrairCodigoDeLink(url: string | null | undefined) {
  if (!url) {
    return null;
  }

  const encontrado = url.match(/\/sala\/([A-Za-z0-9]{4,10})(?:[/?#]|$)/);

  if (!encontrado) {
    return null;
  }

  const codigo = normalizarCodigo(encontrado[1]);

  return codigo.length >= 4 ? codigo : null;
}

let pendenteEmMemoria: string | null =
  Platform.OS === "web" && typeof window !== "undefined"
    ? extrairCodigoDeLink(window.location.href)
    : null;

export function montarLinkSala(codigo: string) {
  const origem =
    Platform.OS === "web" && typeof window !== "undefined"
      ? window.location.origin
      : (process.env.EXPO_PUBLIC_SITE_URL ?? "");

  if (origem) {
    return `${origem.replace(/\/$/, "")}/sala/${codigo}`;
  }

  return `roletadotedio://sala/${codigo}`;
}

export async function guardarSalaPendente(codigo: string) {
  pendenteEmMemoria = codigo;

  try {
    await AsyncStorage.setItem(CHAVE_PENDENTE, codigo);
  } catch {}
}

export async function lerEConsumirSalaPendente() {
  let codigo = pendenteEmMemoria;

  pendenteEmMemoria = null;

  try {
    const guardado = await AsyncStorage.getItem(CHAVE_PENDENTE);

    if (!codigo && guardado) {
      codigo = guardado;
    }

    if (guardado) {
      await AsyncStorage.removeItem(CHAVE_PENDENTE);
    }
  } catch {}

  return codigo;
}

export function existeSalaPendenteEmMemoria() {
  return pendenteEmMemoria !== null;
}

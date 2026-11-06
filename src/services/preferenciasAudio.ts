import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform, Vibration } from "react-native";

import { definirSomAtivo } from "./sons";

const CHAVE_ARMAZENAMENTO = "roleta-do-tedio:audio-vibracao";

export type PreferenciasAudio = {
  som: boolean;
  vibracao: boolean;
};

let atuais: PreferenciasAudio = { som: true, vibracao: true };

export function obterPreferenciasAudio() {
  return atuais;
}

export async function carregarPreferenciasAudio(): Promise<PreferenciasAudio> {
  try {
    const bruto = await AsyncStorage.getItem(CHAVE_ARMAZENAMENTO);

    if (bruto) {
      const dados = JSON.parse(bruto) as Partial<PreferenciasAudio>;

      atuais = {
        som: dados.som !== false,
        vibracao: dados.vibracao !== false,
      };
    }
  } catch {
    // mantém os valores padrão
  }

  definirSomAtivo(atuais.som);

  return atuais;
}

export async function salvarPreferenciasAudio(novas: PreferenciasAudio) {
  atuais = novas;

  definirSomAtivo(novas.som);

  try {
    await AsyncStorage.setItem(CHAVE_ARMAZENAMENTO, JSON.stringify(novas));
  } catch {
    // a preferência continua valendo nesta sessão
  }
}

export function vibrar(padrao: number | number[] = 200) {
  if (!atuais.vibracao) {
    return;
  }

  try {
    if (Platform.OS === "web") {
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(padrao);
      }

      return;
    }

    Vibration.vibrate(padrao);
  } catch {
    // aparelho sem vibração
  }
}

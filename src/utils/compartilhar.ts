import { Platform, Share } from "react-native";

export type ResultadoCompartilhar = "compartilhado" | "copiado" | "falhou";

export async function compartilharTexto(
  texto: string,
): Promise<ResultadoCompartilhar> {
  if (Platform.OS === "web") {
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ text: texto });

        return "compartilhado";
      }
    } catch {
      // segue para a cópia
    }

    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(texto);

        return "copiado";
      }
    } catch {
      return "falhou";
    }

    return "falhou";
  }

  try {
    await Share.share({ message: texto });

    return "compartilhado";
  } catch {
    return "falhou";
  }
}

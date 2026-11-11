import { useEffect, useState } from "react";
import { AccessibilityInfo, Platform } from "react-native";

export function useReduzirMovimento() {
  const [reduzir, setReduzir] = useState(false);

  useEffect(() => {
    if (Platform.OS === "web") {
      if (typeof window === "undefined" || !window.matchMedia) {
        return undefined;
      }

      const consulta = window.matchMedia("(prefers-reduced-motion: reduce)");

      setReduzir(consulta.matches);

      const aoMudar = (evento: MediaQueryListEvent) => setReduzir(evento.matches);

      consulta.addEventListener("change", aoMudar);

      return () => consulta.removeEventListener("change", aoMudar);
    }

    let ativo = true;

    AccessibilityInfo.isReduceMotionEnabled()
      .then((valor) => {
        if (ativo) {
          setReduzir(valor);
        }
      })
      .catch(() => undefined);

    const assinatura = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduzir,
    );

    return () => {
      ativo = false;
      assinatura.remove();
    };
  }, []);

  return reduzir;
}

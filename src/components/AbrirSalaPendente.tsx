import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { Linking } from "react-native";

import { useSessao } from "../context/SessaoContext";
import {
  extrairCodigoDeLink,
  guardarSalaPendente,
  lerEConsumirSalaPendente,
} from "../services/linkSala";

export default function AbrirSalaPendente() {
  const router = useRouter();

  const { carregando, usuario, emailOk, permissoesConcluidas } = useSessao();

  const liberado = !carregando && Boolean(usuario) && emailOk && permissoesConcluidas;

  const liberadoRef = useRef(liberado);

  liberadoRef.current = liberado;

  useEffect(() => {
    let ativo = true;

    Linking.getInitialURL()
      .then((url) => {
        const codigo = extrairCodigoDeLink(url);

        if (ativo && codigo) {
          guardarSalaPendente(codigo).catch(() => undefined);
        }
      })
      .catch(() => undefined);

    const assinatura = Linking.addEventListener("url", ({ url }) => {
      const codigo = extrairCodigoDeLink(url);

      if (!codigo) {
        return;
      }

      if (liberadoRef.current) {
        router.push(`/sala/${codigo}`);
      } else {
        guardarSalaPendente(codigo).catch(() => undefined);
      }
    });

    return () => {
      ativo = false;
      assinatura.remove();
    };
  }, [router]);

  useEffect(() => {
    if (!liberado) {
      return;
    }

    let ativo = true;

    lerEConsumirSalaPendente()
      .then((codigo) => {
        if (ativo && codigo) {
          router.push(`/sala/${codigo}`);
        }
      })
      .catch(() => undefined);

    return () => {
      ativo = false;
    };
  }, [liberado, router]);

  return null;
}

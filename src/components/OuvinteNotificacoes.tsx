import { useRouter } from "expo-router";
import { useEffect } from "react";
import { Platform } from "react-native";

import { useSessao } from "../context/SessaoContext";
import { definirPushAtivo } from "../services/notificar";
import { registrarPush, removerPush } from "../services/push";

type Dados = Record<string, unknown> | undefined;

function codigoDaSala(dados: Dados) {
  const codigo = dados?.salaCodigo;

  return typeof codigo === "string" && codigo !== "" ? codigo : null;
}

export default function OuvinteNotificacoes() {
  const router = useRouter();

  const { carregando, usuario, perfil, emailOk, permissoesConcluidas } =
    useSessao();

  const ativo = !carregando && Boolean(usuario) && emailOk && permissoesConcluidas;

  const uid = usuario?.uid ?? "";

  const quer = perfil?.notificacoes.push === true;

  useEffect(() => {
    if (!ativo || !uid || Platform.OS === "web") {
      definirPushAtivo(false);

      return;
    }

    let valido = true;

    if (quer) {
      registrarPush(uid)
        .then((registrado) => {
          if (valido) {
            definirPushAtivo(registrado);
          }
        })
        .catch(() => definirPushAtivo(false));
    } else {
      definirPushAtivo(false);
      removerPush(uid).catch(() => undefined);
    }

    return () => {
      valido = false;
    };
  }, [ativo, uid, quer]);

  useEffect(() => {
    if (!ativo || Platform.OS === "web") {
      return undefined;
    }

    let assinatura: { remove: () => void } | null = null;
    let cancelado = false;

    import("expo-notifications")
      .then(async (modulo) => {
        if (cancelado) {
          return;
        }

        const abrir = (dados: Dados) => {
          const codigo = codigoDaSala(dados);

          if (codigo) {
            router.push(`/sala/${codigo}`);
          }
        };

        assinatura = modulo.addNotificationResponseReceivedListener(
          (resposta) => {
            abrir(
              resposta.notification.request.content.data as Dados,
            );
          },
        );

        const ultima = await modulo.getLastNotificationResponseAsync();

        if (ultima && !cancelado) {
          abrir(ultima.notification.request.content.data as Dados);
        }
      })
      .catch(() => undefined);

    return () => {
      cancelado = true;
      assinatura?.remove();
    };
  }, [ativo, router]);

  return null;
}

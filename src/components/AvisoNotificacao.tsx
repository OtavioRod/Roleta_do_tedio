import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, StyleSheet, View } from "react-native";

import { usePreferencias } from "../context/PreferenciasContext";
import { useSessao } from "../context/SessaoContext";
import { Amizade, observarAmizades } from "../services/amigos";
import { Aviso, notificar, observarAvisos } from "../services/notificar";
import Texto from "./Texto";
import TouchableLibras from "./TouchableLibras";

const DURACAO_AVISO_MS = 5000;

export default function AvisoNotificacao() {
  const { cores } = usePreferencias();

  const [aviso, setAviso] = useState<Aviso | null>(null);

  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const cancelar = observarAvisos((novo) => {
      setAviso(novo);

      AccessibilityInfo.announceForAccessibility?.(
        novo.texto ? `${novo.titulo}. ${novo.texto}` : novo.titulo,
      );

      if (temporizador.current) {
        clearTimeout(temporizador.current);
      }

      temporizador.current = setTimeout(() => setAviso(null), DURACAO_AVISO_MS);
    });

    return () => {
      cancelar();

      if (temporizador.current) {
        clearTimeout(temporizador.current);
      }
    };
  }, []);

  if (!aviso) {
    return null;
  }

  return (
    <View style={styles.area} pointerEvents="box-none">
      <TouchableLibras
        textoTraducao={
          aviso.texto ? `${aviso.titulo}. ${aviso.texto}` : aviso.titulo
        }
        onPress={() => setAviso(null)}
        activeOpacity={0.8}
        accessibilityRole="alert"
        accessibilityLabel={
          aviso.texto ? `${aviso.titulo}. ${aviso.texto}` : aviso.titulo
        }
        accessibilityHint="Toque para fechar o aviso"
        accessibilityLiveRegion="polite"
        style={[
          styles.faixa,
          { backgroundColor: cores.superficie, borderColor: cores.botao },
        ]}
      >
        <Texto librasIgnorado cabecalho style={styles.titulo}>
          {aviso.titulo}
        </Texto>

        {aviso.texto ? (
          <Texto librasIgnorado style={styles.texto}>
            {aviso.texto}
          </Texto>
        ) : null}
      </TouchableLibras>
    </View>
  );
}

export function NotificadorSocial() {
  const { usuario, emailOk, permissoesConcluidas } = useSessao();

  const ativo = Boolean(usuario) && emailOk && permissoesConcluidas;

  const uid = usuario?.uid ?? "";

  const anteriores = useRef<Map<string, Amizade> | null>(null);

  useEffect(() => {
    if (!ativo || !uid) {
      anteriores.current = null;

      return undefined;
    }

    anteriores.current = null;

    return observarAmizades(
      uid,
      (lista) => {
        const atuais = new Map(lista.map((amizade) => [amizade.id, amizade]));

        const antes = anteriores.current;

        anteriores.current = atuais;

        if (antes === null) {
          return;
        }

        for (const amizade of lista) {
          const anterior = antes.get(amizade.id);

          if (
            !anterior &&
            amizade.estado === "pendente" &&
            !amizade.solicitadaPorMim
          ) {
            notificar({
              titulo: `${amizade.amigoNome} quer ser seu amigo`,
              texto: "Abra Salas online > Gerenciar amigos para aceitar.",
              som: "convite",
            });
          }

          if (
            anterior &&
            anterior.estado === "pendente" &&
            amizade.estado === "aceita" &&
            amizade.solicitadaPorMim
          ) {
            notificar({
              titulo: `${amizade.amigoNome} aceitou seu pedido`,
              texto: "Agora vocês podem se chamar para as salas.",
              som: "entrou",
            });
          }
        }
      },
      () => undefined,
    );
  }, [ativo, uid]);

  return null;
}

const styles = StyleSheet.create({
  area: {
    position: "absolute",
    left: 8,
    right: 8,
    bottom: 16,
    alignItems: "center",
    zIndex: 45,
    elevation: 10,
  },

  faixa: {
    width: "100%",
    maxWidth: 520,
    borderWidth: 2,
    borderRadius: 14,
    padding: 14,
  },

  titulo: {
    fontSize: 17,
    fontWeight: "bold",
    marginBottom: 2,
  },

  texto: {
    fontSize: 15,
    lineHeight: 21,
  },
});

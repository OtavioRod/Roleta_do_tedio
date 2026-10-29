import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { AppState, Platform, StyleSheet, View } from "react-native";

import { usePreferencias } from "../context/PreferenciasContext";
import { useSessao } from "../context/SessaoContext";
import {
    Convite,
    observarConvitesRecebidos,
    responderConvite,
} from "../services/convites";
import { exibirNotificacaoLocal } from "../services/permissoes";
import { entrarNaSala } from "../services/salas";
import {
    codigoErroSocial,
    mensagemErroSocial,
} from "../utils/mensagensSociais";
import Botao from "./Botao";
import Texto from "./Texto";

function aplicativoEmSegundoPlano() {
  if (Platform.OS === "web") {
    return typeof document !== "undefined" && document.hidden;
  }

  return AppState.currentState !== "active";
}

export default function AvisoConvite() {
  const router = useRouter();

  const { cores } = usePreferencias();

  const { usuario, perfil, emailOk, permissoesConcluidas } = useSessao();

  const [convites, setConvites] = useState<Convite[]>([]);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState("");

  const conhecidos = useRef(new Set<string>());
  const primeiraLeitura = useRef(true);
  const querNotificar = useRef(false);

  const ativo = Boolean(usuario) && emailOk && permissoesConcluidas;

  const nome = perfil?.nome || usuario?.displayName || "Pessoa";

  querNotificar.current = perfil?.notificacoes.push === true;

  useEffect(() => {
    if (!usuario || !ativo) {
      setConvites([]);

      return undefined;
    }

    conhecidos.current = new Set();
    primeiraLeitura.current = true;

    return observarConvitesRecebidos(
      usuario.uid,
      (lista) => {
        setConvites(lista);

        for (const convite of lista) {
          if (conhecidos.current.has(convite.id)) {
            continue;
          }

          conhecidos.current.add(convite.id);

          if (
            !primeiraLeitura.current &&
            querNotificar.current &&
            aplicativoEmSegundoPlano()
          ) {
            exibirNotificacaoLocal(
              `${convite.deNome} chamou você`,
              `Sala ${convite.salaCodigo} da Roleta do Tédio`,
            );
          }
        }

        primeiraLeitura.current = false;
      },
      () => undefined,
    );
  }, [usuario, ativo]);

  const convite = convites[0];

  if (!ativo || !convite || !usuario) {
    return null;
  }

  async function aceitar(atual: Convite) {
    if (!usuario) {
      return;
    }

    setOcupado(true);
    setErro("");

    try {
      await entrarNaSala(atual.salaCodigo, { uid: usuario.uid, nome });

      await responderConvite(atual.id, true);

      router.push({
        pathname: "/sala/[codigo]",
        params: { codigo: atual.salaCodigo },
      });
    } catch (falha) {
      setErro(mensagemErroSocial(falha));

      if (codigoErroSocial(falha).startsWith("sala-")) {
        responderConvite(atual.id, false).catch(() => undefined);
      }
    } finally {
      setOcupado(false);
    }
  }

  async function recusar(atual: Convite) {
    setOcupado(true);

    try {
      await responderConvite(atual.id, false);
    } catch (falha) {
      setErro(mensagemErroSocial(falha));
    } finally {
      setOcupado(false);
    }
  }

  return (
    <View
      style={[
        styles.faixa,
        { backgroundColor: cores.fundo, borderColor: cores.botao },
      ]}
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
    >
      <Texto cabecalho style={styles.titulo}>
        {convite.deNome} chamou você
      </Texto>

      <Texto style={styles.texto}>
        Sala {convite.salaCodigo}
        {convites.length > 1 ? ` · mais ${convites.length - 1} convite(s)` : ""}
      </Texto>

      {erro !== "" && (
        <Texto style={[styles.texto, { color: cores.erro }]}>{erro}</Texto>
      )}

      <View style={styles.acoes}>
        <View style={styles.acao}>
          <Botao
            titulo="Entrar"
            onPress={() => aceitar(convite)}
            desabilitado={ocupado}
          />
        </View>

        <View style={styles.acao}>
          <Botao
            titulo="Recusar"
            secundario
            onPress={() => recusar(convite)}
            desabilitado={ocupado}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  faixa: {
    position: "absolute",
    top: 8,
    left: 8,
    right: 8,
    maxWidth: 520,
    alignSelf: "center",
    borderWidth: 2,
    borderRadius: 14,
    padding: 14,
    zIndex: 35,
    elevation: 8,
  },

  titulo: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },

  texto: {
    fontSize: 15,
    lineHeight: 21,
    marginBottom: 8,
  },

  acoes: {
    flexDirection: "row",
    gap: 8,
  },

  acao: {
    flex: 1,
  },
});

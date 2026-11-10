import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import Botao from "../components/Botao";
import CampoFormulario from "../components/CampoFormulario";
import Painel, { estiloPainel } from "../components/Painel";
import Texto from "../components/Texto";
import { usePreferencias } from "../context/PreferenciasContext";
import { useSessao } from "../context/SessaoContext";
import {
  criarSala,
  entrarNaSala,
  observarMinhasSalas,
  Sala,
  TipoSala,
} from "../services/salas";
import { normalizarCodigo } from "../utils/codigos";
import { mensagemErroSocial } from "../utils/mensagensSociais";

const ROTULO_ESTADO: Record<Sala["estado"], string> = {
  aguardando: "aguardando o grupo",
  respondendo: "rodada em andamento",
  resultado: "resultado pronto",
  encerrada: "encerrada",
};

export default function Salas() {
  const router = useRouter();

  const { cores } = usePreferencias();

  const { usuario, perfil } = useSessao();

  const nome = perfil?.nome || usuario?.displayName || "Pessoa";

  const [codigo, setCodigo] = useState("");
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [minhasSalas, setMinhasSalas] = useState<Sala[]>([]);

  const uid = usuario?.uid ?? "";

  useEffect(() => {
    if (!uid) {
      return undefined;
    }

    return observarMinhasSalas(uid, setMinhasSalas, () => setMinhasSalas([]));
  }, [uid]);

  function abrirSala(codigoSala: string) {
    router.push({ pathname: "/sala/[codigo]", params: { codigo: codigoSala } });
  }

  async function criar(tipo: TipoSala) {
    if (!usuario || ocupado) {
      return;
    }

    setOcupado(true);
    setErro("");

    try {
      abrirSala(await criarSala({ uid: usuario.uid, nome }, tipo));
    } catch (falha) {
      setErro(mensagemErroSocial(falha));
    } finally {
      setOcupado(false);
    }
  }

  async function entrar() {
    if (!usuario || ocupado) {
      return;
    }

    if (normalizarCodigo(codigo).length !== 6) {
      setErro("O código da sala tem 6 caracteres.");
      return;
    }

    setOcupado(true);
    setErro("");

    try {
      abrirSala(await entrarNaSala(codigo, { uid: usuario.uid, nome }));
    } catch (falha) {
      setErro(mensagemErroSocial(falha));
    } finally {
      setOcupado(false);
    }
  }

  return (
    <ScrollView
      contentContainerStyle={styles.conteudo}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.coluna}>
        <Texto cabecalho style={styles.titulo}>
          Salas online
        </Texto>

        <Texto style={[styles.intro, { color: cores.textoSecundario }]}>
          Junte a galera numa sala e deixe a roleta levar a culpa. Cada pessoa
          responde no próprio aparelho, e a roleta decide pelo grupo todo.
        </Texto>

        {minhasSalas.length > 0 && (
          <>
            <Texto cabecalho style={styles.secao}>
              Minhas salas ativas
            </Texto>

            {minhasSalas.map((sala, indice) => (
              <View
                key={sala.codigo}
                style={[styles.cartaoSala, estiloPainel(cores, true)]}
              >
                <View
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                  style={[
                    styles.icone,
                    {
                      backgroundColor: [cores.amarelo, cores.verde, cores.rosa][
                        indice % 3
                      ],
                      borderColor: cores.borda,
                    },
                  ]}
                >
                  <Texto librasIgnorado style={styles.emoji}>
                    🎲
                  </Texto>
                </View>

                <View style={styles.cartaoInfo}>
                  <Texto style={styles.cartaoTitulo}>
                    Sala {sala.codigo} ·{" "}
                    {sala.tipo === "casal" ? "casal" : "amigos"}
                  </Texto>

                  <Texto
                    style={[
                      styles.cartaoTexto,
                      { color: cores.textoSecundario },
                    ]}
                  >
                    {sala.membrosUids.length} de {sala.limite} pessoas ·{" "}
                    {ROTULO_ESTADO[sala.estado]}
                  </Texto>

                  <Botao
                    titulo="Voltar para a sala"
                    pequeno
                    onPress={() => abrirSala(sala.codigo)}
                  />
                </View>
              </View>
            ))}
          </>
        )}

        <Painel>
          <Texto cabecalho style={styles.secaoPainel}>
            Criar uma sala
          </Texto>

          <Botao
            titulo="Sala de casal (2 pessoas)"
            onPress={() => criar("casal")}
            desabilitado={ocupado}
          />

          <View style={styles.espaco} />

          <Botao
            titulo="Sala de amigos (até 10 pessoas)"
            onPress={() => criar("amigos")}
            desabilitado={ocupado}
          />
        </Painel>

        <Painel>
          <Texto cabecalho style={styles.secaoPainel}>
            Entrar com um código
          </Texto>

          <CampoFormulario
            rotulo="Código da sala"
            valor={codigo}
            aoMudar={(texto) => {
              setCodigo(normalizarCodigo(texto).slice(0, 6));
              setErro("");
            }}
            aoEnviar={entrar}
            maxLength={6}
          />

          <Botao
            titulo="Entrar na sala"
            secundario
            onPress={entrar}
            desabilitado={ocupado}
          />

          {erro !== "" && (
            <Texto
              accessibilityRole="alert"
              style={[styles.erro, { color: cores.erro }]}
            >
              {erro}
            </Texto>
          )}
        </Painel>

        <Botao
          titulo="Meus amigos"
          secundario
          onPress={() => router.push("/amigos")}
        />

        <View style={styles.espaco} />

        <Botao
          titulo="Jogar neste aparelho"
          secundario
          onPress={() => router.replace("/")}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  conteudo: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 100,
  },

  coluna: {
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
  },

  titulo: {
    fontSize: 40,
    lineHeight: 44,
    marginBottom: 8,
  },

  intro: {
    fontSize: 17,
    lineHeight: 24,
    marginBottom: 14,
  },

  secao: {
    fontSize: 26,
    marginTop: 12,
    marginBottom: 14,
  },

  secaoPainel: {
    fontSize: 24,
    marginBottom: 14,
  },

  erro: {
    fontSize: 15,
    fontWeight: "700",
    marginTop: 12,
  },

  espaco: {
    height: 12,
  },

  cartaoSala: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    padding: 16,
    marginBottom: 16,
    marginRight: 6,
  },

  icone: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },

  emoji: {
    fontSize: 22,
    lineHeight: 30,
    color: "#1E130F",
  },

  cartaoInfo: {
    flex: 1,
  },

  cartaoTitulo: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 2,
  },

  cartaoTexto: {
    fontSize: 15,
    marginBottom: 10,
  },
});

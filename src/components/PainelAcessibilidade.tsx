import { useEffect, useState } from "react";
import {
  BackHandler,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { usePreferencias } from "../context/PreferenciasContext";
import Botao from "./Botao";
import GuiaLibras from "./GuiaLibras";
import Texto from "./Texto";

export default function PainelAcessibilidade() {
  const insets = useSafeAreaInsets();

  const [aberto, setAberto] = useState(false);
  const [visao, setVisao] = useState<"ajustes" | "guia">("ajustes");

  const {
    cores,
    tema,
    escala,
    libras,
    podeAumentar,
    podeDiminuir,
    definirTema,
    aumentarFonte,
    diminuirFonte,
    redefinirFonte,
    alternarLibras,
    redefinirTudo,
  } = usePreferencias();

  const percentual = `${Math.round(escala * 100)}%`;

  function fechar() {
    setAberto(false);
    setVisao("ajustes");
  }

  useEffect(() => {
    if (!aberto || Platform.OS !== "android") {
      return undefined;
    }

    const assinatura = BackHandler.addEventListener("hardwareBackPress", () => {
      if (visao === "guia") {
        setVisao("ajustes");
        return true;
      }

      setAberto(false);

      return true;
    });

    return () => {
      assinatura.remove();
    };
  }, [aberto, visao]);

  return (
    <>
      <TouchableOpacity
        style={[
          styles.botaoFlutuante,
          Platform.OS === "web" ? { left: 25 } : { right: 25 },
          {
            bottom: 25 + insets.bottom,
            backgroundColor: cores.botao,
            borderColor: cores.fundo,
          },
        ]}
        onPress={() => setAberto(true)}
        accessibilityRole="button"
        accessibilityLabel="Abrir acessibilidade"
        accessibilityHint="Ajusta tamanho da letra, tema claro ou escuro e Libras"
      >
        <Text
          allowFontScaling={false}
          style={[styles.iconeFlutuante, { color: cores.botaoTexto }]}
        >
          Aa
        </Text>
      </TouchableOpacity>

      {aberto && (
        <View
          style={[styles.fundo, { backgroundColor: cores.sobreposicao }]}
          accessibilityViewIsModal
        >
          {visao === "ajustes" ? (
            <View
              style={[
                styles.painel,
                {
                  backgroundColor: cores.fundo,
                  borderColor: cores.borda,
                  paddingBottom: 16 + insets.bottom,
                },
              ]}
            >
              <ScrollView contentContainerStyle={styles.conteudo}>
                <Texto cabecalho style={styles.titulo}>
                  Acessibilidade
                </Texto>

                <Texto cabecalho style={styles.secao}>
                  Tamanho da letra
                </Texto>

                <Texto style={styles.valor} accessibilityLiveRegion="polite">
                  Tamanho atual: {percentual}
                </Texto>

                <View style={styles.linha}>
                  <View style={styles.metade}>
                    <Botao
                      titulo="A−"
                      rotulo="Diminuir letra"
                      onPress={diminuirFonte}
                      desabilitado={!podeDiminuir}
                    />
                  </View>

                  <View style={styles.metade}>
                    <Botao
                      titulo="A+"
                      rotulo="Aumentar letra"
                      onPress={aumentarFonte}
                      desabilitado={!podeAumentar}
                    />
                  </View>
                </View>

                <View style={styles.espaco} />

                <Botao
                  titulo="Tamanho padrão"
                  secundario
                  onPress={redefinirFonte}
                />

                <Texto cabecalho style={styles.secao}>
                  Tema
                </Texto>

                <View style={styles.linha}>
                  <View style={styles.metade}>
                    <Botao
                      titulo="Claro"
                      selecionado={tema === "claro"}
                      secundario={tema !== "claro"}
                      onPress={() => definirTema("claro")}
                    />
                  </View>

                  <View style={styles.metade}>
                    <Botao
                      titulo="Escuro"
                      selecionado={tema === "escuro"}
                      secundario={tema !== "escuro"}
                      onPress={() => definirTema("escuro")}
                    />
                  </View>
                </View>

                <Texto cabecalho style={styles.secao}>
                  Libras
                </Texto>

                {Platform.OS === "web" && (
                  <>
                    <Botao
                      titulo={`Libras: ${libras ? "ligado" : "desligado"}`}
                      selecionado={libras}
                      secundario={!libras}
                      onPress={alternarLibras}
                      dica="Mostra o avatar do VLibras que traduz textos para Libras"
                    />

                    <View style={styles.espaco} />
                  </>
                )}

                <Botao
                  titulo="Ver guia em Libras"
                  onPress={() => setVisao("guia")}
                  dica="Abre as instruções do aplicativo com tradução em Libras"
                />

                <Texto cabecalho style={styles.secao}>
                  Preferências salvas
                </Texto>

                <View
                  style={[
                    styles.resumo,
                    {
                      borderColor: cores.borda,
                      backgroundColor: cores.superficie,
                    },
                  ]}
                >
                  <Texto style={styles.itemResumo}>
                    Tema: {tema === "escuro" ? "Escuro" : "Claro"}
                  </Texto>

                  <Texto style={styles.itemResumo}>
                    Tamanho da letra: {percentual}
                  </Texto>

                  {Platform.OS === "web" && (
                    <Texto style={styles.itemResumo}>
                      Libras: {libras ? "Ligado" : "Desligado"}
                    </Texto>
                  )}

                  <Texto style={styles.itemResumo}>
                    Estas escolhas continuam salvas quando o aplicativo é
                    reiniciado.
                  </Texto>
                </View>

                <View style={styles.espaco} />

                <Botao
                  titulo="Restaurar padrões"
                  secundario
                  onPress={redefinirTudo}
                />

                <View style={styles.espaco} />

                <Botao titulo="Fechar" onPress={fechar} />
              </ScrollView>
            </View>
          ) : (
            <View
              style={[
                styles.guiaTela,
                {
                  backgroundColor: cores.fundo,
                  paddingTop: insets.top + 8,
                  paddingBottom: insets.bottom + 8,
                },
              ]}
            >
              <View style={styles.cabecalhoGuia}>
                <View style={styles.metade}>
                  <Botao
                    titulo="← Voltar"
                    rotulo="Voltar para as configurações"
                    secundario
                    onPress={() => setVisao("ajustes")}
                  />
                </View>

                <View style={styles.metade}>
                  <Botao
                    titulo="Fechar"
                    rotulo="Fechar o guia"
                    onPress={fechar}
                  />
                </View>
              </View>

              <View style={styles.guiaConteudo}>
                <GuiaLibras />
              </View>
            </View>
          )}
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  botaoFlutuante: {
    position: "absolute",
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 20,
  },

  iconeFlutuante: {
    fontSize: 20,
    fontWeight: "bold",
  },

  fundo: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "flex-end",
    zIndex: 30,
  },

  painel: {
    width: "100%",
    maxWidth: 700,
    maxHeight: "92%",
    alignSelf: "center",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  conteudo: {
    paddingBottom: 20,
  },

  titulo: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },

  secao: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
  },

  valor: {
    fontSize: 16,
    marginBottom: 10,
  },

  linha: {
    flexDirection: "row",
    gap: 10,
  },

  metade: {
    flex: 1,
  },

  espaco: {
    height: 10,
  },

  resumo: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
  },

  itemResumo: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 6,
  },

  guiaTela: {
    flex: 1,
    width: "100%",
    maxWidth: 700,
    alignSelf: "center",
    paddingHorizontal: 16,
  },

  cabecalhoGuia: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },

  guiaConteudo: {
    flex: 1,
  },
});

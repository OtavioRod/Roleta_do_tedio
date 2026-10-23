import { StyleSheet, View } from "react-native";

import Texto from "./Texto";
import TouchableLibras from "./TouchableLibras";

type Jogo = {
  id: string;
  nome: string;
  descricao: string;
  jogadoresMinimos?: number;
  jogadoresMaximos?: number;
  tempo?: number;
  gasto?: string;
  dificuldade?: string;
  categoria?: string;
};

type Props = {
  jogos: Jogo[];
  titulo?: string;
  subtitulo?: string;
  onSelecionarJogo?: (jogo: Jogo) => void;
};

export default function ResultadoJogos({
  jogos,
  titulo = "Hora de jogar",
  subtitulo = "Escolha uma opção e pare de perder tempo decidindo o que fazer.",
  onSelecionarJogo,
}: Props) {
  return (
    <View style={styles.areaResultado}>
      <View style={styles.container}>
        <Texto style={styles.titulo}>{titulo}</Texto>

        <Texto style={styles.subtitulo}>{subtitulo}</Texto>

        {jogos.length === 0 ? (
          <View style={styles.semJogos}>
            <Texto style={styles.semJogosTitulo}>
              Não encontramos jogos para esse momento.
            </Texto>

            <Texto style={styles.semJogosTexto}>
              Podemos adicionar mais opções de acordo com o número de pessoas,
              tempo disponível e disposição do grupo.
            </Texto>
          </View>
        ) : (
          <View style={styles.lista}>
            {jogos.map((jogo) => (
              <View key={jogo.id} style={styles.card}>
                <Texto style={styles.nome}>{jogo.nome}</Texto>

                {jogo.categoria && (
                  <View style={styles.categoria}>
                    <Texto style={styles.textoCategoria}>
                      {jogo.categoria}
                    </Texto>
                  </View>
                )}

                <Texto style={styles.descricao}>{jogo.descricao}</Texto>

                <View style={styles.informacoes}>
                  {jogo.jogadoresMinimos !== undefined &&
                    jogo.jogadoresMaximos !== undefined && (
                      <View style={styles.informacaoBloco}>
                        <Texto style={styles.informacaoLabel}>Jogadores</Texto>

                        <Texto style={styles.informacaoValor}>
                          {jogo.jogadoresMinimos} a {jogo.jogadoresMaximos}
                        </Texto>
                      </View>
                    )}

                  {jogo.tempo !== undefined && (
                    <View style={styles.informacaoBloco}>
                      <Texto style={styles.informacaoLabel}>Tempo</Texto>

                      <Texto style={styles.informacaoValor}>
                        {jogo.tempo} min
                      </Texto>
                    </View>
                  )}

                  {jogo.gasto && (
                    <View style={styles.informacaoBloco}>
                      <Texto style={styles.informacaoLabel}>Gasto</Texto>

                      <Texto style={styles.informacaoValor}>{jogo.gasto}</Texto>
                    </View>
                  )}

                  {jogo.dificuldade && (
                    <View style={styles.informacaoBloco}>
                      <Texto style={styles.informacaoLabel}>
                        Dificuldade
                      </Texto>

                      <Texto style={styles.informacaoValor}>
                        {jogo.dificuldade}
                      </Texto>
                    </View>
                  )}
                </View>

                {onSelecionarJogo && (
                  <TouchableLibras
                    textoTraducao="Escolher este jogo"
                    style={styles.botao}
                    onPress={() => onSelecionarJogo(jogo)}
                    activeOpacity={0.8}
                  >
                    <Texto librasIgnorado style={styles.textoBotao}>
                      Escolher este jogo
                    </Texto>
                  </TouchableLibras>
                )}
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  areaResultado: {
    width: "100%",
    maxWidth: 900,
    alignSelf: "center",
    minWidth: 0,
  },

  container: {
    width: "100%",
    minWidth: 0,
    marginTop: 20,
    paddingBottom: 30,
  },

  titulo: {
    width: "100%",
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "800",
    marginBottom: 6,
    color: "#171717",
    flexShrink: 1,
  },

  subtitulo: {
    width: "100%",
    fontSize: 16,
    lineHeight: 23,
    marginBottom: 18,
    color: "#555555",
    flexShrink: 1,
  },

  lista: {
    width: "100%",
    minWidth: 0,
  },

  card: {
    width: "100%",
    minWidth: 0,
    borderWidth: 1,
    borderColor: "#dddddd",
    borderRadius: 14,
    padding: 18,
    marginBottom: 14,
    backgroundColor: "#ffffff",
  },

  nome: {
    width: "100%",
    fontSize: 21,
    lineHeight: 27,
    fontWeight: "800",
    color: "#171717",
    marginBottom: 9,
    flexShrink: 1,
  },

  categoria: {
    alignSelf: "flex-start",
    maxWidth: "100%",
    borderWidth: 1,
    borderColor: "#d2d2d2",
    borderRadius: 16,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginBottom: 11,
    backgroundColor: "#fafafa",
  },

  textoCategoria: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "700",
    color: "#555555",
    flexShrink: 1,
  },

  descricao: {
    width: "100%",
    fontSize: 15,
    lineHeight: 22,
    color: "#444444",
    marginBottom: 15,
    flexShrink: 1,
  },

  informacoes: {
    width: "100%",
    minWidth: 0,
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 8,
  },

  informacaoBloco: {
    minWidth: 105,
    maxWidth: "100%",
    marginRight: 24,
    marginBottom: 12,
  },

  informacaoLabel: {
    fontSize: 12,
    lineHeight: 16,
    color: "#777777",
    marginBottom: 3,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },

  informacaoValor: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
    color: "#222222",
    flexShrink: 1,
  },

  botao: {
    width: "100%",
    minHeight: 46,
    backgroundColor: "#222222",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 3,
  },

  textoBotao: {
    color: "#ffffff",
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "700",
    textAlign: "center",
    flexShrink: 1,
  },

  semJogos: {
    width: "100%",
    minWidth: 0,
    borderWidth: 1,
    borderColor: "#dddddd",
    borderRadius: 12,
    padding: 18,
    backgroundColor: "#ffffff",
  },

  semJogosTitulo: {
    width: "100%",
    fontSize: 18,
    lineHeight: 23,
    fontWeight: "800",
    marginBottom: 8,
    color: "#222222",
    flexShrink: 1,
  },

  semJogosTexto: {
    width: "100%",
    fontSize: 15,
    lineHeight: 22,
    color: "#555555",
    flexShrink: 1,
  },
});

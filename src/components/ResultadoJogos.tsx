import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

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
    <View style={styles.container}>
      <Text style={styles.titulo}>{titulo}</Text>

      <Text style={styles.subtitulo}>{subtitulo}</Text>

      {jogos.length === 0 ? (
        <View style={styles.semJogos}>
          <Text style={styles.semJogosTitulo}>
            Não encontramos jogos para esse momento.
          </Text>

          <Text style={styles.semJogosTexto}>
            Podemos adicionar mais opções de acordo com o número de pessoas,
            tempo disponível e disposição do grupo.
          </Text>
        </View>
      ) : (
        <View style={styles.lista}>
          {jogos.map((jogo) => (
            <View key={jogo.id} style={styles.card}>
              <Text style={styles.nome}>{jogo.nome}</Text>

              {jogo.categoria && (
                <View style={styles.categoria}>
                  <Text style={styles.textoCategoria}>{jogo.categoria}</Text>
                </View>
              )}

              <Text style={styles.descricao}>{jogo.descricao}</Text>

              <View style={styles.informacoes}>
                {jogo.jogadoresMinimos !== undefined &&
                  jogo.jogadoresMaximos !== undefined && (
                    <Text style={styles.informacao}>
                      Jogadores: {jogo.jogadoresMinimos} a{" "}
                      {jogo.jogadoresMaximos}
                    </Text>
                  )}

                {jogo.tempo !== undefined && (
                  <Text style={styles.informacao}>Tempo: {jogo.tempo} min</Text>
                )}

                {jogo.gasto && (
                  <Text style={styles.informacao}>Gasto: {jogo.gasto}</Text>
                )}

                {jogo.dificuldade && (
                  <Text style={styles.informacao}>
                    Dificuldade: {jogo.dificuldade}
                  </Text>
                )}
              </View>

              {onSelecionarJogo && (
                <TouchableOpacity
                  style={styles.botao}
                  onPress={() => onSelecionarJogo(jogo)}
                >
                  <Text style={styles.textoBotao}>Escolher este jogo</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginTop: 20,
  },

  titulo: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 6,
  },

  subtitulo: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 15,
  },

  lista: {
    width: "100%",
  },

  card: {
    borderWidth: 1,
    borderColor: "#cccccc",
    borderRadius: 10,
    padding: 15,
    marginBottom: 12,
  },

  nome: {
    fontSize: 19,
    fontWeight: "bold",
    marginBottom: 8,
  },

  categoria: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#cccccc",
    borderRadius: 15,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
  },

  textoCategoria: {
    fontSize: 13,
  },

  descricao: {
    fontSize: 15,
    lineHeight: 21,
    marginBottom: 12,
  },

  informacoes: {
    marginBottom: 8,
  },

  informacao: {
    fontSize: 14,
    marginBottom: 5,
  },

  botao: {
    backgroundColor: "#222222",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 4,
  },

  textoBotao: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "bold",
  },

  semJogos: {
    borderWidth: 1,
    borderColor: "#cccccc",
    borderRadius: 10,
    padding: 16,
  },

  semJogosTitulo: {
    fontSize: 17,
    fontWeight: "bold",
    marginBottom: 8,
  },

  semJogosTexto: {
    fontSize: 15,
    lineHeight: 21,
  },
});

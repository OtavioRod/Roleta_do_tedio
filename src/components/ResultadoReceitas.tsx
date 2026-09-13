import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Receita = {
  id: string;
  nome: string;
  descricao: string;
  tempo: number;
  dificuldade: string;
  ingredientes: string[];
  preparo: string[];
  categoria?: string;
};

type Props = {
  receitas: Receita[];
  titulo?: string;
  subtitulo?: string;
  onSelecionarReceita?: (receita: Receita) => void;
};

export default function ResultadoReceitas({
  receitas,
  titulo = "Que tal fazer alguma coisa em casa?",
  subtitulo = "Escolhemos algumas ideias simples para acompanhar o momento.",
  onSelecionarReceita,
}: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>{titulo}</Text>

      <Text style={styles.subtitulo}>{subtitulo}</Text>

      {receitas.length === 0 ? (
        <View style={styles.semReceitas}>
          <Text style={styles.semReceitasTitulo}>
            Ainda não temos receitas para mostrar.
          </Text>

          <Text style={styles.semReceitasTexto}>
            Quando as receitas estiverem disponíveis, elas aparecerão aqui.
          </Text>
        </View>
      ) : (
        <View style={styles.lista}>
          {receitas.map((receita) => (
            <View key={receita.id} style={styles.card}>
              <View style={styles.cabecalho}>
                <Text style={styles.nome}>{receita.nome}</Text>

                {receita.categoria && (
                  <View style={styles.categoria}>
                    <Text style={styles.textoCategoria}>
                      {receita.categoria}
                    </Text>
                  </View>
                )}
              </View>

              <Text style={styles.descricao}>{receita.descricao}</Text>

              <View style={styles.informacoes}>
                <Text style={styles.informacao}>
                  Tempo: {receita.tempo} min
                </Text>

                <Text style={styles.informacao}>
                  Dificuldade: {receita.dificuldade}
                </Text>
              </View>

              <Text style={styles.subtituloSecao}>Ingredientes</Text>

              {receita.ingredientes.map((ingrediente, index) => (
                <Text
                  key={`${receita.id}-ingrediente-${index}`}
                  style={styles.item}
                >
                  • {ingrediente}
                </Text>
              ))}

              <Text style={styles.subtituloSecao}>Como fazer</Text>

              {receita.preparo.map((passo, index) => (
                <View key={`${receita.id}-passo-${index}`} style={styles.passo}>
                  <Text style={styles.numeroPasso}>{index + 1}</Text>

                  <Text style={styles.textoPasso}>{passo}</Text>
                </View>
              ))}

              {onSelecionarReceita && (
                <TouchableOpacity
                  style={styles.botao}
                  onPress={() => onSelecionarReceita(receita)}
                >
                  <Text style={styles.textoBotao}>Escolher esta receita</Text>
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

  cabecalho: {
    marginBottom: 8,
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
    marginBottom: 12,
  },

  informacao: {
    fontSize: 14,
    marginBottom: 4,
  },

  subtituloSecao: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 8,
    marginBottom: 7,
  },

  item: {
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 3,
  },

  passo: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },

  numeroPasso: {
    width: 24,
    fontSize: 14,
    fontWeight: "bold",
  },

  textoPasso: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
  },

  botao: {
    backgroundColor: "#222222",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 12,
  },

  textoBotao: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "bold",
  },

  semReceitas: {
    borderWidth: 1,
    borderColor: "#cccccc",
    borderRadius: 10,
    padding: 16,
  },

  semReceitasTitulo: {
    fontSize: 17,
    fontWeight: "bold",
    marginBottom: 8,
  },

  semReceitasTexto: {
    fontSize: 15,
    lineHeight: 21,
  },
});

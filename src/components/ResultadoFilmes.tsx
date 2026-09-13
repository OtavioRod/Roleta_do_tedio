import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

type Filme = {
  id: string;
  titulo: string;
  genero: string;
  ano: number;
  nota: number;
  descricao: string;
  categoria?: string;
};

type Props = {
  filmes: Filme[];
  titulo?: string;
  subtitulo?: string;
  mostrarCategorias?: boolean;
  onSelecionarFilme?: (filme: Filme) => void;
};

const categorias = [
  "Melhores avaliados",
  "Oscar",
  "Ação",
  "Comédia",
  "Drama",
  "Terror",
  "Romance",
  "Ficção científica",
  "Animação",
];

export default function ResultadoFilmes({
  filmes,
  titulo = "Escolha um filme",
  subtitulo = "Agora é só escolher o que assistir.",
  mostrarCategorias = true,
  onSelecionarFilme,
}: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>{titulo}</Text>

      <Text style={styles.subtitulo}>{subtitulo}</Text>

      {mostrarCategorias && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriasContainer}
          contentContainerStyle={styles.categoriasConteudo}
        >
          {categorias.map((categoria) => (
            <TouchableOpacity key={categoria} style={styles.categoria}>
              <Text style={styles.textoCategoria}>{categoria}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {filmes.length === 0 ? (
        <View style={styles.semFilmes}>
          <Text style={styles.semFilmesTitulo}>
            Ainda não temos filmes para mostrar.
          </Text>

          <Text style={styles.semFilmesTexto}>
            Quando a fonte de filmes estiver conectada, as recomendações
            aparecerão aqui.
          </Text>
        </View>
      ) : (
        <View style={styles.lista}>
          {filmes.map((filme) => (
            <View key={filme.id} style={styles.card}>
              <View style={styles.cabecalhoCard}>
                <Text style={styles.tituloFilme}>{filme.titulo}</Text>

                <View style={styles.nota}>
                  <Text style={styles.notaTexto}>{filme.nota.toFixed(1)}</Text>
                </View>
              </View>

              <Text style={styles.informacoes}>
                {filme.ano} • {filme.genero}
              </Text>

              {filme.categoria && (
                <Text style={styles.categoriaFilme}>{filme.categoria}</Text>
              )}

              <Text style={styles.descricao}>{filme.descricao}</Text>

              {onSelecionarFilme && (
                <TouchableOpacity
                  style={styles.botao}
                  onPress={() => onSelecionarFilme(filme)}
                >
                  <Text style={styles.textoBotao}>Escolher este filme</Text>
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

  categoriasContainer: {
    marginBottom: 15,
  },

  categoriasConteudo: {
    paddingRight: 10,
  },

  categoria: {
    borderWidth: 1,
    borderColor: "#cccccc",
    borderRadius: 20,
    paddingVertical: 9,
    paddingHorizontal: 14,
    marginRight: 8,
  },

  textoCategoria: {
    fontSize: 14,
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

  cabecalhoCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
  },

  tituloFilme: {
    fontSize: 19,
    fontWeight: "bold",
    flex: 1,
    marginRight: 10,
  },

  nota: {
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 7,
  },

  notaTexto: {
    fontSize: 13,
    fontWeight: "bold",
  },

  informacoes: {
    fontSize: 14,
    marginBottom: 8,
  },

  categoriaFilme: {
    fontSize: 13,
    fontWeight: "bold",
    marginBottom: 8,
  },

  descricao: {
    fontSize: 15,
    lineHeight: 21,
    marginBottom: 12,
  },

  botao: {
    backgroundColor: "#222222",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: "center",
  },

  textoBotao: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "bold",
  },

  semFilmes: {
    borderWidth: 1,
    borderColor: "#cccccc",
    borderRadius: 10,
    padding: 16,
  },

  semFilmesTitulo: {
    fontSize: 17,
    fontWeight: "bold",
    marginBottom: 8,
  },

  semFilmesTexto: {
    fontSize: 15,
    lineHeight: 21,
  },
});

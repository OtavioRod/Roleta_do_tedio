import { useMemo, useState } from "react";
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

const filmesOscar = [
  "O Poderoso Chefão",
  "Um Sonho de Liberdade",
  "Parasita",
  "Cidade de Deus",
  "O Senhor dos Anéis: O Retorno do Rei",
];

export default function ResultadoFilmes({
  filmes,
  titulo = "Escolha um filme",
  subtitulo = "Agora é só escolher o que assistir.",
  mostrarCategorias = true,
  onSelecionarFilme,
}: Props) {
  const [categoriaSelecionada, setCategoriaSelecionada] =
    useState("Melhores avaliados");

  const filmesFiltrados = useMemo(() => {
    if (categoriaSelecionada === "Melhores avaliados") {
      return [...filmes].sort((a, b) => b.nota - a.nota);
    }

    if (categoriaSelecionada === "Oscar") {
      return filmes.filter((filme) => filmesOscar.includes(filme.titulo));
    }

    return filmes.filter((filme) =>
      filme.genero.toLowerCase().includes(categoriaSelecionada.toLowerCase()),
    );
  }, [filmes, categoriaSelecionada]);

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
          {categorias.map((categoria) => {
            const selecionada = categoriaSelecionada === categoria;

            return (
              <TouchableOpacity
                key={categoria}
                style={[
                  styles.categoria,
                  selecionada && styles.categoriaSelecionada,
                ]}
                onPress={() => setCategoriaSelecionada(categoria)}
              >
                <Text
                  style={[
                    styles.textoCategoria,
                    selecionada && styles.textoCategoriaSelecionada,
                  ]}
                >
                  {categoria}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      <Text style={styles.filtroAtual}>{categoriaSelecionada}</Text>

      {filmesFiltrados.length === 0 ? (
        <View style={styles.semFilmes}>
          <Text style={styles.semFilmesTitulo}>Nenhum filme encontrado.</Text>

          <Text style={styles.semFilmesTexto}>
            Não encontramos filmes nessa categoria com os dados disponíveis no
            momento.
          </Text>
        </View>
      ) : (
        <View style={styles.lista}>
          {filmesFiltrados.map((filme) => (
            <View key={filme.id} style={styles.card}>
              <View style={styles.cabecalhoCard}>
                <Text style={styles.tituloFilme}>{filme.titulo}</Text>

                <View style={styles.nota}>
                  <Text style={styles.notaTexto}>
                    {filme.nota > 0 ? filme.nota.toFixed(1) : "N/A"}
                  </Text>
                </View>
              </View>

              <Text style={styles.informacoes}>
                {filme.ano > 0
                  ? `${filme.ano} • ${filme.genero}`
                  : filme.genero}
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
    marginBottom: 12,
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

  categoriaSelecionada: {
    backgroundColor: "#222222",
    borderColor: "#222222",
  },

  textoCategoria: {
    fontSize: 14,
  },

  textoCategoriaSelecionada: {
    color: "#ffffff",
    fontWeight: "bold",
  },

  filtroAtual: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 10,
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

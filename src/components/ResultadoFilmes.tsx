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
    <View style={styles.areaResultado}>
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
                  activeOpacity={0.7}
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

        <View style={styles.filtroContainer}>
          <Text style={styles.filtroLabel}>Categoria</Text>

          <Text style={styles.filtroAtual}>{categoriaSelecionada}</Text>
        </View>

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
                    <Text style={styles.notaSimbolo}>★</Text>

                    <Text style={styles.notaTexto}>
                      {filme.nota > 0 ? filme.nota.toFixed(1) : "N/A"}
                    </Text>
                  </View>
                </View>

                <View style={styles.informacoesContainer}>
                  {filme.ano > 0 && (
                    <Text style={styles.informacao}>{filme.ano}</Text>
                  )}

                  {filme.genero && (
                    <Text style={[styles.informacao, styles.genero]}>
                      {filme.genero}
                    </Text>
                  )}
                </View>

                {filme.categoria && (
                  <View style={styles.tagCategoria}>
                    <Text style={styles.categoriaFilme}>{filme.categoria}</Text>
                  </View>
                )}

                <Text style={styles.descricao}>{filme.descricao}</Text>

                {onSelecionarFilme && (
                  <TouchableOpacity
                    style={styles.botao}
                    onPress={() => onSelecionarFilme(filme)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.textoBotao}>Escolher este filme</Text>
                  </TouchableOpacity>
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
    fontWeight: "800",
    marginBottom: 6,
    lineHeight: 34,
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

  categoriasContainer: {
    width: "100%",
    marginBottom: 16,
  },

  categoriasConteudo: {
    paddingRight: 12,
    paddingBottom: 2,
  },

  categoria: {
    borderWidth: 1,
    borderColor: "#d0d0d0",
    borderRadius: 22,
    paddingVertical: 9,
    paddingHorizontal: 15,
    marginRight: 8,
    backgroundColor: "#ffffff",
  },

  categoriaSelecionada: {
    backgroundColor: "#222222",
    borderColor: "#222222",
  },

  textoCategoria: {
    fontSize: 14,
    color: "#333333",
    fontWeight: "500",
    flexShrink: 1,
  },

  textoCategoriaSelecionada: {
    color: "#ffffff",
    fontWeight: "700",
  },

  filtroContainer: {
    width: "100%",
    marginBottom: 14,
  },

  filtroLabel: {
    fontSize: 12,
    color: "#777777",
    marginBottom: 3,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  filtroAtual: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "700",
    color: "#222222",
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

  cabecalhoCard: {
    width: "100%",
    minWidth: 0,
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },

  tituloFilme: {
    flex: 1,
    minWidth: 0,
    fontSize: 20,
    fontWeight: "800",
    lineHeight: 25,
    color: "#171717",
    marginRight: 10,
    flexShrink: 1,
  },

  nota: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 0,
    borderWidth: 1,
    borderColor: "#d6d6d6",
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 8,
    backgroundColor: "#fafafa",
  },

  notaSimbolo: {
    fontSize: 13,
    marginRight: 4,
  },

  notaTexto: {
    fontSize: 13,
    fontWeight: "800",
    color: "#222222",
  },

  informacoesContainer: {
    width: "100%",
    minWidth: 0,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    marginBottom: 10,
  },

  informacao: {
    fontSize: 14,
    lineHeight: 20,
    color: "#555555",
    marginRight: 8,
    marginBottom: 3,
    flexShrink: 1,
  },

  genero: {
    maxWidth: "100%",
  },

  tagCategoria: {
    alignSelf: "flex-start",
    maxWidth: "100%",
    borderRadius: 6,
    backgroundColor: "#f0f0f0",
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginBottom: 10,
  },

  categoriaFilme: {
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
    marginBottom: 16,
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
  },

  textoBotao: {
    color: "#ffffff",
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "700",
    textAlign: "center",
    flexShrink: 1,
  },

  semFilmes: {
    width: "100%",
    minWidth: 0,
    borderWidth: 1,
    borderColor: "#dddddd",
    borderRadius: 12,
    padding: 18,
    backgroundColor: "#ffffff",
  },

  semFilmesTitulo: {
    width: "100%",
    fontSize: 18,
    lineHeight: 23,
    fontWeight: "800",
    marginBottom: 8,
    color: "#222222",
    flexShrink: 1,
  },

  semFilmesTexto: {
    width: "100%",
    fontSize: 15,
    lineHeight: 22,
    color: "#555555",
    flexShrink: 1,
  },
});

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

const receitasInternas: Receita[] = [
  {
    id: "receita-interna-1",
    nome: "Macarrão alho e óleo",
    descricao:
      "Uma receita rápida, simples e barata para quando bate aquela fome.",
    tempo: 20,
    dificuldade: "Fácil",
    categoria: "Rápida",
    ingredientes: [
      "200 g de macarrão",
      "3 dentes de alho",
      "3 colheres de sopa de azeite",
      "Sal a gosto",
      "Cheiro-verde a gosto",
    ],
    preparo: [
      "Cozinhe o macarrão em água com sal até ficar al dente.",
      "Pique ou amasse os dentes de alho.",
      "Aqueça o azeite e doure o alho em fogo baixo.",
      "Escorra o macarrão e misture com o alho e o azeite.",
      "Finalize com cheiro-verde e sirva.",
    ],
  },
  {
    id: "receita-interna-2",
    nome: "Omelete simples",
    descricao:
      "Uma opção prática para preparar em poucos minutos usando ingredientes básicos.",
    tempo: 10,
    dificuldade: "Fácil",
    categoria: "Rápida",
    ingredientes: [
      "2 ovos",
      "1 colher de sopa de leite",
      "Sal a gosto",
      "Pimenta-do-reino a gosto",
      "Queijo a gosto",
      "Tomate ou cebola a gosto",
    ],
    preparo: [
      "Bata os ovos com o leite, o sal e a pimenta.",
      "Aqueça uma frigideira levemente untada.",
      "Coloque a mistura de ovos na frigideira.",
      "Adicione o queijo e os outros ingredientes.",
      "Dobre a omelete e deixe cozinhar até ficar firme.",
    ],
  },
  {
    id: "receita-interna-3",
    nome: "Panqueca de banana",
    descricao:
      "Uma alternativa simples para o café da manhã ou para aquele lanche da tarde.",
    tempo: 15,
    dificuldade: "Fácil",
    categoria: "Café da manhã",
    ingredientes: [
      "1 banana madura",
      "1 ovo",
      "3 colheres de sopa de aveia",
      "Canela a gosto",
      "Um pouco de óleo ou manteiga para a frigideira",
    ],
    preparo: [
      "Amasse bem a banana em um recipiente.",
      "Adicione o ovo e misture.",
      "Acrescente a aveia e a canela.",
      "Aqueça uma frigideira em fogo baixo.",
      "Coloque pequenas porções da massa e doure dos dois lados.",
    ],
  },
  {
    id: "receita-interna-4",
    nome: "Bruschetta de tomate",
    descricao:
      "Uma entrada simples e rápida para aproveitar pão e ingredientes frescos.",
    tempo: 15,
    dificuldade: "Fácil",
    categoria: "Lanche",
    ingredientes: [
      "4 fatias de pão",
      "2 tomates",
      "1 dente de alho",
      "Azeite a gosto",
      "Sal a gosto",
      "Orégano ou manjericão a gosto",
    ],
    preparo: [
      "Corte os tomates em pequenos cubos.",
      "Tempere os tomates com sal, azeite e orégano ou manjericão.",
      "Toste levemente as fatias de pão.",
      "Esfregue o alho sobre o pão ainda quente.",
      "Coloque os tomates sobre as fatias e sirva.",
    ],
  },
  {
    id: "receita-interna-5",
    nome: "Sanduíche quente de queijo e tomate",
    descricao:
      "Uma opção prática para matar a fome sem precisar preparar uma refeição complicada.",
    tempo: 10,
    dificuldade: "Fácil",
    categoria: "Lanche",
    ingredientes: [
      "2 fatias de pão",
      "Queijo a gosto",
      "Tomate em rodelas",
      "Orégano a gosto",
      "Manteiga ou azeite",
    ],
    preparo: [
      "Passe um pouco de manteiga ou azeite no pão.",
      "Monte o sanduíche com queijo e tomate.",
      "Adicione orégano.",
      "Leve à frigideira ou sanduicheira.",
      "Doure os dois lados e sirva quente.",
    ],
  },
];

export default function ResultadoReceitas({
  receitas,
  titulo = "Que tal fazer alguma coisa em casa?",
  subtitulo = "Escolhemos algumas ideias simples para acompanhar o momento.",
  onSelecionarReceita,
}: Props) {
  const receitasExibidas = receitas.length > 0 ? receitas : receitasInternas;

  return (
    <View style={styles.areaResultado}>
      <View style={styles.container}>
        <Text style={styles.titulo}>{titulo}</Text>

        <Text style={styles.subtitulo}>{subtitulo}</Text>

        {receitas.length === 0 && (
          <View style={styles.avisoFallback}>
            <Text style={styles.avisoFallbackTexto}>
              Não encontramos receitas externas no momento. Mostrando algumas
              opções disponíveis no aplicativo.
            </Text>
          </View>
        )}

        <View style={styles.lista}>
          {receitasExibidas.map((receita) => (
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
                <View style={styles.informacaoBloco}>
                  <Text style={styles.informacaoLabel}>Tempo</Text>

                  <Text style={styles.informacaoValor}>
                    {receita.tempo} min
                  </Text>
                </View>

                <View style={styles.informacaoBloco}>
                  <Text style={styles.informacaoLabel}>Dificuldade</Text>

                  <Text style={styles.informacaoValor}>
                    {receita.dificuldade}
                  </Text>
                </View>
              </View>

              <View style={styles.separador} />

              <Text style={styles.subtituloSecao}>Ingredientes</Text>

              <View style={styles.listaIngredientes}>
                {receita.ingredientes.map((ingrediente, index) => (
                  <Text
                    key={`${receita.id}-ingrediente-${index}`}
                    style={styles.item}
                  >
                    • {ingrediente}
                  </Text>
                ))}
              </View>

              <Text style={styles.subtituloSecao}>Como fazer</Text>

              <View style={styles.listaPreparo}>
                {receita.preparo.map((passo, index) => (
                  <View
                    key={`${receita.id}-passo-${index}`}
                    style={styles.passo}
                  >
                    <View style={styles.numeroPasso}>
                      <Text style={styles.numeroPassoTexto}>{index + 1}</Text>
                    </View>

                    <Text style={styles.textoPasso}>{passo}</Text>
                  </View>
                ))}
              </View>

              {onSelecionarReceita && (
                <TouchableOpacity
                  style={styles.botao}
                  onPress={() => onSelecionarReceita(receita)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.textoBotao}>Escolher esta receita</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
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
    lineHeight: 34,
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

  avisoFallback: {
    width: "100%",
    minWidth: 0,
    borderWidth: 1,
    borderColor: "#dddddd",
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    backgroundColor: "#f7f7f7",
  },

  avisoFallbackTexto: {
    width: "100%",
    fontSize: 13,
    lineHeight: 19,
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

  cabecalho: {
    width: "100%",
    minWidth: 0,
    marginBottom: 10,
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
    marginBottom: 14,
    flexShrink: 1,
  },

  informacoes: {
    width: "100%",
    minWidth: 0,
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 14,
  },

  informacaoBloco: {
    minWidth: 110,
    maxWidth: "100%",
    marginRight: 25,
    marginBottom: 5,
  },

  informacaoLabel: {
    fontSize: 12,
    lineHeight: 16,
    color: "#777777",
    marginBottom: 2,
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

  separador: {
    width: "100%",
    height: 1,
    backgroundColor: "#eeeeee",
    marginBottom: 14,
  },

  subtituloSecao: {
    width: "100%",
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "800",
    color: "#222222",
    marginTop: 5,
    marginBottom: 9,
    flexShrink: 1,
  },

  listaIngredientes: {
    width: "100%",
    minWidth: 0,
    marginBottom: 8,
  },

  item: {
    width: "100%",
    fontSize: 14,
    lineHeight: 21,
    color: "#444444",
    marginBottom: 4,
    flexShrink: 1,
  },

  listaPreparo: {
    width: "100%",
    minWidth: 0,
    marginBottom: 4,
  },

  passo: {
    width: "100%",
    minWidth: 0,
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },

  numeroPasso: {
    width: 27,
    height: 27,
    borderRadius: 14,
    backgroundColor: "#222222",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 9,
    flexShrink: 0,
  },

  numeroPassoTexto: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "800",
  },

  textoPasso: {
    flex: 1,
    minWidth: 0,
    fontSize: 14,
    lineHeight: 21,
    color: "#444444",
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
    marginTop: 10,
  },

  textoBotao: {
    width: "100%",
    color: "#ffffff",
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "700",
    textAlign: "center",
    flexShrink: 1,
  },
});

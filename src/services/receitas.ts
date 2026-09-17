export type Receita = {
  id: string;
  nome: string;
  descricao: string;
  tempo: number;
  dificuldade: string;
  ingredientes: string[];
  preparo: string[];
  categoria?: string;
};

type RefeicaoTheMealDB = {
  idMeal: string;
  strMeal: string;
  strCategory: string | null;
  strInstructions: string | null;
  [key: string]: string | null;
};

type RespostaTheMealDB = {
  meals: RefeicaoTheMealDB[] | null;
};

const THE_MEAL_DB_URL = "https://www.themealdb.com/api/json/v1/1";

const RECEITAS_PORTUGUESAS: Receita[] = [
  {
    id: "local-1",
    nome: "Macarrão alho e óleo",
    descricao: "Uma receita simples, rápida e barata para preparar em casa.",
    tempo: 15,
    dificuldade: "Fácil",
    ingredientes: [
      "200 g de macarrão",
      "3 dentes de alho",
      "3 colheres de sopa de azeite",
      "Sal a gosto",
      "Salsinha a gosto",
    ],
    preparo: [
      "Cozinhe o macarrão em água com sal até ficar no ponto desejado.",
      "Enquanto isso, corte o alho em fatias finas.",
      "Aqueça o azeite em uma frigideira e doure o alho.",
      "Escorra o macarrão e misture com o alho e o azeite.",
      "Finalize com salsinha e sirva.",
    ],
    categoria: "Massas",
  },
  {
    id: "local-2",
    nome: "Omelete simples",
    descricao: "Uma opção rápida para um café ou refeição leve.",
    tempo: 10,
    dificuldade: "Fácil",
    ingredientes: [
      "2 ovos",
      "2 colheres de sopa de leite",
      "Sal a gosto",
      "Pimenta-do-reino a gosto",
      "Queijo a gosto",
      "1 colher de chá de óleo",
    ],
    preparo: [
      "Bata os ovos com o leite, o sal e a pimenta.",
      "Aqueça uma frigideira com um pouco de óleo.",
      "Coloque a mistura de ovos na frigideira.",
      "Adicione o queijo e dobre a omelete.",
      "Cozinhe até ficar firme e sirva.",
    ],
    categoria: "Café da manhã",
  },
  {
    id: "local-3",
    nome: "Panqueca de banana",
    descricao: "Uma opção fácil para aproveitar bananas maduras.",
    tempo: 15,
    dificuldade: "Fácil",
    ingredientes: [
      "1 banana madura",
      "1 ovo",
      "3 colheres de sopa de aveia",
      "Canela a gosto",
      "1 colher de chá de óleo",
    ],
    preparo: [
      "Amasse a banana com um garfo.",
      "Misture a banana com o ovo e a aveia.",
      "Adicione canela a gosto.",
      "Aqueça uma frigideira com um pouco de óleo.",
      "Coloque pequenas porções da massa na frigideira.",
      "Doure dos dois lados e sirva.",
    ],
    categoria: "Café da manhã",
  },
  {
    id: "local-4",
    nome: "Bruschetta de tomate",
    descricao: "Uma entrada rápida feita com pão, tomate e temperos.",
    tempo: 15,
    dificuldade: "Fácil",
    ingredientes: [
      "4 fatias de pão",
      "2 tomates",
      "1 dente de alho",
      "2 colheres de sopa de azeite",
      "Manjericão a gosto",
      "Sal a gosto",
    ],
    preparo: [
      "Corte os tomates em pequenos cubos.",
      "Misture os tomates com azeite, sal e manjericão.",
      "Toste levemente as fatias de pão.",
      "Esfregue o alho sobre o pão.",
      "Coloque a mistura de tomate sobre as fatias.",
      "Sirva imediatamente.",
    ],
    categoria: "Entrada",
  },
  {
    id: "local-5",
    nome: "Sanduíche quente de queijo e tomate",
    descricao: "Um lanche simples para preparar rapidamente em casa.",
    tempo: 10,
    dificuldade: "Fácil",
    ingredientes: [
      "2 fatias de pão",
      "2 fatias de queijo",
      "2 fatias de tomate",
      "1 colher de chá de manteiga",
      "Orégano a gosto",
    ],
    preparo: [
      "Passe manteiga nas fatias de pão.",
      "Monte o sanduíche com queijo e tomate.",
      "Adicione orégano a gosto.",
      "Aqueça em uma frigideira ou sanduicheira.",
      "Doure os dois lados e sirva.",
    ],
    categoria: "Lanche",
  },
  {
    id: "local-6",
    nome: "Café com leite",
    descricao: "Uma opção clássica e simples para acompanhar o café em casa.",
    tempo: 5,
    dificuldade: "Fácil",
    ingredientes: [
      "100 ml de café preparado",
      "100 ml de leite",
      "Açúcar a gosto",
    ],
    preparo: [
      "Prepare o café normalmente.",
      "Aqueça o leite sem deixar ferver.",
      "Misture o café com o leite.",
      "Adicione açúcar se desejar.",
      "Sirva quente.",
    ],
    categoria: "Café da manhã",
  },
];

const TRADUCOES: Record<string, string> = {
  chicken: "frango",
  beef: "carne bovina",
  pork: "carne suína",
  lamb: "cordeiro",
  turkey: "peru",
  duck: "pato",
  fish: "peixe",
  salmon: "salmão",
  tuna: "atum",
  shrimp: "camarão",
  prawns: "camarões",
  egg: "ovo",
  eggs: "ovos",
  milk: "leite",
  cream: "creme de leite",
  butter: "manteiga",
  cheese: "queijo",
  cheddar: "queijo cheddar",
  parmesan: "parmesão",
  mozzarella: "muçarela",
  yogurt: "iogurte",
  rice: "arroz",
  pasta: "macarrão",
  noodles: "macarrão",
  flour: "farinha",
  bread: "pão",
  breadcrumbs: "farinha de rosca",
  potato: "batata",
  potatoes: "batatas",
  tomato: "tomate",
  tomatoes: "tomates",
  onion: "cebola",
  onions: "cebolas",
  garlic: "alho",
  carrot: "cenoura",
  carrots: "cenouras",
  pepper: "pimenta",
  peppers: "pimentas",
  mushroom: "cogumelo",
  mushrooms: "cogumelos",
  spinach: "espinafre",
  broccoli: "brócolis",
  corn: "milho",
  peas: "ervilhas",
  beans: "feijão",
  lettuce: "alface",
  salt: "sal",
  sugar: "açúcar",
  oil: "óleo",
  olive: "azeitona",
  "olive oil": "azeite",
  vinegar: "vinagre",
  water: "água",
  stock: "caldo",
  sauce: "molho",
  lemon: "limão",
  lime: "limão",
  orange: "laranja",
  apple: "maçã",
  banana: "banana",
  strawberry: "morango",
  strawberries: "morangos",
  chocolate: "chocolate",
  honey: "mel",
  mustard: "mostarda",
  ketchup: "ketchup",
  mayonnaise: "maionese",
  basil: "manjericão",
  parsley: "salsa",
  coriander: "coentro",
  thyme: "tomilho",
  rosemary: "alecrim",
  oregano: "orégano",
  paprika: "páprica",
  cumin: "cominho",
  cinnamon: "canela",
  nutmeg: "noz-moscada",
};

function traduzirTexto(texto: string): string {
  let resultado = texto;

  const termos = Object.keys(TRADUCOES).sort((a, b) => b.length - a.length);

  for (const termo of termos) {
    const traducao = TRADUCOES[termo];

    const regex = new RegExp(
      `\\b${termo.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
      "gi",
    );

    resultado = resultado.replace(regex, traducao);
  }

  return resultado;
}

function traduzirNomeReceita(nome: string): string {
  const nomesConhecidos: Record<string, string> = {
    "Chicken Curry": "Curry de Frango",
    "Chicken Handi": "Frango ao Curry",
    "Chicken Fajita": "Fajita de Frango",
    "Chicken Alfredo": "Frango Alfredo",
    "Chicken Teriyaki": "Frango Teriyaki",
    "Beef Stroganoff": "Estrogonofe de Carne",
    "Beef Wellington": "Filé Wellington",
    "Spaghetti Bolognese": "Espaguete à Bolonhesa",
    "Spaghetti Carbonara": "Espaguete à Carbonara",
    Lasagne: "Lasanha",
    "Lasagne Verdi al Forno": "Lasanha Verde ao Forno",
    Pancakes: "Panquecas",
    "French Toast": "Rabanada",
    "Chocolate Cake": "Bolo de Chocolate",
    "Victoria Sponge Cake": "Bolo Victoria",
    "Banana Pancakes": "Panquecas de Banana",
    "Fish Pie": "Torta de Peixe",
    "Fish and Chips": "Peixe com Batatas Fritas",
    "Greek Salad": "Salada Grega",
    "Caesar Salad": "Salada Caesar",
    Bruschetta: "Bruschetta",
    "Garlic Bread": "Pão de Alho",
    "Macaroni Cheese": "Macarrão com Queijo",
    "Tomato Soup": "Sopa de Tomate",
    "Mushroom Soup": "Sopa de Cogumelos",
  };

  return nomesConhecidos[nome] ?? traduzirTexto(nome);
}

function obterIngredientes(refeicao: RefeicaoTheMealDB): string[] {
  const ingredientes: string[] = [];

  for (let i = 1; i <= 20; i++) {
    const ingrediente = refeicao[`strIngredient${i}`];
    const medida = refeicao[`strMeasure${i}`];

    if (typeof ingrediente === "string" && ingrediente.trim()) {
      const ingredienteTraduzido = traduzirTexto(ingrediente.trim());

      const medidaTexto =
        typeof medida === "string" && medida.trim()
          ? traduzirTexto(medida.trim())
          : "";

      ingredientes.push(
        medidaTexto
          ? `${medidaTexto} ${ingredienteTraduzido}`
          : ingredienteTraduzido,
      );
    }
  }

  return ingredientes;
}

function obterPreparo(instrucoes: string | null): string[] {
  if (!instrucoes) {
    return [];
  }

  const passos = instrucoes
    .replace(/\r/g, "")
    .split(/\n+/)
    .map((passo) => passo.trim())
    .filter(Boolean);

  return passos.map((passo) => traduzirTexto(passo));
}

function estimarTempo(ingredientes: string[], instrucoes: string[]): number {
  const quantidadeIngredientes = ingredientes.length;
  const quantidadePassos = instrucoes.length;

  if (quantidadeIngredientes <= 5 && quantidadePassos <= 4) {
    return 15;
  }

  if (quantidadeIngredientes <= 8 && quantidadePassos <= 7) {
    return 30;
  }

  if (quantidadeIngredientes <= 12 && quantidadePassos <= 10) {
    return 45;
  }

  return 60;
}

function estimarDificuldade(
  ingredientes: string[],
  instrucoes: string[],
): string {
  const quantidadeIngredientes = ingredientes.length;
  const quantidadePassos = instrucoes.length;

  if (quantidadeIngredientes <= 5 && quantidadePassos <= 4) {
    return "Fácil";
  }

  if (quantidadeIngredientes <= 10 && quantidadePassos <= 8) {
    return "Média";
  }

  return "Difícil";
}

function traduzirCategoria(categoria: string | null): string {
  if (!categoria) {
    return "Receita";
  }

  const categorias: Record<string, string> = {
    Beef: "Carne bovina",
    Chicken: "Frango",
    Dessert: "Sobremesa",
    Lamb: "Cordeiro",
    Miscellaneous: "Diversos",
    Pasta: "Massas",
    Pork: "Carne suína",
    Seafood: "Frutos do mar",
    Side: "Acompanhamento",
    Starter: "Entrada",
    Vegan: "Vegana",
    Vegetarian: "Vegetariana",
    Breakfast: "Café da manhã",
    Goat: "Carne de cabra",
  };

  return categorias[categoria] ?? traduzirTexto(categoria);
}

function transformarReceita(refeicao: RefeicaoTheMealDB): Receita {
  const ingredientes = obterIngredientes(refeicao);
  const preparo = obterPreparo(refeicao.strInstructions);

  const primeiraInstrucao = preparo[0];

  const descricao = primeiraInstrucao
    ? primeiraInstrucao
    : "Receita encontrada no TheMealDB.";

  return {
    id: refeicao.idMeal,
    nome: traduzirNomeReceita(refeicao.strMeal),
    descricao,
    tempo: estimarTempo(ingredientes, preparo),
    dificuldade: estimarDificuldade(ingredientes, preparo),
    ingredientes,
    preparo,
    categoria: traduzirCategoria(refeicao.strCategory),
  };
}

function embaralhar<T>(lista: T[]): T[] {
  const resultado = [...lista];

  for (let i = resultado.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [resultado[i], resultado[j]] = [resultado[j], resultado[i]];
  }

  return resultado;
}

export async function buscarReceitas(quantidade = 6): Promise<Receita[]> {
  try {
    const letras = ["a", "b", "c", "d", "e", "f"];
    const letra = letras[Math.floor(Math.random() * letras.length)];

    const resposta = await fetch(`${THE_MEAL_DB_URL}/search.php?f=${letra}`);

    if (!resposta.ok) {
      return embaralhar(RECEITAS_PORTUGUESAS).slice(0, quantidade);
    }

    const dados: RespostaTheMealDB = await resposta.json();

    if (!dados.meals || dados.meals.length === 0) {
      return embaralhar(RECEITAS_PORTUGUESAS).slice(0, quantidade);
    }

    const receitasApi = dados.meals
      .map(transformarReceita)
      .filter(
        (receita) => receita.nome.trim() && receita.ingredientes.length > 0,
      );

    const receitasPortuguesas = embaralhar(RECEITAS_PORTUGUESAS);

    const resultado = [...receitasPortuguesas, ...receitasApi];

    const receitasUnicas = resultado.filter(
      (receita, index, lista) =>
        lista.findIndex(
          (item) => item.nome.toLowerCase() === receita.nome.toLowerCase(),
        ) === index,
    );

    return receitasUnicas.slice(0, quantidade);
  } catch {
    return embaralhar(RECEITAS_PORTUGUESAS).slice(0, quantidade);
  }
}

export async function buscarReceitaPorNome(nome: string): Promise<Receita[]> {
  if (!nome.trim()) {
    return [];
  }

  const resposta = await fetch(
    `${THE_MEAL_DB_URL}/search.php?s=${encodeURIComponent(nome.trim())}`,
  );

  if (!resposta.ok) {
    throw new Error(`Erro ao consultar TheMealDB: ${resposta.status}`);
  }

  const dados: RespostaTheMealDB = await resposta.json();

  if (!dados.meals) {
    const buscaLocal = RECEITAS_PORTUGUESAS.filter((receita) =>
      receita.nome.toLowerCase().includes(nome.trim().toLowerCase()),
    );

    return buscaLocal;
  }

  return dados.meals.map(transformarReceita);
}

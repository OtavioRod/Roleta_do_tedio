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

function obterIngredientes(refeicao: RefeicaoTheMealDB): string[] {
  const ingredientes: string[] = [];

  for (let i = 1; i <= 20; i++) {
    const ingrediente = refeicao[`strIngredient${i}`];

    const medida = refeicao[`strMeasure${i}`];

    if (typeof ingrediente === "string" && ingrediente.trim()) {
      const textoIngrediente =
        medida && medida.trim()
          ? `${medida.trim()} ${ingrediente.trim()}`
          : ingrediente.trim();

      ingredientes.push(textoIngrediente);
    }
  }

  return ingredientes;
}

function obterPreparo(instrucoes: string | null): string[] {
  if (!instrucoes) {
    return [];
  }

  return instrucoes
    .split(/\r?\n/)
    .map((passo) => passo.trim())
    .filter(Boolean);
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

function transformarReceita(refeicao: RefeicaoTheMealDB): Receita {
  const ingredientes = obterIngredientes(refeicao);

  const preparo = obterPreparo(refeicao.strInstructions);

  return {
    id: refeicao.idMeal,
    nome: refeicao.strMeal,
    descricao: refeicao.strInstructions
      ? (refeicao.strInstructions
          .split(/\r?\n/)
          .find((linha) => linha.trim())
          ?.trim() ?? "Receita encontrada no TheMealDB.")
      : "Receita encontrada no TheMealDB.",
    tempo: estimarTempo(ingredientes, preparo),
    dificuldade: estimarDificuldade(ingredientes, preparo),
    ingredientes,
    preparo,
    categoria: refeicao.strCategory ?? "Receita",
  };
}

export async function buscarReceitas(quantidade = 6): Promise<Receita[]> {
  const letras = ["a", "b", "c", "d", "e", "f"];

  const letra = letras[Math.floor(Math.random() * letras.length)];

  const resposta = await fetch(`${THE_MEAL_DB_URL}/search.php?f=${letra}`);

  if (!resposta.ok) {
    throw new Error(`Erro ao consultar TheMealDB: ${resposta.status}`);
  }

  const dados: RespostaTheMealDB = await resposta.json();

  if (!dados.meals) {
    return [];
  }

  const receitas = dados.meals.map(transformarReceita);

  for (let i = receitas.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [receitas[i], receitas[j]] = [receitas[j], receitas[i]];
  }

  return receitas.slice(0, quantidade);
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
    return [];
  }

  return dados.meals.map(transformarReceita);
}

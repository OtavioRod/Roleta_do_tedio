export type Filme = {
  id: string;
  titulo: string;
  genero: string;
  ano: number;
  nota: number;
  descricao: string;
  categoria?: string;
};

type RespostaFilme = {
  id?: number;
  title?: string;
  original_title?: string;
  year?: number;
  release_year?: number;
  overview?: string;
  synopsis?: string;
  fused_rating?: number;
  rating?: number;
  type?: string;
  media_type?: string;
  genres?: string[];
  genre_names?: string[];
};

type RespostaBusca = {
  results?: RespostaFilme[];
  data?: RespostaFilme[];
  items?: RespostaFilme[];
};

const EVERY_FILM_URL = "https://every.film/api/v1";

function obterGenero(filme: RespostaFilme): string {
  const generos = filme.genres ?? filme.genre_names ?? [];

  if (generos.length > 0) {
    return generos.join(", ");
  }

  return "Filme";
}

function obterAno(filme: RespostaFilme): number {
  return filme.year ?? filme.release_year ?? 0;
}

function obterNota(filme: RespostaFilme): number {
  return filme.fused_rating ?? filme.rating ?? 0;
}

function obterDescricao(filme: RespostaFilme): string {
  return filme.overview ?? filme.synopsis ?? "Sinopse não disponível.";
}

function transformarFilme(filme: RespostaFilme, index: number): Filme | null {
  const titulo = filme.title ?? filme.original_title;

  if (!titulo) {
    return null;
  }

  return {
    id: String(filme.id ?? `${titulo}-${index}`),
    titulo,
    genero: obterGenero(filme),
    ano: obterAno(filme),
    nota: obterNota(filme),
    descricao: obterDescricao(filme),
  };
}

function obterResultados(dados: RespostaBusca): RespostaFilme[] {
  if (dados.results) {
    return dados.results;
  }

  if (dados.data) {
    return dados.data;
  }

  if (dados.items) {
    return dados.items;
  }

  return [];
}

async function fazerRequisicao(url: string): Promise<RespostaBusca> {
  const resposta = await fetch(url);

  if (!resposta.ok) {
    throw new Error(`Erro ao consultar every.film: ${resposta.status}`);
  }

  return resposta.json();
}

export async function buscarFilmes(quantidade = 8): Promise<Filme[]> {
  const resposta = await fazerRequisicao(`${EVERY_FILM_URL}/media`);

  const resultados = obterResultados(resposta);

  const filmes = resultados
    .filter((filme) => {
      const tipo = filme.type ?? filme.media_type;

      return (
        !tipo || tipo.toLowerCase() === "movie" || tipo.toLowerCase() === "film"
      );
    })
    .map(transformarFilme)
    .filter((filme): filme is Filme => filme !== null);

  filmes.sort((a, b) => b.nota - a.nota);

  return filmes.slice(0, quantidade);
}

export async function buscarFilmesPorNome(nome: string): Promise<Filme[]> {
  if (!nome.trim()) {
    return [];
  }

  const parametro = encodeURIComponent(nome.trim());

  const resposta = await fazerRequisicao(
    `${EVERY_FILM_URL}/search?q=${parametro}`,
  );

  const resultados = obterResultados(resposta);

  return resultados
    .filter((filme) => {
      const tipo = filme.type ?? filme.media_type;

      return (
        !tipo || tipo.toLowerCase() === "movie" || tipo.toLowerCase() === "film"
      );
    })
    .map(transformarFilme)
    .filter((filme): filme is Filme => filme !== null);
}

export async function buscarMelhoresFilmes(quantidade = 8): Promise<Filme[]> {
  const filmes = await buscarFilmes(30);

  return filmes.sort((a, b) => b.nota - a.nota).slice(0, quantidade);
}

export async function buscarFilmesPorGenero(
  genero: string,
  quantidade = 8,
): Promise<Filme[]> {
  if (!genero.trim()) {
    return buscarFilmes(quantidade);
  }

  const filmes = await buscarFilmes(30);

  const generoNormalizado = genero.trim().toLowerCase();

  const filtrados = filmes.filter((filme) =>
    filme.genero.toLowerCase().includes(generoNormalizado),
  );

  return filtrados.sort((a, b) => b.nota - a.nota).slice(0, quantidade);
}

export async function buscarFilmePorId(id: string): Promise<Filme | null> {
  if (!id.trim()) {
    return null;
  }

  const resposta = await fazerRequisicao(
    `${EVERY_FILM_URL}/media/${encodeURIComponent(id)}/detail`,
  );

  const resultados = obterResultados(resposta);

  if (resultados.length === 0) {
    return null;
  }

  return transformarFilme(resultados[0], 0);
}

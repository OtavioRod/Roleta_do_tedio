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
  id?: number | string;
  title?: string;
  original_title?: string;
  year?: number;
  release_year?: number;
  released?: string;
  release_date?: string;
  overview?: string;
  synopsis?: string;
  description?: string;
  fused_rating?: number;
  rating?: number;
  vote_average?: number;
  type?: string;
  media_type?: string;
  genres?: string[] | string;
  genre_names?: string[];
};

type RespostaBusca = {
  results?: RespostaFilme[];
  data?: RespostaFilme[];
  items?: RespostaFilme[];
  media?: RespostaFilme[];
};

const BASE_FILMES: Filme[] = [
  {
    id: "filme-1",
    titulo: "Interestelar",
    genero: "Ficção científica, Drama",
    ano: 2014,
    nota: 8.7,
    descricao:
      "Uma equipe de astronautas viaja através de um buraco de minhoca em busca de um novo lar para a humanidade.",
  },
  {
    id: "filme-2",
    titulo: "O Poderoso Chefão",
    genero: "Crime, Drama",
    ano: 1972,
    nota: 9.2,
    descricao:
      "A história de uma poderosa família envolvida no mundo do crime organizado.",
  },
  {
    id: "filme-3",
    titulo: "Um Sonho de Liberdade",
    genero: "Drama",
    ano: 1994,
    nota: 9.3,
    descricao:
      "Um homem condenado à prisão mantém a esperança e constrói uma amizade que muda sua vida.",
  },
  {
    id: "filme-4",
    titulo: "A Origem",
    genero: "Ficção científica, Ação, Suspense",
    ano: 2010,
    nota: 8.8,
    descricao:
      "Um especialista em invadir sonhos recebe uma missão extremamente difícil: implantar uma ideia na mente de alguém.",
  },
  {
    id: "filme-5",
    titulo: "Clube da Luta",
    genero: "Drama, Suspense",
    ano: 1999,
    nota: 8.8,
    descricao:
      "Um homem insatisfeito com sua rotina conhece uma figura misteriosa que apresenta uma forma radical de escapar da vida comum.",
  },
  {
    id: "filme-6",
    titulo: "Forrest Gump",
    genero: "Drama, Romance",
    ano: 1994,
    nota: 8.8,
    descricao:
      "A vida extraordinária de um homem que acaba participando de diversos momentos importantes da história dos Estados Unidos.",
  },
  {
    id: "filme-7",
    titulo: "O Senhor dos Anéis: O Retorno do Rei",
    genero: "Fantasia, Aventura, Drama",
    ano: 2003,
    nota: 9.0,
    descricao:
      "A batalha final pela Terra-média se aproxima enquanto Frodo e Sam continuam sua jornada para destruir o Um Anel.",
  },
  {
    id: "filme-8",
    titulo: "Matrix",
    genero: "Ficção científica, Ação",
    ano: 1999,
    nota: 8.7,
    descricao:
      "Um programador descobre que a realidade como conhece é uma construção artificial e precisa decidir em quem confiar.",
  },
  {
    id: "filme-9",
    titulo: "Parasita",
    genero: "Drama, Suspense, Comédia",
    ano: 2019,
    nota: 8.5,
    descricao:
      "Uma família em dificuldades financeiras começa a se aproximar de uma família rica, mas a situação toma um rumo inesperado.",
  },
  {
    id: "filme-10",
    titulo: "Cidade de Deus",
    genero: "Crime, Drama",
    ano: 2002,
    nota: 8.6,
    descricao:
      "A trajetória de jovens que crescem em uma comunidade marcada pela violência e pelo crime organizado.",
  },
  {
    id: "filme-11",
    titulo: "Pulp Fiction",
    genero: "Crime, Drama",
    ano: 1994,
    nota: 8.9,
    descricao:
      "Histórias de diferentes personagens do submundo do crime se cruzam de maneiras inesperadas.",
  },
  {
    id: "filme-12",
    titulo: "O Cavaleiro das Trevas",
    genero: "Ação, Crime, Drama",
    ano: 2008,
    nota: 9.0,
    descricao:
      "Batman enfrenta um criminoso imprevisível que transforma Gotham em um verdadeiro caos.",
  },
  {
    id: "filme-13",
    titulo: "Gladiador",
    genero: "Ação, Drama, Aventura",
    ano: 2000,
    nota: 8.5,
    descricao:
      "Um general romano é traído e busca vingança enquanto luta para recuperar sua honra.",
  },
  {
    id: "filme-14",
    titulo: "De Volta para o Futuro",
    genero: "Ficção científica, Aventura, Comédia",
    ano: 1985,
    nota: 8.5,
    descricao:
      "Um adolescente viaja acidentalmente ao passado e precisa encontrar uma maneira de voltar para seu próprio tempo.",
  },
  {
    id: "filme-15",
    titulo: "Toy Story",
    genero: "Animação, Comédia, Família",
    ano: 1995,
    nota: 8.3,
    descricao:
      "Brinquedos ganham vida quando seus donos não estão por perto e precisam lidar com a chegada de um novo integrante.",
  },
  {
    id: "filme-16",
    titulo: "O Rei Leão",
    genero: "Animação, Aventura, Drama",
    ano: 1994,
    nota: 8.5,
    descricao:
      "Um jovem leão precisa superar uma grande perda e assumir seu lugar como rei.",
  },
  {
    id: "filme-17",
    titulo: "Homem-Aranha no Aranhaverso",
    genero: "Animação, Ação, Aventura",
    ano: 2018,
    nota: 8.4,
    descricao:
      "Um adolescente descobre que existem diferentes versões do Homem-Aranha e precisa aprender a trabalhar com elas.",
  },
  {
    id: "filme-18",
    titulo: "Divertida Mente",
    genero: "Animação, Comédia, Drama",
    ano: 2015,
    nota: 8.1,
    descricao:
      "As emoções de uma garota tentam lidar com as mudanças provocadas por uma nova fase de sua vida.",
  },
  {
    id: "filme-19",
    titulo: "Vingadores: Ultimato",
    genero: "Ação, Aventura, Ficção científica",
    ano: 2019,
    nota: 8.3,
    descricao:
      "Os heróis restantes precisam encontrar uma maneira de reverter as consequências de uma grande derrota.",
  },
  {
    id: "filme-20",
    titulo: "Top Gun: Maverick",
    genero: "Ação, Drama",
    ano: 2022,
    nota: 8.2,
    descricao:
      "Um experiente piloto retorna para treinar uma nova geração enquanto enfrenta desafios do passado.",
  },
];

function obterGenero(filme: RespostaFilme): string {
  if (Array.isArray(filme.genres) && filme.genres.length > 0) {
    return filme.genres.join(", ");
  }

  if (typeof filme.genres === "string" && filme.genres.trim()) {
    return filme.genres;
  }

  if (Array.isArray(filme.genre_names) && filme.genre_names.length > 0) {
    return filme.genre_names.join(", ");
  }

  return "Filme";
}

function obterAno(filme: RespostaFilme): number {
  if (filme.year) {
    return filme.year;
  }

  if (filme.release_year) {
    return filme.release_year;
  }

  const data = filme.released ?? filme.release_date ?? "";

  if (data) {
    const ano = Number(data.substring(0, 4));

    if (!Number.isNaN(ano)) {
      return ano;
    }
  }

  return 0;
}

function obterNota(filme: RespostaFilme): number {
  return filme.fused_rating ?? filme.rating ?? filme.vote_average ?? 0;
}

function obterDescricao(filme: RespostaFilme): string {
  return (
    filme.overview ??
    filme.synopsis ??
    filme.description ??
    "Sinopse não disponível."
  );
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
  if (Array.isArray(dados.results)) {
    return dados.results;
  }

  if (Array.isArray(dados.data)) {
    return dados.data;
  }

  if (Array.isArray(dados.items)) {
    return dados.items;
  }

  if (Array.isArray(dados.media)) {
    return dados.media;
  }

  return [];
}

function ehFilme(filme: RespostaFilme): boolean {
  const tipo = filme.type ?? filme.media_type;

  if (!tipo) {
    return true;
  }

  const tipoNormalizado = tipo.toLowerCase();

  return tipoNormalizado === "movie" || tipoNormalizado === "film";
}

function ordenarPorNota(filmes: Filme[]): Filme[] {
  return [...filmes].sort((a, b) => b.nota - a.nota);
}

function buscarNaBaseLocal(quantidade: number): Filme[] {
  return ordenarPorNota(BASE_FILMES).slice(0, quantidade);
}

function buscarNaBaseLocalPorNome(nome: string): Filme[] {
  const termo = nome.trim().toLowerCase();

  if (!termo) {
    return [];
  }

  return BASE_FILMES.filter((filme) => {
    return (
      filme.titulo.toLowerCase().includes(termo) ||
      filme.genero.toLowerCase().includes(termo) ||
      filme.descricao.toLowerCase().includes(termo)
    );
  });
}

async function fazerRequisicao(url: string): Promise<RespostaBusca> {
  const resposta = await fetch(url);

  if (!resposta.ok) {
    throw new Error(`Erro ao consultar fonte de filmes: ${resposta.status}`);
  }

  return resposta.json();
}

function transformarResultados(resultados: RespostaFilme[]): Filme[] {
  return resultados
    .filter(ehFilme)
    .map(transformarFilme)
    .filter((filme): filme is Filme => filme !== null);
}

export async function buscarFilmes(quantidade = 8): Promise<Filme[]> {
  const filmesLocais = buscarNaBaseLocal(quantidade);

  return filmesLocais;
}

export async function buscarFilmesPorNome(nome: string): Promise<Filme[]> {
  if (!nome.trim()) {
    return [];
  }

  const filmesLocais = buscarNaBaseLocalPorNome(nome);

  if (filmesLocais.length > 0) {
    return ordenarPorNota(filmesLocais);
  }

  return [];
}

export async function buscarMelhoresFilmes(quantidade = 8): Promise<Filme[]> {
  return ordenarPorNota(BASE_FILMES).slice(0, quantidade);
}

export async function buscarFilmesPorGenero(
  genero: string,
  quantidade = 8,
): Promise<Filme[]> {
  if (!genero.trim()) {
    return buscarFilmes(quantidade);
  }

  const generoNormalizado = genero.trim().toLowerCase();

  const filtrados = BASE_FILMES.filter((filme) =>
    filme.genero.toLowerCase().includes(generoNormalizado),
  );

  return ordenarPorNota(filtrados).slice(0, quantidade);
}

export async function buscarFilmePorId(id: string): Promise<Filme | null> {
  if (!id.trim()) {
    return null;
  }

  const filme = BASE_FILMES.find((item) => item.id === id);

  return filme ?? null;
}

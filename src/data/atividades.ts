export type FaixaGasto = "ate30" | "ate60" | "ate100" | "mais100";

export type Atividade = {
  id: string;
  nome: string;
  descricao: string;
  categoria: string;
  tempoMinimo: number;
  tempoMaximo: number;

  // Faixas de orçamento que podem realizar a atividade
  gasto: FaixaGasto[];

  disposicao: string[];

  ambiente: "interno" | "externo" | "qualquer";

  chuvaPermitida: boolean;

  tipoApi: string;
};

export const atividades: Atividade[] = [
  {
    id: "cafe",
    nome: "Tomar um café",
    descricao:
      "Sentar, conversar e tomar alguma coisa sem precisar inventar um grande evento.",
    categoria: "catering.cafe",
    tempoMinimo: 20,
    tempoMaximo: 120,
    gasto: ["ate30", "ate60", "ate100", "mais100"],
    disposicao: ["baixa", "media", "alta"],
    ambiente: "interno",
    chuvaPermitida: true,
    tipoApi: "geoapify",
  },

  {
    id: "restaurante",
    nome: "Comer fora",
    descricao:
      "Encontrar um restaurante próximo e resolver a fome antes que ela vire uma discussão.",
    categoria: "catering.restaurant",
    tempoMinimo: 40,
    tempoMaximo: 180,
    gasto: ["ate60", "ate100", "mais100"],
    disposicao: ["baixa", "media", "alta"],
    ambiente: "interno",
    chuvaPermitida: true,
    tipoApi: "geoapify",
  },

  {
    id: "cinema",
    nome: "Ir ao cinema",
    descricao:
      "Escolher um filme, comprar alguma coisa para comer e passar um tempo juntos.",
    categoria: "entertainment.cinema",
    tempoMinimo: 100,
    tempoMaximo: 240,
    gasto: ["ate100", "mais100"],
    disposicao: ["baixa", "media", "alta"],
    ambiente: "interno",
    chuvaPermitida: true,
    tipoApi: "tmdb",
  },

  {
    id: "parque",
    nome: "Passear no parque",
    descricao: "Dar uma volta, conversar e aproveitar um pouco o ambiente.",
    categoria: "leisure.park",
    tempoMinimo: 30,
    tempoMaximo: 180,
    gasto: ["ate30", "ate60"],
    disposicao: ["media", "alta"],
    ambiente: "externo",
    chuvaPermitida: false,
    tipoApi: "geoapify",
  },

  {
    id: "passeio",
    nome: "Fazer um passeio",
    descricao: "Sair para conhecer algum lugar próximo e ver no que dá.",
    categoria: "tourism",
    tempoMinimo: 40,
    tempoMaximo: 240,
    gasto: ["ate30", "ate60", "ate100", "mais100"],
    disposicao: ["media", "alta"],
    ambiente: "externo",
    chuvaPermitida: false,
    tipoApi: "geoapify",
  },

  {
    id: "evento",
    nome: "Ir a um evento",
    descricao:
      "Encontrar algum evento acontecendo por perto e aproveitar a oportunidade.",
    categoria: "entertainment",
    tempoMinimo: 60,
    tempoMaximo: 300,
    gasto: ["ate60", "ate100", "mais100"],
    disposicao: ["media", "alta"],
    ambiente: "qualquer",
    chuvaPermitida: true,
    tipoApi: "ticketmaster",
  },

  {
    id: "filme-casa",
    nome: "Assistir a um filme",
    descricao:
      "Escolher um filme, ficar confortável e não precisar sair de casa.",
    categoria: "",
    tempoMinimo: 80,
    tempoMaximo: 240,
    gasto: ["ate30", "ate60"],
    disposicao: ["baixa", "media"],
    ambiente: "interno",
    chuvaPermitida: true,
    tipoApi: "tmdb",
  },

  {
    id: "jogar",
    nome: "Jogar alguma coisa",
    descricao:
      "Escolher um jogo e transformar o tédio em uma competição desnecessariamente séria.",
    categoria: "",
    tempoMinimo: 30,
    tempoMaximo: 180,
    gasto: ["ate30", "ate60"],
    disposicao: ["baixa", "media", "alta"],
    ambiente: "interno",
    chuvaPermitida: true,
    tipoApi: "nenhuma",
  },
];

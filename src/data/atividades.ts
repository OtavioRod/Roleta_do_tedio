export type Gasto = "nada" | "pouco" | "medio" | "livre";
export type ModalidadeDisposicao = "baixa" | "media" | "alta";
export type Ambiente = "interno" | "externo" | "qualquer";

export type Modalidade = {
  id: string;
  nome: string;
  descricao: string;

  tempoMinimo: number;
  tempoMaximo: number;

  gasto: Gasto[];

  disposicao: ModalidadeDisposicao[];

  ambiente: Ambiente;

  chuvaPermitida: boolean;
};

export type Atividade = {
  id: string;
  nome: string;
  descricao: string;

  categoria: string;

  tempoMinimo: number;
  tempoMaximo: number;

  gasto: Gasto[];

  disposicao: ModalidadeDisposicao[];

  ambiente: Ambiente;

  chuvaPermitida: boolean;

  tipoApi: string;

  modalidades?: Modalidade[];
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

    gasto: ["nada", "pouco", "medio", "livre"],

    disposicao: ["baixa", "media", "alta"],

    ambiente: "interno",

    chuvaPermitida: true,

    tipoApi: "geoapify",

    modalidades: [
      {
        id: "cafe-casa",
        nome: "Café em casa",
        descricao:
          "Preparar alguma coisa em casa, gastar pouco e transformar o café em um momento tranquilo.",

        tempoMinimo: 20,
        tempoMaximo: 120,

        gasto: ["nada", "pouco", "medio"],

        disposicao: ["baixa", "media", "alta"],

        ambiente: "interno",

        chuvaPermitida: true,
      },

      {
        id: "cafe-fora",
        nome: "Café fora",
        descricao:
          "Sair para uma cafeteria próxima, tomar alguma coisa e aproveitar o ambiente.",

        tempoMinimo: 30,
        tempoMaximo: 120,

        gasto: ["pouco", "medio", "livre"],

        disposicao: ["media", "alta"],

        ambiente: "interno",

        chuvaPermitida: true,
      },
    ],
  },

  {
    id: "restaurante",
    nome: "Comer fora",
    descricao:
      "Encontrar um restaurante próximo e resolver a fome antes que ela vire uma discussão.",

    categoria: "catering.restaurant",

    tempoMinimo: 40,
    tempoMaximo: 180,

    gasto: ["medio", "livre"],

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

    gasto: ["medio", "livre"],

    disposicao: ["baixa", "media", "alta"],

    ambiente: "interno",

    chuvaPermitida: true,

    tipoApi: "geoapify",
  },

  {
    id: "parque",
    nome: "Passear no parque",
    descricao: "Dar uma volta, conversar e aproveitar um pouco o ambiente.",

    categoria: "leisure.park",

    tempoMinimo: 30,
    tempoMaximo: 180,

    gasto: ["nada", "pouco"],

    disposicao: ["media", "alta"],

    ambiente: "externo",

    chuvaPermitida: false,

    tipoApi: "overpass",
  },

  {
    id: "passeio",
    nome: "Fazer um passeio",
    descricao: "Sair para conhecer algum lugar próximo e ver no que dá.",

    categoria: "tourism",

    tempoMinimo: 40,
    tempoMaximo: 240,

    gasto: ["nada", "pouco", "medio", "livre"],

    disposicao: ["media", "alta"],

    ambiente: "externo",

    chuvaPermitida: false,

    tipoApi: "overpass",
  },

  {
    id: "evento",
    nome: "Ir a um evento",
    descricao:
      "Encontrar algum evento acontecendo por perto e aproveitar a oportunidade.",

    categoria: "entertainment",

    tempoMinimo: 60,
    tempoMaximo: 300,

    gasto: ["medio", "livre"],

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

    gasto: ["nada", "pouco"],

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

    gasto: ["nada", "pouco"],

    disposicao: ["baixa", "media", "alta"],

    ambiente: "interno",

    chuvaPermitida: true,

    tipoApi: "nenhuma",
  },
];

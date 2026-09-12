export type Jogo = {
  id: string;
  nome: string;
  descricao: string;
  jogadoresMinimos: number;
  jogadoresMaximos: number;
  tempo: number;
  gasto: string;
  dificuldade: string;
  categoria: string;
};

export const jogos: Jogo[] = [
  {
    id: "uno",
    nome: "UNO",
    descricao:
      "Um jogo rápido de cartas para competir, provocar os amigos e tentar não esquecer de gritar UNO.",
    jogadoresMinimos: 2,
    jogadoresMaximos: 10,
    tempo: 30,
    gasto: "nada",
    dificuldade: "Fácil",
    categoria: "Cartas",
  },

  {
    id: "stop",
    nome: "Stop",
    descricao:
      "Escolham uma letra e tentem preencher as categorias antes dos outros.",
    jogadoresMinimos: 2,
    jogadoresMaximos: 10,
    tempo: 30,
    gasto: "nada",
    dificuldade: "Fácil",
    categoria: "Palavras",
  },

  {
    id: "verdade-desafio",
    nome: "Verdade ou desafio",
    descricao:
      "Uma opção simples para quem quer conversar, rir e descobrir coisas inesperadas.",
    jogadoresMinimos: 2,
    jogadoresMaximos: 10,
    tempo: 30,
    gasto: "nada",
    dificuldade: "Fácil",
    categoria: "Social",
  },

  {
    id: "adivinhe",
    nome: "Adivinhe o personagem",
    descricao:
      "Uma pessoa escolhe um personagem e os outros fazem perguntas até descobrir quem é.",
    jogadoresMinimos: 2,
    jogadoresMaximos: 10,
    tempo: 30,
    gasto: "nada",
    dificuldade: "Fácil",
    categoria: "Adivinhação",
  },

  {
    id: "mimica",
    nome: "Mímica",
    descricao:
      "Escolham palavras, filmes, profissões ou personagens e tentem fazer os outros adivinharem sem falar.",
    jogadoresMinimos: 2,
    jogadoresMaximos: 10,
    tempo: 30,
    gasto: "nada",
    dificuldade: "Fácil",
    categoria: "Social",
  },

  {
    id: "quiz",
    nome: "Quiz",
    descricao:
      "Façam perguntas sobre conhecimentos gerais e descubram quem realmente sabe das coisas.",
    jogadoresMinimos: 2,
    jogadoresMaximos: 10,
    tempo: 40,
    gasto: "nada",
    dificuldade: "Média",
    categoria: "Perguntas",
  },

  {
    id: "telefone-sem-fio",
    nome: "Telefone sem fio",
    descricao:
      "Uma frase passa de pessoa para pessoa e provavelmente chega completamente diferente no final.",
    jogadoresMinimos: 3,
    jogadoresMaximos: 10,
    tempo: 30,
    gasto: "nada",
    dificuldade: "Fácil",
    categoria: "Social",
  },

  {
    id: "eu-nunca",
    nome: "Eu nunca",
    descricao:
      "Cada pessoa fala algo que nunca fez e os outros revelam se já fizeram.",
    jogadoresMinimos: 2,
    jogadoresMaximos: 10,
    tempo: 30,
    gasto: "nada",
    dificuldade: "Fácil",
    categoria: "Social",
  },

  {
    id: "forca",
    nome: "Forca",
    descricao:
      "Escolha uma palavra e deixe os outros tentarem descobrir antes que as tentativas acabem.",
    jogadoresMinimos: 2,
    jogadoresMaximos: 6,
    tempo: 30,
    gasto: "nada",
    dificuldade: "Fácil",
    categoria: "Palavras",
  },

  {
    id: "imagem-e-acao",
    nome: "Imagem e ação",
    descricao:
      "Desenhe uma palavra ou situação e tente fazer os outros descobrirem o que é.",
    jogadoresMinimos: 2,
    jogadoresMaximos: 10,
    tempo: 60,
    gasto: "pouco",
    dificuldade: "Média",
    categoria: "Desenho",
  },

  {
    id: "dominó",
    nome: "Dominó",
    descricao:
      "Um clássico para jogar com calma, estratégia e aquela velha discussão sobre quem realmente ganhou.",
    jogadoresMinimos: 2,
    jogadoresMaximos: 4,
    tempo: 40,
    gasto: "nada",
    dificuldade: "Média",
    categoria: "Estratégia",
  },

  {
    id: "baralho",
    nome: "Jogo de baralho",
    descricao:
      "Escolham um jogo de cartas que vocês já conhecem e comecem a partida.",
    jogadoresMinimos: 2,
    jogadoresMaximos: 6,
    tempo: 30,
    gasto: "nada",
    dificuldade: "Fácil",
    categoria: "Cartas",
  },

  {
    id: "xadrez",
    nome: "Xadrez",
    descricao:
      "Uma partida para quem está disposto a pensar alguns passos antes de agir.",
    jogadoresMinimos: 2,
    jogadoresMaximos: 2,
    tempo: 60,
    gasto: "nada",
    dificuldade: "Difícil",
    categoria: "Estratégia",
  },

  {
    id: "damas",
    nome: "Damas",
    descricao: "Uma partida clássica de estratégia para duas pessoas.",
    jogadoresMinimos: 2,
    jogadoresMaximos: 2,
    tempo: 40,
    gasto: "nada",
    dificuldade: "Média",
    categoria: "Estratégia",
  },

  {
    id: "jogo-da-velha",
    nome: "Jogo da velha",
    descricao:
      "Uma partida rápida para decidir quem é o verdadeiro mestre do X e da bolinha.",
    jogadoresMinimos: 2,
    jogadoresMaximos: 2,
    tempo: 10,
    gasto: "nada",
    dificuldade: "Fácil",
    categoria: "Estratégia",
  },

  {
    id: "batalha-naval",
    nome: "Batalha naval",
    descricao:
      "Monte sua estratégia, esconda seus navios e tente descobrir onde estão os adversários.",
    jogadoresMinimos: 2,
    jogadoresMaximos: 2,
    tempo: 40,
    gasto: "pouco",
    dificuldade: "Média",
    categoria: "Estratégia",
  },

  {
    id: "imagem-mental",
    nome: "Desafio de memória",
    descricao:
      "Tentem lembrar sequências, palavras ou objetos e descubram quem consegue memorizar mais.",
    jogadoresMinimos: 2,
    jogadoresMaximos: 10,
    tempo: 30,
    gasto: "nada",
    dificuldade: "Média",
    categoria: "Memória",
  },

  {
    id: "quem-sou-eu",
    nome: "Quem sou eu?",
    descricao:
      "Cada pessoa recebe um personagem e precisa descobrir sua identidade fazendo perguntas.",
    jogadoresMinimos: 2,
    jogadoresMaximos: 10,
    tempo: 30,
    gasto: "pouco",
    dificuldade: "Fácil",
    categoria: "Adivinhação",
  },

  {
    id: "historia-coletiva",
    nome: "História coletiva",
    descricao:
      "Cada pessoa adiciona uma parte da história. O resultado provavelmente vai sair do controle.",
    jogadoresMinimos: 2,
    jogadoresMaximos: 10,
    tempo: 30,
    gasto: "nada",
    dificuldade: "Fácil",
    categoria: "Criatividade",
  },

  {
    id: "desafio-musical",
    nome: "Desafio musical",
    descricao:
      "Coloque músicas para tocar e tentem descobrir o nome da música ou do artista.",
    jogadoresMinimos: 2,
    jogadoresMaximos: 10,
    tempo: 40,
    gasto: "nada",
    dificuldade: "Média",
    categoria: "Música",
  },
];

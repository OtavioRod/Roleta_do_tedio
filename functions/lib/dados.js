module.exports = {
  atividades: [
    {
      id: "cafe",
      nome: "Tomar um café",
      tempoMinimo: 20,
      tempoMaximo: 120,
      gasto: ["nada", "pouco", "medio", "livre"],
      disposicao: ["baixa", "media", "alta"],
    },
    {
      id: "restaurante",
      nome: "Comer fora",
      tempoMinimo: 40,
      tempoMaximo: 180,
      gasto: ["medio", "livre"],
      disposicao: ["baixa", "media", "alta"],
    },
    {
      id: "cinema",
      nome: "Ir ao cinema",
      tempoMinimo: 100,
      tempoMaximo: 240,
      gasto: ["medio", "livre"],
      disposicao: ["baixa", "media", "alta"],
    },
    {
      id: "parque",
      nome: "Passear no parque",
      tempoMinimo: 30,
      tempoMaximo: 180,
      gasto: ["nada", "pouco"],
      disposicao: ["media", "alta"],
    },
    {
      id: "passeio",
      nome: "Fazer um passeio",
      tempoMinimo: 40,
      tempoMaximo: 240,
      gasto: ["nada", "pouco", "medio", "livre"],
      disposicao: ["media", "alta"],
    },
    {
      id: "evento",
      nome: "Ir a um evento",
      tempoMinimo: 60,
      tempoMaximo: 300,
      gasto: ["medio", "livre"],
      disposicao: ["media", "alta"],
    },
    {
      id: "filme-casa",
      nome: "Assistir a um filme",
      tempoMinimo: 80,
      tempoMaximo: 240,
      gasto: ["nada", "pouco"],
      disposicao: ["baixa", "media"],
    },
    {
      id: "jogar",
      nome: "Jogar alguma coisa",
      tempoMinimo: 30,
      tempoMaximo: 180,
      gasto: ["nada", "pouco"],
      disposicao: ["baixa", "media", "alta"],
    },
  ],
  OPCOES_GASTO: [
    {
      valor: "R$ 0",
      rotulo: "R$ 0",
      categoria: "nada",
    },
    {
      valor: "até 30",
      rotulo: "Até R$ 30",
      categoria: "pouco",
    },
    {
      valor: "até 60",
      rotulo: "Até R$ 60",
      categoria: "medio",
    },
    {
      valor: "até 100",
      rotulo: "Até R$ 100",
      categoria: "livre",
    },
    {
      valor: "sem limite",
      rotulo: "Sem limite",
      categoria: "livre",
    },
  ],
  OPCOES_TEMPO: [
    {
      valor: "30 minutos",
      minutos: 30,
    },
    {
      valor: "40 minutos",
      minutos: 40,
    },
    {
      valor: "1 hora",
      minutos: 60,
    },
    {
      valor: "2 horas",
      minutos: 120,
    },
    {
      valor: "3 horas ou mais",
      minutos: 180,
    },
  ],
};

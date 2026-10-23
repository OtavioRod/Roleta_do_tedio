import { Gasto } from "../data/atividades";

export type Humor = "preguiça" | "fome" | "animado" | "tranquilo" | "tanto faz";

export type GastoOpcao =
  | "R$ 0"
  | "até 30"
  | "até 60"
  | "até 100"
  | "sem limite";

export type Disposicao = "baixa" | "media" | "alta";

export type TempoOpcao =
  | "30 minutos"
  | "40 minutos"
  | "1 hora"
  | "2 horas"
  | "3 horas ou mais";

export const OPCOES_HUMOR: { valor: Humor; rotulo: string }[] = [
  { valor: "preguiça", rotulo: "Com preguiça" },
  { valor: "fome", rotulo: "Com fome" },
  { valor: "animado", rotulo: "Animado" },
  { valor: "tranquilo", rotulo: "Tranquilo" },
  { valor: "tanto faz", rotulo: "Tanto faz" },
];

export const OPCOES_GASTO: {
  valor: GastoOpcao;
  rotulo: string;
  categoria: Gasto;
}[] = [
  { valor: "R$ 0", rotulo: "R$ 0", categoria: "nada" },
  { valor: "até 30", rotulo: "Até R$ 30", categoria: "pouco" },
  { valor: "até 60", rotulo: "Até R$ 60", categoria: "medio" },
  { valor: "até 100", rotulo: "Até R$ 100", categoria: "livre" },
  { valor: "sem limite", rotulo: "Sem limite", categoria: "livre" },
];

export const OPCOES_DISPOSICAO: { valor: Disposicao; rotulo: string }[] = [
  { valor: "baixa", rotulo: "Pouca disposição" },
  { valor: "media", rotulo: "Disposto" },
  { valor: "alta", rotulo: "Muito disposto" },
];

export const OPCOES_TEMPO: {
  valor: TempoOpcao;
  rotulo: string;
  minutos: number;
}[] = [
  { valor: "30 minutos", rotulo: "30 minutos", minutos: 30 },
  { valor: "40 minutos", rotulo: "40 minutos", minutos: 40 },
  { valor: "1 hora", rotulo: "1 hora", minutos: 60 },
  { valor: "2 horas", rotulo: "2 horas", minutos: 120 },
  { valor: "3 horas ou mais", rotulo: "3 horas ou mais", minutos: 180 },
];

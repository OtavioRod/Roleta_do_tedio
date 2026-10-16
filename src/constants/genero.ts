export type Genero =
  | "feminino"
  | "masculino"
  | "nao-binario"
  | "outro"
  | "nao-informar";

export const GENEROS: { valor: Genero; rotulo: string }[] = [
  { valor: "feminino", rotulo: "Feminino" },
  { valor: "masculino", rotulo: "Masculino" },
  { valor: "nao-binario", rotulo: "Não binário" },
  { valor: "outro", rotulo: "Outro" },
  { valor: "nao-informar", rotulo: "Prefiro não informar" },
];

export function rotuloGenero(valor: string) {
  return (
    GENEROS.find((opcao) => opcao.valor === valor)?.rotulo ?? "Não informado"
  );
}

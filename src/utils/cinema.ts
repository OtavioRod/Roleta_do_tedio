import { Local } from "../services/overpass";

export function urlSessoes(local: Pick<Local, "nome">) {
  return `https://www.google.com/search?q=${encodeURIComponent(`${local.nome} sessões hoje`)}`;
}

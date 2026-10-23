const ALFABETO = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function gerarCodigo(tamanho: number) {
  let codigo = "";

  for (let indice = 0; indice < tamanho; indice += 1) {
    codigo += ALFABETO[Math.floor(Math.random() * ALFABETO.length)];
  }

  return codigo;
}

export function normalizarCodigo(texto: string) {
  return texto.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function formatarCodigoAmigo(codigo: string) {
  return codigo.length === 8
    ? `${codigo.slice(0, 4)}-${codigo.slice(4)}`
    : codigo;
}

export function idPar(a: string, b: string) {
  return a < b ? `${a}_${b}` : `${b}_${a}`;
}

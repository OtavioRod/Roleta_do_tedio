const API_URL = "https://roleta-do-tedio.onrender.com";

export type Sessao = {
  id: number;
  atividade: string;
  modalidade: string | null;
  criado_em: string;
};

export async function salvarSessao(
  atividade: string,
  modalidade?: string,
): Promise<Sessao> {
  const resposta = await fetch(`${API_URL}/sessoes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      atividade,
      modalidade,
    }),
  });

  if (!resposta.ok) {
    throw new Error("Não foi possível salvar a sessão.");
  }

  const dados = await resposta.json();

  return dados.sessao;
}

export async function buscarSessoes(): Promise<Sessao[]> {
  const resposta = await fetch(`${API_URL}/sessoes`);

  if (!resposta.ok) {
    throw new Error("Não foi possível buscar as sessões.");
  }

  const dados = await resposta.json();

  return dados.sessoes;
}

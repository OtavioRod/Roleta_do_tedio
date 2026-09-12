export type Evento = {
  id: string;
  nome: string;
  descricao?: string;
  data: string;
  horario?: string;
  local: string;
  endereco?: string;
  categoria?: string;
  preco?: string;
  url?: string;
};

type RespostaEvento = {
  id?: string | number;
  title?: string;
  name?: string;
  description?: string;
  start_at?: string;
  start?: string;
  date?: string;
  end_at?: string;
  venue?: string;
  venue_name?: string;
  location?: string;
  address?: string;
  city?: string;
  category?: string;
  type?: string;
  price?: string | number;
  is_free?: boolean;
  event_url?: string;
  url?: string;
};

type RespostaEventos = {
  events?: RespostaEvento[];
  results?: RespostaEvento[];
  data?: RespostaEvento[];
  items?: RespostaEvento[];
};

function obterResultados(dados: RespostaEventos): RespostaEvento[] {
  if (dados.events) {
    return dados.events;
  }

  if (dados.results) {
    return dados.results;
  }

  if (dados.data) {
    return dados.data;
  }

  if (dados.items) {
    return dados.items;
  }

  return [];
}

function obterNome(evento: RespostaEvento): string | null {
  return evento.title ?? evento.name ?? null;
}

function obterData(evento: RespostaEvento): string {
  const data = evento.start_at ?? evento.start ?? evento.date;

  if (!data) {
    return "Data não informada";
  }

  const dataObjeto = new Date(data);

  if (Number.isNaN(dataObjeto.getTime())) {
    return data;
  }

  return dataObjeto.toLocaleDateString("pt-BR");
}

function obterHorario(evento: RespostaEvento): string | undefined {
  const data = evento.start_at ?? evento.start;

  if (!data) {
    return undefined;
  }

  const dataObjeto = new Date(data);

  if (Number.isNaN(dataObjeto.getTime())) {
    return undefined;
  }

  return dataObjeto.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function obterLocal(evento: RespostaEvento): string {
  return (
    evento.venue ??
    evento.venue_name ??
    evento.location ??
    "Local não informado"
  );
}

function obterEndereco(evento: RespostaEvento): string | undefined {
  const partes = [evento.address, evento.city].filter(Boolean);

  if (partes.length === 0) {
    return undefined;
  }

  return partes.join(", ");
}

function obterCategoria(evento: RespostaEvento): string | undefined {
  return evento.category ?? evento.type;
}

function obterPreco(evento: RespostaEvento): string | undefined {
  if (evento.is_free === true) {
    return "Gratuito";
  }

  if (evento.price !== undefined && evento.price !== null) {
    return String(evento.price);
  }

  return undefined;
}

function transformarEvento(
  evento: RespostaEvento,
  index: number,
): Evento | null {
  const nome = obterNome(evento);

  if (!nome) {
    return null;
  }

  return {
    id: String(evento.id ?? `${nome}-${index}`),
    nome,
    descricao: evento.description ?? undefined,
    data: obterData(evento),
    horario: obterHorario(evento),
    local: obterLocal(evento),
    endereco: obterEndereco(evento),
    categoria: obterCategoria(evento),
    preco: obterPreco(evento),
    url: evento.event_url ?? evento.url ?? undefined,
  };
}

async function fazerRequisicao(url: string): Promise<RespostaEventos> {
  const resposta = await fetch(url);

  if (!resposta.ok) {
    throw new Error(`Erro ao consultar eventos: ${resposta.status}`);
  }

  return resposta.json();
}

export async function buscarEventos(
  cidade: string,
  quantidade = 10,
): Promise<Evento[]> {
  if (!cidade.trim()) {
    return [];
  }

  const parametros = new URLSearchParams({
    city: cidade.trim(),
    limit: String(quantidade),
  });

  const url = `https://www.nawhe.com/api/v1/events?${parametros.toString()}`;

  const dados = await fazerRequisicao(url);

  const resultados = obterResultados(dados);

  return resultados
    .map(transformarEvento)
    .filter((evento): evento is Evento => evento !== null)
    .slice(0, quantidade);
}

export async function buscarEventosPorCategoria(
  cidade: string,
  categoria: string,
  quantidade = 10,
): Promise<Evento[]> {
  if (!cidade.trim() || !categoria.trim()) {
    return [];
  }

  const parametros = new URLSearchParams({
    city: cidade.trim(),
    category: categoria.trim(),
    limit: String(quantidade),
  });

  const url = `https://www.nawhe.com/api/v1/events?${parametros.toString()}`;

  const dados = await fazerRequisicao(url);

  const resultados = obterResultados(dados);

  return resultados
    .map(transformarEvento)
    .filter((evento): evento is Evento => evento !== null)
    .slice(0, quantidade);
}

export async function buscarEventosGratuitos(
  cidade: string,
  quantidade = 10,
): Promise<Evento[]> {
  if (!cidade.trim()) {
    return [];
  }

  const parametros = new URLSearchParams({
    city: cidade.trim(),
    free: "true",
    limit: String(quantidade),
  });

  const url = `https://www.nawhe.com/api/v1/events?${parametros.toString()}`;

  const dados = await fazerRequisicao(url);

  const resultados = obterResultados(dados);

  return resultados
    .map(transformarEvento)
    .filter((evento): evento is Evento => evento !== null)
    .slice(0, quantidade);
}

export async function buscarEventoPorId(id: string): Promise<Evento | null> {
  if (!id.trim()) {
    return null;
  }

  const url = `https://www.nawhe.com/api/v1/events/${encodeURIComponent(
    id.trim(),
  )}`;

  const dados = await fazerRequisicao(url);

  const resultados = obterResultados(dados);

  if (resultados.length === 0) {
    return null;
  }

  return transformarEvento(resultados[0], 0);
}

export type EstadoHorario = "aberto" | "fechado" | "desconhecido";

export type StatusHorario = {
  estado: EstadoHorario;
  texto: string;
  fechaEmMinutos?: number;
  fechandoEmBreve?: boolean;
  parcial?: boolean;
};

type Intervalo = { inicio: number; fim: number };

const DIAS_OSM = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

const DIA_JS_POR_OSM: Record<string, number> = {
  Mo: 1,
  Tu: 2,
  We: 3,
  Th: 4,
  Fr: 5,
  Sa: 6,
  Su: 0,
};

const NOME_DIA = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

const LIMITE_FECHANDO_EM_BREVE = 60;

function formatarMinutos(total: number) {
  const normalizado = ((total % 1440) + 1440) % 1440;

  const horas = Math.floor(normalizado / 60);
  const minutos = normalizado % 60;

  return `${String(horas).padStart(2, "0")}:${String(minutos).padStart(2, "0")}`;
}

function converterHorario(texto: string) {
  const partes = texto.split(":");

  return Number(partes[0]) * 60 + Number(partes[1]);
}

function expandirDias(especificacao: string): number[] | null {
  const dias: number[] = [];

  for (const item of especificacao.split(",")) {
    if (item === "") {
      return null;
    }

    if (item.includes("-")) {
      const [inicio, fim] = item.split("-");

      const indiceInicio = DIAS_OSM.indexOf(inicio);
      const indiceFim = DIAS_OSM.indexOf(fim);

      if (indiceInicio < 0 || indiceFim < 0) {
        return null;
      }

      let atual = indiceInicio;

      for (let contador = 0; contador < 7; contador += 1) {
        dias.push(DIA_JS_POR_OSM[DIAS_OSM[atual]]);

        if (atual === indiceFim) {
          break;
        }

        atual = (atual + 1) % 7;
      }
    } else {
      if (!(item in DIA_JS_POR_OSM)) {
        return null;
      }

      dias.push(DIA_JS_POR_OSM[item]);
    }
  }

  return dias;
}

function lerIntervalos(especificacao: string): Intervalo[] | null {
  const intervalos: Intervalo[] = [];

  for (const faixa of especificacao.split(",")) {
    const correspondencia = faixa
      .trim()
      .match(/^(\d{1,2}:\d{2})-(\d{1,2}:\d{2})$/);

    if (!correspondencia) {
      return null;
    }

    const inicio = converterHorario(correspondencia[1]);

    let fim = converterHorario(correspondencia[2]);

    if (fim <= inicio) {
      fim += 1440;
    }

    intervalos.push({ inicio, fim });
  }

  return intervalos;
}

function lerRegras(horario: string) {
  const porDia = new Map<number, Intervalo[]>();

  let parcial = false;

  const texto = horario.trim();

  if (texto === "24/7") {
    for (let dia = 0; dia < 7; dia += 1) {
      porDia.set(dia, [{ inicio: 0, fim: 1440 }]);
    }

    return { porDia, parcial };
  }

  if (texto.includes("||") || texto.includes('"')) {
    return null;
  }

  for (const regraBruta of texto.split(";")) {
    const regra = regraBruta.trim();

    if (regra === "") {
      continue;
    }

    const corte = regra.match(/(\d{1,2}:\d{2}.*|off|closed)\s*$/i);

    if (!corte || corte.index === undefined) {
      return null;
    }

    const parteDias = regra.slice(0, corte.index).replace(/\s+/g, "").trim();

    const parteHoras = corte[1].trim().toLowerCase();

    if (/(PH|SH)/.test(parteDias)) {
      parcial = true;
      continue;
    }

    let dias: number[] | null;

    if (parteDias === "") {
      dias = [0, 1, 2, 3, 4, 5, 6];
    } else if (/^[A-Za-z]{2}([,-][A-Za-z]{2})*$/.test(parteDias)) {
      dias = expandirDias(parteDias);
    } else {
      return null;
    }

    if (!dias) {
      return null;
    }

    let intervalos: Intervalo[] | null;

    if (parteHoras === "off" || parteHoras === "closed") {
      intervalos = [];
    } else {
      intervalos = lerIntervalos(corte[1]);
    }

    if (!intervalos) {
      return null;
    }

    for (const dia of dias) {
      porDia.set(dia, intervalos);
    }
  }

  if (porDia.size === 0) {
    return null;
  }

  return { porDia, parcial };
}

function descreverDia(diaAtual: number, diaAlvo: number) {
  const diferenca = (diaAlvo - diaAtual + 7) % 7;

  if (diferenca === 0) {
    return "hoje";
  }

  if (diferenca === 1) {
    return "amanhã";
  }

  return NOME_DIA[diaAlvo];
}

export function avaliarHorario(
  horario: string | undefined | null,
  agora: Date = new Date(),
): StatusHorario {
  const desconhecido: StatusHorario = {
    estado: "desconhecido",
    texto: "Horário não informado",
  };

  if (!horario || horario.trim() === "") {
    return desconhecido;
  }

  const regras = lerRegras(horario);

  if (!regras) {
    return desconhecido;
  }

  const { porDia, parcial } = regras;

  const minutosAgora = agora.getHours() * 60 + agora.getMinutes();

  const hoje = agora.getDay();

  const ontem = (hoje + 6) % 7;

  for (const intervalo of porDia.get(hoje) ?? []) {
    if (minutosAgora >= intervalo.inicio && minutosAgora < intervalo.fim) {
      const restante = intervalo.fim - minutosAgora;

      return {
        estado: "aberto",
        texto: `Aberto agora · fecha às ${formatarMinutos(intervalo.fim)}`,
        fechaEmMinutos: restante,
        fechandoEmBreve: restante <= LIMITE_FECHANDO_EM_BREVE,
        parcial,
      };
    }
  }

  for (const intervalo of porDia.get(ontem) ?? []) {
    if (intervalo.fim > 1440 && minutosAgora < intervalo.fim - 1440) {
      const restante = intervalo.fim - 1440 - minutosAgora;

      return {
        estado: "aberto",
        texto: `Aberto agora · fecha às ${formatarMinutos(intervalo.fim)}`,
        fechaEmMinutos: restante,
        fechandoEmBreve: restante <= LIMITE_FECHANDO_EM_BREVE,
        parcial,
      };
    }
  }

  for (let deslocamento = 0; deslocamento < 8; deslocamento += 1) {
    const dia = (hoje + deslocamento) % 7;

    const candidatos = (porDia.get(dia) ?? [])
      .filter((intervalo) =>
        deslocamento === 0 ? intervalo.inicio > minutosAgora : true,
      )
      .sort((a, b) => a.inicio - b.inicio);

    if (candidatos.length > 0) {
      return {
        estado: "fechado",
        texto: `Fechado · abre ${descreverDia(hoje, dia)} às ${formatarMinutos(candidatos[0].inicio)}`,
        parcial,
      };
    }
  }

  return { estado: "fechado", texto: "Fechado", parcial };
}

export function cabeNoTempo(status: StatusHorario, minutosDisponiveis: number) {
  if (status.estado !== "aberto" || status.fechaEmMinutos === undefined) {
    return true;
  }

  return status.fechaEmMinutos >= minutosDisponiveis;
}

import {
    arrayRemove,
    arrayUnion,
    collection,
    doc,
    DocumentData,
    getDoc,
    getDocs,
    onSnapshot,
    query,
    serverTimestamp,
    Unsubscribe,
    updateDoc,
    where,
    writeBatch,
} from "firebase/firestore";

import {
    Disposicao,
    GastoOpcao,
    Humor,
    OPCOES_DISPOSICAO,
    OPCOES_GASTO,
    OPCOES_HUMOR,
    OPCOES_TEMPO,
    TempoOpcao,
} from "../constants/opcoesRoleta";
import { gerarCodigo, normalizarCodigo } from "../utils/codigos";
import { obterFirestore } from "./firebase";

export type TipoSala = "casal" | "amigos";

export type EstadoSala =
  | "aguardando"
  | "respondendo"
  | "resultado"
  | "encerrada";

export type Respostas = {
  humor: Humor;
  gasto: GastoOpcao;
  disposicao: Disposicao;
  tempo: TempoOpcao;
};

export type ResultadoSala = {
  atividadeId: string;
  atividadeNome: string;
  semFiltro: boolean;
  tentativa?: number;
};

export type LocalSala = {
  id: string;
  nome: string;
  latitude: number;
  longitude: number;
  endereco: string;
};

export type ItemHistorico = {
  rodada: number;
  atividadeId: string;
  atividadeNome: string;
};

export const PRAZO_RODADA_MS = 5 * 60 * 1000;

export type Sala = {
  codigo: string;
  tipo: TipoSala;
  donoUid: string;
  donoNome: string;
  membrosUids: string[];
  limite: number;
  estado: EstadoSala;
  rodada: number;
  resultado: ResultadoSala | null;
  discreto: boolean;
  prazoEm: number;
  tentativa: number;
  vetadas: string[];
  confirmada: boolean;
  historico: ItemHistorico[];
  ultimaAtividadeId: string;
  locais: LocalSala[];
  localEscolhidoId: string;
};

export type VotoSala = {
  tentativa: number;
  valor: "topo" | "nao";
};

export type MembroSala = {
  uid: string;
  nome: string;
  rodada: number;
  respostas: Respostas | null;
  progresso: number;
  progressoRodada: number;
  voto: VotoSala | null;
  votoLocal: string;
  visto: number;
};

export type Usuario = {
  uid: string;
  nome: string;
};

const ESTADOS: EstadoSala[] = [
  "aguardando",
  "respondendo",
  "resultado",
  "encerrada",
];

function converterSala(dados: DocumentData): Sala {
  const resultado = dados.resultado;

  return {
    codigo: String(dados.codigo),
    tipo: dados.tipo === "casal" ? "casal" : "amigos",
    donoUid: String(dados.donoUid),
    donoNome: String(dados.donoNome ?? ""),
    membrosUids: Array.isArray(dados.membrosUids)
      ? dados.membrosUids.map(String)
      : [],
    limite: Number(dados.limite) || 2,
    estado: ESTADOS.includes(dados.estado) ? dados.estado : "aguardando",
    rodada: Number(dados.rodada) || 0,
    resultado:
      resultado && typeof resultado === "object"
        ? {
            atividadeId: String(resultado.atividadeId),
            atividadeNome: String(resultado.atividadeNome ?? ""),
            semFiltro: resultado.semFiltro === true,
            tentativa: Number(resultado.tentativa) || 1,
          }
        : null,
    discreto: dados.discreto === true,
    prazoEm: Number(dados.prazoEm) || 0,
    tentativa: Number(dados.tentativa) || 0,
    vetadas: Array.isArray(dados.vetadas) ? dados.vetadas.map(String) : [],
    confirmada: dados.confirmada === true,
    historico: Array.isArray(dados.historico)
      ? dados.historico.map((item: Record<string, unknown>) => ({
          rodada: Number(item.rodada) || 0,
          atividadeId: String(item.atividadeId ?? ""),
          atividadeNome: String(item.atividadeNome ?? ""),
        }))
      : [],
    ultimaAtividadeId: String(dados.ultimaAtividadeId ?? ""),
    locais: Array.isArray(dados.locais)
      ? dados.locais.map((local: Record<string, unknown>) => ({
          id: String(local.id ?? ""),
          nome: String(local.nome ?? ""),
          latitude: Number(local.latitude) || 0,
          longitude: Number(local.longitude) || 0,
          endereco: String(local.endereco ?? ""),
        }))
      : [],
    localEscolhidoId: String(dados.localEscolhidoId ?? ""),
  };
}

function converterRespostas(valor: unknown): Respostas | null {
  if (!valor || typeof valor !== "object") {
    return null;
  }

  const dados = valor as Record<string, unknown>;

  const humor = OPCOES_HUMOR.find((opcao) => opcao.valor === dados.humor);
  const gasto = OPCOES_GASTO.find((opcao) => opcao.valor === dados.gasto);
  const disposicao = OPCOES_DISPOSICAO.find(
    (opcao) => opcao.valor === dados.disposicao,
  );
  const tempo = OPCOES_TEMPO.find((opcao) => opcao.valor === dados.tempo);

  if (!humor || !gasto || !disposicao || !tempo) {
    return null;
  }

  return {
    humor: humor.valor,
    gasto: gasto.valor,
    disposicao: disposicao.valor,
    tempo: tempo.valor,
  };
}

function converterMembro(uid: string, dados: DocumentData): MembroSala {
  return {
    uid,
    nome: String(dados.nome ?? ""),
    rodada: Number(dados.rodada) || 0,
    respostas: converterRespostas(dados.respostas),
    progresso: Number(dados.progresso) || 0,
    progressoRodada: Number(dados.progressoRodada) || 0,
    voto:
      dados.voto &&
      typeof dados.voto === "object" &&
      (dados.voto.valor === "topo" || dados.voto.valor === "nao")
        ? {
            tentativa: Number(dados.voto.tentativa) || 0,
            valor: dados.voto.valor,
          }
        : null,
    votoLocal: String(dados.votoLocal ?? ""),
    visto:
      dados.visto && typeof dados.visto.toMillis === "function"
        ? dados.visto.toMillis()
        : 0,
  };
}

export async function criarSala(
  dono: Usuario,
  tipo: TipoSala,
): Promise<string> {
  const bd = obterFirestore();

  for (let tentativa = 0; tentativa < 8; tentativa += 1) {
    const codigo = gerarCodigo(6);

    const referencia = doc(bd, "salas", codigo);

    if ((await getDoc(referencia)).exists()) {
      continue;
    }

    const lote = writeBatch(bd);

    lote.set(referencia, {
      codigo,
      tipo,
      donoUid: dono.uid,
      donoNome: dono.nome,
      membrosUids: [dono.uid],
      limite: tipo === "casal" ? 2 : 10,
      estado: "aguardando",
      rodada: 0,
      resultado: null,
      criadaEm: serverTimestamp(),
    });

    lote.set(doc(bd, "salas", codigo, "membros", dono.uid), {
      nome: dono.nome,
      respostas: null,
      rodada: 0,
      entrouEm: serverTimestamp(),
    });

    await lote.commit();

    return codigo;
  }

  throw new Error("codigo-indisponivel");
}

export async function entrarNaSala(
  codigoBruto: string,
  usuario: Usuario,
): Promise<string> {
  const codigo = normalizarCodigo(codigoBruto);

  if (codigo.length !== 6) {
    throw new Error("codigo-invalido");
  }

  const bd = obterFirestore();

  const referencia = doc(bd, "salas", codigo);

  const instantaneo = await getDoc(referencia);

  if (!instantaneo.exists()) {
    throw new Error("sala-nao-encontrada");
  }

  const dados = instantaneo.data();

  const membros: string[] = Array.isArray(dados.membrosUids)
    ? dados.membrosUids
    : [];

  if (membros.includes(usuario.uid)) {
    return codigo;
  }

  if (dados.estado === "encerrada") {
    throw new Error("sala-encerrada");
  }

  if (dados.estado !== "aguardando") {
    throw new Error("sala-iniciada");
  }

  if (membros.length >= Number(dados.limite)) {
    throw new Error("sala-cheia");
  }

  const lote = writeBatch(bd);

  lote.update(referencia, { membrosUids: arrayUnion(usuario.uid) });

  lote.set(doc(bd, "salas", codigo, "membros", usuario.uid), {
    nome: usuario.nome,
    respostas: null,
    rodada: 0,
    entrouEm: serverTimestamp(),
  });

  await lote.commit();

  return codigo;
}

export async function sairDaSala(
  codigo: string,
  uid: string,
  ehDono: boolean,
  proximoDono?: Usuario,
) {
  const bd = obterFirestore();

  const referencia = doc(bd, "salas", codigo);

  if (ehDono && !proximoDono) {
    await updateDoc(referencia, { estado: "encerrada" });

    return;
  }

  const lote = writeBatch(bd);

  if (ehDono && proximoDono) {
    lote.update(referencia, {
      donoUid: proximoDono.uid,
      donoNome: proximoDono.nome,
      membrosUids: arrayRemove(uid),
    });
  } else {
    lote.update(referencia, { membrosUids: arrayRemove(uid) });
  }

  lote.delete(doc(bd, "salas", codigo, "membros", uid));

  await lote.commit();
}

export async function removerParticipante(codigo: string, uid: string) {
  const bd = obterFirestore();

  const lote = writeBatch(bd);

  lote.update(doc(bd, "salas", codigo), { membrosUids: arrayRemove(uid) });

  lote.delete(doc(bd, "salas", codigo, "membros", uid));

  await lote.commit();
}

export function observarMinhasSalas(
  uid: string,
  aoMudar: (salas: Sala[]) => void,
  aoErro?: (erro: unknown) => void,
): Unsubscribe {
  return onSnapshot(
    query(
      collection(obterFirestore(), "salas"),
      where("membrosUids", "array-contains", uid),
    ),
    (instantaneo) =>
      aoMudar(
        instantaneo.docs
          .map((documento) => converterSala(documento.data()))
          .filter((sala) => sala.estado !== "encerrada"),
      ),
    (erro) => aoErro?.(erro),
  );
}

export function observarSala(
  codigo: string,
  aoMudar: (sala: Sala | null) => void,
  aoErro?: (erro: unknown) => void,
): Unsubscribe {
  return onSnapshot(
    doc(obterFirestore(), "salas", codigo),
    (instantaneo) =>
      aoMudar(instantaneo.exists() ? converterSala(instantaneo.data()) : null),
    (erro) => aoErro?.(erro),
  );
}

export function observarMembros(
  codigo: string,
  aoMudar: (membros: MembroSala[]) => void,
  aoErro?: (erro: unknown) => void,
): Unsubscribe {
  return onSnapshot(
    collection(obterFirestore(), "salas", codigo, "membros"),
    (instantaneo) =>
      aoMudar(
        instantaneo.docs.map((documento) =>
          converterMembro(documento.id, documento.data()),
        ),
      ),
    (erro) => aoErro?.(erro),
  );
}

export async function iniciarRodada(codigo: string, rodadaAtual: number) {
  await updateDoc(doc(obterFirestore(), "salas", codigo), {
    estado: "respondendo",
    rodada: rodadaAtual + 1,
    resultado: null,
    tentativa: 0,
    vetadas: [],
    confirmada: false,
    locais: [],
    localEscolhidoId: "",
    prazoEm: Date.now() + PRAZO_RODADA_MS,
  });
}

export async function enviarRespostas(
  codigo: string,
  uid: string,
  rodada: number,
  respostas: Respostas,
) {
  await updateDoc(doc(obterFirestore(), "salas", codigo, "membros", uid), {
    respostas,
    rodada,
  });
}

export async function enviarProgresso(
  codigo: string,
  uid: string,
  rodada: number,
  perguntasRespondidas: number,
) {
  await updateDoc(doc(obterFirestore(), "salas", codigo, "membros", uid), {
    progresso: perguntasRespondidas,
    progressoRodada: rodada,
  });
}

export async function definirResultado(
  codigo: string,
  resultado: ResultadoSala,
) {
  await updateDoc(doc(obterFirestore(), "salas", codigo), {
    estado: "resultado",
    resultado: { ...resultado, tentativa: 1 },
    tentativa: 1,
  });
}

export async function girarDeNovo(
  codigo: string,
  resultado: ResultadoSala,
  tentativa: number,
  vetadas: string[],
) {
  await updateDoc(doc(obterFirestore(), "salas", codigo), {
    resultado: { ...resultado, tentativa },
    tentativa,
    vetadas,
  });
}

export async function confirmarResultado(
  codigo: string,
  rodada: number,
  resultado: ResultadoSala,
  historicoAtual: ItemHistorico[],
) {
  await updateDoc(doc(obterFirestore(), "salas", codigo), {
    confirmada: true,
    ultimaAtividadeId: resultado.atividadeId,
    historico: [
      ...historicoAtual,
      {
        rodada,
        atividadeId: resultado.atividadeId,
        atividadeNome: resultado.atividadeNome,
      },
    ].slice(-10),
  });
}

export async function votarNoResultado(
  codigo: string,
  uid: string,
  tentativa: number,
  valor: "topo" | "nao",
) {
  await updateDoc(doc(obterFirestore(), "salas", codigo, "membros", uid), {
    voto: { tentativa, valor },
  });
}

export async function definirDiscreto(codigo: string, discreto: boolean) {
  await updateDoc(doc(obterFirestore(), "salas", codigo), { discreto });
}

export async function publicarLocais(codigo: string, locais: LocalSala[]) {
  await updateDoc(doc(obterFirestore(), "salas", codigo), {
    locais: locais.slice(0, 5),
    localEscolhidoId: "",
  });
}

export async function votarNoLocal(
  codigo: string,
  uid: string,
  localId: string,
) {
  await updateDoc(doc(obterFirestore(), "salas", codigo, "membros", uid), {
    votoLocal: localId,
  });
}

export async function escolherLocal(codigo: string, localId: string) {
  await updateDoc(doc(obterFirestore(), "salas", codigo), {
    localEscolhidoId: localId,
  });
}

export async function registrarPresenca(codigo: string, uid: string) {
  await updateDoc(doc(obterFirestore(), "salas", codigo, "membros", uid), {
    visto: serverTimestamp(),
  });
}

export type SalaParaResultado = {
  codigo: string;
  tipo: TipoSala;
  resultado: ResultadoSala;
  participantes: {
    uid: string;
    nome: string;
    humor: Humor;
    gasto: GastoOpcao;
    disposicao: Disposicao;
    tempo: TempoOpcao;
  }[];
};

export async function carregarSalaParaResultado(
  codigoBruto: string,
): Promise<SalaParaResultado | null> {
  const codigo = normalizarCodigo(codigoBruto);

  const bd = obterFirestore();

  const instantaneo = await getDoc(doc(bd, "salas", codigo));

  if (!instantaneo.exists()) {
    return null;
  }

  const sala = converterSala(instantaneo.data());

  if (!sala.resultado) {
    return null;
  }

  const membros = await getDocs(collection(bd, "salas", codigo, "membros"));

  const participantes = membros.docs
    .map((documento) => converterMembro(documento.id, documento.data()))
    .filter((membro) => membro.respostas !== null)
    .map((membro) => ({
      uid: membro.uid,
      nome: membro.nome,
      ...(membro.respostas as Respostas),
    }));

  return {
    codigo,
    tipo: sala.tipo,
    resultado: sala.resultado,
    participantes,
  };
}

import {
    arrayRemove,
    arrayUnion,
    collection,
    doc,
    DocumentData,
    getDoc,
    getDocs,
    onSnapshot,
    serverTimestamp,
    Unsubscribe,
    updateDoc,
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
};

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
};

export type MembroSala = {
  uid: string;
  nome: string;
  rodada: number;
  respostas: Respostas | null;
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
          }
        : null,
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

export async function sairDaSala(codigo: string, uid: string, ehDono: boolean) {
  const bd = obterFirestore();

  const referencia = doc(bd, "salas", codigo);

  if (ehDono) {
    await updateDoc(referencia, { estado: "encerrada" });

    return;
  }

  const lote = writeBatch(bd);

  lote.update(referencia, { membrosUids: arrayRemove(uid) });

  lote.delete(doc(bd, "salas", codigo, "membros", uid));

  await lote.commit();
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

export async function definirResultado(
  codigo: string,
  resultado: ResultadoSala,
) {
  await updateDoc(doc(obterFirestore(), "salas", codigo), {
    estado: "resultado",
    resultado,
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

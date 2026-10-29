import {
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    limit,
    onSnapshot,
    query,
    serverTimestamp,
    setDoc,
    Unsubscribe,
    updateDoc,
    where,
} from "firebase/firestore";

import { gerarCodigo, idPar, normalizarCodigo } from "../utils/codigos";
import { obterFirestore } from "./firebase";

export type Amizade = {
  id: string;
  amigoUid: string;
  amigoNome: string;
  estado: "pendente" | "aceita";
  solicitadaPorMim: boolean;
};

export type PessoaResumo = {
  uid: string;
  nome: string;
};

export async function obterOuCriarCodigoAmigo(uid: string, nome: string) {
  const bd = obterFirestore();

  const existente = await getDocs(
    query(collection(bd, "codigosAmigo"), where("uid", "==", uid), limit(1)),
  );

  if (!existente.empty) {
    return existente.docs[0].id;
  }

  for (let tentativa = 0; tentativa < 8; tentativa += 1) {
    const codigo = gerarCodigo(8);

    const referencia = doc(bd, "codigosAmigo", codigo);

    if ((await getDoc(referencia)).exists()) {
      continue;
    }

    await setDoc(referencia, { uid, nome, criadoEm: serverTimestamp() });

    return codigo;
  }

  throw new Error("codigo-indisponivel");
}

export async function buscarPorCodigoAmigo(
  codigoBruto: string,
): Promise<PessoaResumo | null> {
  const codigo = normalizarCodigo(codigoBruto);

  if (codigo.length !== 8) {
    throw new Error("codigo-invalido");
  }

  const instantaneo = await getDoc(
    doc(obterFirestore(), "codigosAmigo", codigo),
  );

  if (!instantaneo.exists()) {
    return null;
  }

  const dados = instantaneo.data();

  return { uid: String(dados.uid), nome: String(dados.nome ?? "Amigo") };
}

export async function solicitarAmizade(
  eu: PessoaResumo,
  outro: PessoaResumo,
): Promise<"pendente" | "aceita"> {
  if (eu.uid === outro.uid) {
    throw new Error("proprio-codigo");
  }

  const bd = obterFirestore();

  const referencia = doc(bd, "amizades", idPar(eu.uid, outro.uid));

  const existente = await getDoc(referencia);

  if (existente.exists()) {
    const dados = existente.data();

    if (dados.estado === "aceita") {
      throw new Error("ja-sao-amigos");
    }

    if (dados.solicitante === eu.uid) {
      throw new Error("pedido-ja-enviado");
    }

    await updateDoc(referencia, { estado: "aceita" });

    return "aceita";
  }

  await setDoc(referencia, {
    membros: [eu.uid, outro.uid].sort(),
    nomes: { [eu.uid]: eu.nome, [outro.uid]: outro.nome },
    solicitante: eu.uid,
    estado: "pendente",
    criadoEm: serverTimestamp(),
  });

  return "pendente";
}

export async function aceitarAmizade(id: string) {
  await updateDoc(doc(obterFirestore(), "amizades", id), { estado: "aceita" });
}

export async function removerAmizade(id: string) {
  await deleteDoc(doc(obterFirestore(), "amizades", id));
}

export function observarAmizades(
  uid: string,
  aoMudar: (lista: Amizade[]) => void,
  aoErro?: (erro: unknown) => void,
): Unsubscribe {
  const consulta = query(
    collection(obterFirestore(), "amizades"),
    where("membros", "array-contains", uid),
  );

  return onSnapshot(
    consulta,
    (instantaneo) => {
      aoMudar(
        instantaneo.docs.map((documento) => {
          const dados = documento.data();

          const membros = Array.isArray(dados.membros)
            ? (dados.membros as string[])
            : [];

          const amigoUid = membros.find((membro) => membro !== uid) ?? "";

          const nomes = (dados.nomes ?? {}) as Record<string, string>;

          return {
            id: documento.id,
            amigoUid,
            amigoNome: nomes[amigoUid] ?? "Amigo",
            estado: dados.estado === "aceita" ? "aceita" : "pendente",
            solicitadaPorMim: dados.solicitante === uid,
          } as Amizade;
        }),
      );
    },
    (erro) => aoErro?.(erro),
  );
}

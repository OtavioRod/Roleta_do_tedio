import {
    collection,
    deleteDoc,
    doc,
    getDoc,
    onSnapshot,
    query,
    serverTimestamp,
    setDoc,
    Unsubscribe,
    updateDoc,
    where,
} from "firebase/firestore";

import { obterFirestore } from "./firebase";

export type Convite = {
  id: string;
  deUid: string;
  deNome: string;
  salaCodigo: string;
  tipo: string;
};

export async function enviarConvite(
  de: { uid: string; nome: string },
  para: { uid: string },
  sala: { codigo: string; tipo: string },
): Promise<"enviado" | "ja-enviado"> {
  const referencia = doc(
    obterFirestore(),
    "convites",
    `${sala.codigo}_${para.uid}`,
  );

  try {
    const existente = await getDoc(referencia);

    if (existente.exists() && existente.data().estado === "pendente") {
      return "ja-enviado";
    }
  } catch {
    // sem permissão para ler um convite que não existe: segue e cria
  }

  try {
    await deleteDoc(referencia);
  } catch {
    // não existia ou já foi respondido: o setDoc abaixo recria o convite
  }

  await setDoc(referencia, {
    de: de.uid,
    deNome: de.nome,
    para: para.uid,
    salaCodigo: sala.codigo,
    tipo: sala.tipo,
    estado: "pendente",
    criadoEm: serverTimestamp(),
  });

  return "enviado";
}

export async function responderConvite(id: string, aceito: boolean) {
  await updateDoc(doc(obterFirestore(), "convites", id), {
    estado: aceito ? "aceito" : "recusado",
  });
}

export function observarConvitesRecebidos(
  uid: string,
  aoMudar: (lista: Convite[]) => void,
  aoErro?: (erro: unknown) => void,
): Unsubscribe {
  const consulta = query(
    collection(obterFirestore(), "convites"),
    where("para", "==", uid),
    where("estado", "==", "pendente"),
  );

  return onSnapshot(
    consulta,
    (instantaneo) => {
      aoMudar(
        instantaneo.docs.map((documento) => {
          const dados = documento.data();

          return {
            id: documento.id,
            deUid: String(dados.de),
            deNome: String(dados.deNome ?? "Um amigo"),
            salaCodigo: String(dados.salaCodigo),
            tipo: String(dados.tipo ?? "amigos"),
          };
        }),
      );
    },
    (erro) => aoErro?.(erro),
  );
}

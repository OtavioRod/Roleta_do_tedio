import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";

import { Genero, GENEROS } from "../constants/genero";
import { obterFirestore } from "./firebase";

export type PreferenciasNotificacao = {
  email: boolean;
  push: boolean;
};

export type NovoPerfil = {
  nome: string;
  genero: Genero;
  notificacoes: PreferenciasNotificacao;
};

export type Perfil = {
  uid: string;
  nome: string;
  email: string;
  genero: Genero;
  notificacoes: PreferenciasNotificacao;
  criadoEm: Date | null;
  ultimoLoginEm: Date | null;
  aceitouTermosEm: Date | null;
};

function paraData(valor: unknown): Date | null {
  if (
    valor &&
    typeof valor === "object" &&
    "toDate" in valor &&
    typeof (valor as { toDate: unknown }).toDate === "function"
  ) {
    return (valor as { toDate: () => Date }).toDate();
  }

  return null;
}

function paraGenero(valor: unknown): Genero {
  return GENEROS.some((opcao) => opcao.valor === valor)
    ? (valor as Genero)
    : "nao-informar";
}

export async function carregarPerfil(uid: string): Promise<Perfil | null> {
  const instantaneo = await getDoc(doc(obterFirestore(), "users", uid));

  if (!instantaneo.exists()) {
    return null;
  }

  const dados = instantaneo.data();

  return {
    uid,
    nome: typeof dados.nome === "string" ? dados.nome : "",
    email: typeof dados.email === "string" ? dados.email : "",
    genero: paraGenero(dados.genero),
    notificacoes: {
      email: dados.notificacoes?.email === true,
      push: dados.notificacoes?.push === true,
    },
    criadoEm: paraData(dados.criadoEm),
    ultimoLoginEm: paraData(dados.ultimoLoginEm),
    aceitouTermosEm: paraData(dados.aceitouTermosEm),
  };
}

export async function registrarLoginNoPerfil(
  uid: string,
  email: string,
  novo: NovoPerfil,
): Promise<Perfil | null> {
  const referencia = doc(obterFirestore(), "users", uid);

  const existente = await getDoc(referencia);

  if (existente.exists()) {
    await updateDoc(referencia, { ultimoLoginEm: serverTimestamp() });
  } else {
    await setDoc(referencia, {
      nome: novo.nome,
      email,
      genero: novo.genero,
      notificacoes: novo.notificacoes,
      aceitouTermosEm: serverTimestamp(),
      criadoEm: serverTimestamp(),
      ultimoLoginEm: serverTimestamp(),
    });
  }

  return carregarPerfil(uid);
}

export async function atualizarNotificacoes(
  uid: string,
  notificacoes: PreferenciasNotificacao,
) {
  await updateDoc(doc(obterFirestore(), "users", uid), { notificacoes });
}

import Constants from "expo-constants";
import { deleteDoc, doc, serverTimestamp, setDoc } from "firebase/firestore";
import { Platform } from "react-native";

import { obterFirestore } from "./firebase";

async function carregarNotificacoes() {
  try {
    return await import("expo-notifications");
  } catch {
    return null;
  }
}

function idProjeto() {
  const extra = Constants.expoConfig?.extra as
    | { eas?: { projectId?: string } }
    | undefined;

  return extra?.eas?.projectId ?? Constants.easConfig?.projectId ?? "";
}

async function obterToken() {
  if (Platform.OS === "web") {
    return null;
  }

  const modulo = await carregarNotificacoes();

  if (!modulo) {
    return null;
  }

  const permissao = await modulo.getPermissionsAsync();

  if (permissao.status !== "granted") {
    return null;
  }

  const projectId = idProjeto();

  if (!projectId) {
    return null;
  }

  if (Platform.OS === "android") {
    await modulo.setNotificationChannelAsync("padrao", {
      name: "Roleta do Tédio",
      importance: modulo.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const resposta = await modulo.getExpoPushTokenAsync({ projectId });

  return resposta.data;
}

function idDoDispositivo(token: string) {
  return token.replace(/[^A-Za-z0-9]/g, "_");
}

export async function registrarPush(uid: string): Promise<boolean> {
  try {
    const token = await obterToken();

    if (!token) {
      return false;
    }

    await setDoc(
      doc(obterFirestore(), "users", uid, "dispositivos", idDoDispositivo(token)),
      {
        token,
        plataforma: Platform.OS,
        atualizadoEm: serverTimestamp(),
      },
    );

    return true;
  } catch (erro) {
    console.warn("Não foi possível registrar o push:", erro);

    return false;
  }
}

export async function removerPush(uid: string) {
  try {
    const token = await obterToken();

    if (!token) {
      return;
    }

    await deleteDoc(
      doc(obterFirestore(), "users", uid, "dispositivos", idDoDispositivo(token)),
    );
  } catch {
    // sem token para remover
  }
}

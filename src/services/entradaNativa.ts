import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from "expo-local-authentication";
import { Platform } from "react-native";

const PREFIXO_CHAVE = "@roleta/entrada-nativa/";

export class ErroEntradaNativa extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = "ErroEntradaNativa";
  }
}

function chavePreferencia(uid: string) {
  return PREFIXO_CHAVE + uid;
}

export async function lerEntradaNativaAtivada(uid: string) {
  return (await AsyncStorage.getItem(chavePreferencia(uid))) === "sim";
}

export async function gravarEntradaNativaAtivada(
  uid: string,
  ativada: boolean,
) {
  if (ativada) {
    await AsyncStorage.setItem(chavePreferencia(uid), "sim");
    return;
  }

  await AsyncStorage.removeItem(chavePreferencia(uid));
}

export async function confirmarEntradaNativa(mensagem: string) {
  if (Platform.OS === "web") {
    throw new ErroEntradaNativa(
      "A entrada nativa está disponível somente no aplicativo instalado.",
    );
  }

  if (!(await LocalAuthentication.hasHardwareAsync())) {
    throw new ErroEntradaNativa(
      "Este aparelho não oferece autenticação biométrica.",
    );
  }

  if (!(await LocalAuthentication.isEnrolledAsync())) {
    throw new ErroEntradaNativa(
      "Cadastre uma biometria nas configurações do aparelho antes de continuar.",
    );
  }

  const resultado = await LocalAuthentication.authenticateAsync({
    promptMessage: mensagem,
    cancelLabel: "Cancelar",
  });

  if (!resultado.success) {
    throw new ErroEntradaNativa(
      "Entrada nativa cancelada. Entre novamente para continuar.",
    );
  }
}

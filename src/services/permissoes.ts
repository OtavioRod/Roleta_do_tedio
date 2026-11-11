import * as Location from "expo-location";
import { Platform } from "react-native";

export type EstadoPermissao =
  | "concedida"
  | "negada"
  | "nao-perguntada"
  | "indisponivel";

function mapearStatus(status: string): EstadoPermissao {
  if (status === "granted") {
    return "concedida";
  }

  if (status === "denied") {
    return "negada";
  }

  return "nao-perguntada";
}

function mapearNavegador(permissao: string): EstadoPermissao {
  if (permissao === "granted") {
    return "concedida";
  }

  if (permissao === "denied") {
    return "negada";
  }

  return "nao-perguntada";
}

async function carregarNotificacoes() {
  try {
    return await import("expo-notifications");
  } catch {
    return null;
  }
}

let comportamentoConfigurado = false;
let salaAbertaAgora: string | null = null;

export function definirSalaAberta(codigo: string | null) {
  salaAbertaAgora = codigo;
}

export async function configurarNotificacoes() {
  if (Platform.OS === "web" || comportamentoConfigurado) {
    return;
  }

  const modulo = await carregarNotificacoes();

  if (!modulo) {
    return;
  }

  try {
    modulo.setNotificationHandler({
      handleNotification: async (notificacao) => {
        const dados = notificacao.request.content.data as
          | Record<string, unknown>
          | undefined;

        const jaCoberta =
          (typeof dados?.salaCodigo === "string" &&
            dados.salaCodigo === salaAbertaAgora) ||
          dados?.tipo === "convite" ||
          dados?.tipo === "amizade";

        return {
          shouldPlaySound: false,
          shouldSetBadge: false,
          shouldShowBanner: !jaCoberta,
          shouldShowList: !jaCoberta,
        };
      },
    });

    comportamentoConfigurado = true;
  } catch (erro) {
    console.warn("Não foi possível configurar as notificações:", erro);
  }
}

export async function estadoLocalizacao(): Promise<EstadoPermissao> {
  try {
    const resposta = await Location.getForegroundPermissionsAsync();

    return mapearStatus(resposta.status);
  } catch {
    return "indisponivel";
  }
}

export async function pedirLocalizacao(): Promise<EstadoPermissao> {
  try {
    const resposta = await Location.requestForegroundPermissionsAsync();

    return mapearStatus(resposta.status);
  } catch {
    return "indisponivel";
  }
}

export async function estadoNotificacoes(): Promise<EstadoPermissao> {
  if (Platform.OS === "web") {
    if (typeof Notification === "undefined") {
      return "indisponivel";
    }

    return mapearNavegador(Notification.permission);
  }

  const modulo = await carregarNotificacoes();

  if (!modulo) {
    return "indisponivel";
  }

  try {
    const resposta = await modulo.getPermissionsAsync();

    return mapearStatus(resposta.status);
  } catch {
    return "indisponivel";
  }
}

export async function pedirNotificacoes(): Promise<EstadoPermissao> {
  if (Platform.OS === "web") {
    if (typeof Notification === "undefined") {
      return "indisponivel";
    }

    try {
      const resposta = await Notification.requestPermission();

      return mapearNavegador(resposta);
    } catch {
      return "indisponivel";
    }
  }

  const modulo = await carregarNotificacoes();

  if (!modulo) {
    return "indisponivel";
  }

  try {
    if (Platform.OS === "android") {
      await modulo.setNotificationChannelAsync("default", {
        name: "Avisos da Roleta do Tédio",
        importance: modulo.AndroidImportance.DEFAULT,
      });
    }

    const resposta = await modulo.requestPermissionsAsync({
      ios: { allowAlert: true, allowBadge: true, allowSound: true },
    });

    return mapearStatus(resposta.status);
  } catch (erro) {
    console.warn("Não foi possível pedir permissão de notificações:", erro);

    return "indisponivel";
  }
}
export async function exibirNotificacaoLocal(titulo: string, corpo: string) {
  if (Platform.OS === "web") {
    if (
      typeof Notification !== "undefined" &&
      Notification.permission === "granted"
    ) {
      new Notification(titulo, { body: corpo });
    }

    return;
  }

  const modulo = await carregarNotificacoes();

  if (!modulo) {
    return;
  }

  try {
    await modulo.scheduleNotificationAsync({
      content: { title: titulo, body: corpo },
      trigger: null,
    });
  } catch (erro) {
    console.warn("Não foi possível exibir a notificação:", erro);
  }
}

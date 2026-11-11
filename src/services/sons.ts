import {
  createAudioPlayer,
  setAudioModeAsync,
  type AudioPlayer,
} from "expo-audio";

export type NomeSom =
  | "clique"
  | "pergunta"
  | "notificacao"
  | "convite"
  | "entrou"
  | "roleta"
  | "resultado";

const FONTES: Record<NomeSom, number> = {
  clique: require("../../assets/sons/clique.wav"),
  pergunta: require("../../assets/sons/pergunta.wav"),
  notificacao: require("../../assets/sons/notificacao.wav"),
  convite: require("../../assets/sons/convite.wav"),
  entrou: require("../../assets/sons/entrou.wav"),
  roleta: require("../../assets/sons/roleta.wav"),
  resultado: require("../../assets/sons/resultado.wav"),
};

const VOLUMES: Record<NomeSom, number> = {
  clique: 0.5,
  pergunta: 0.6,
  notificacao: 0.9,
  convite: 1,
  entrou: 0.8,
  roleta: 0.7,
  resultado: 1,
};

const jogadores: Partial<Record<NomeSom, AudioPlayer>> = {};

let modoConfigurado = false;
let somAtivo = true;

export function definirSomAtivo(ativo: boolean) {
  somAtivo = ativo;
}

export function somEstaAtivo() {
  return somAtivo;
}

function configurarModo() {
  if (modoConfigurado) {
    return;
  }

  modoConfigurado = true;

  try {
    Promise.resolve(setAudioModeAsync({ playsInSilentMode: true })).catch(
      () => undefined,
    );
  } catch {}
}

function obterJogador(nome: NomeSom) {
  let jogador = jogadores[nome];

  if (!jogador) {
    jogador = createAudioPlayer(FONTES[nome]);
    jogador.volume = VOLUMES[nome];
    jogadores[nome] = jogador;
  }

  return jogador;
}

export function tocarSom(nome: NomeSom) {
  if (!somAtivo) {
    return;
  }

  try {
    configurarModo();

    const jogador = obterJogador(nome);

    Promise.resolve(jogador.seekTo(0))
      .catch(() => undefined)
      .finally(() => {
        try {
          jogador.play();
        } catch {}
      });
  } catch (erro) {
    if (__DEV__) {
      console.warn("Não foi possível tocar o som:", nome, erro);
    }
  }
}

export function pararSom(nome: NomeSom) {
  try {
    jogadores[nome]?.pause();
  } catch {}
}

import * as Location from "expo-location";
<<<<<<< HEAD
import { useRef, useState } from "react";
=======
import { useEffect, useRef, useState } from "react";
>>>>>>> 8e67322 (corrigindo antes de Aplicar a acessibilidade)
import {
  AccessibilityInfo,
  ActivityIndicator,
  Button,
  FlatList,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextStyle,
  TouchableOpacity,
  View,
} from "react-native";


import ParticipanteItem from "../components/ParticipanteItem";
import ResultadoEventos from "../components/ResultadoEventos";
import ResultadoFilmes from "../components/ResultadoFilmes";
import ResultadoJogos from "../components/ResultadoJogos";
import ResultadoLocais from "../components/ResultadoLocais";
import ResultadoReceitas from "../components/ResultadoReceitas";

import { Atividade, atividades, Gasto, Modalidade } from "../data/atividades";

import { Jogo, jogos } from "../data/jogos";

import { buscarLocais, Local, TipoLocal } from "../services/overpass";

import {
  buscarClima as buscarClimaService,
  Clima,
} from "../services/openMeteo";

import { salvarSessao } from "../services/backend";
import { buscarEventos, Evento } from "../services/eventos";
import { buscarFilmes, Filme } from "../services/filmes";
import { buscarReceitas, Receita } from "../services/receitas";

const VELOCIDADE_DIGITACAO = 18;

const TEMPO_LIMITE_PADRAO = 15000;
const TEMPO_LIMITE_LOCAIS = 30000;
const TEMPO_LIMITE_POSICAO = 20000;

const DURACAO_CACHE_LOCAIS = 10 * 60 * 1000;

const ERRO_TEMPO_ESGOTADO = "tempo-esgotado";

const cacheLocais = new Map<string, { quando: number; dados: Local[] }>();

type Tipo = "casal" | "amigos" | "sozinho";

type Etapa =
  | "sala"
  | "humor"
  | "humorEscolhido"
  | "gasto"
  | "gastoEscolhido"
  | "disposicao"
  | "disposicaoEscolhida"
  | "tempo"
  | "tempoEscolhido"
  | "resumo"
  | "resultado"
  | "resultadoModalidade"
  | "resultadoFilmes"
  | "resultadoJogos"
  | "resultadoEventos"
  | "localizacao";

type Humor = "preguiça" | "fome" | "animado" | "tranquilo" | "tanto faz";

type GastoOpcao = "R$ 0" | "até 30" | "até 60" | "até 100" | "sem limite";

type Disposicao = "baixa" | "media" | "alta";

type TempoOpcao =
  | "30 minutos"
  | "40 minutos"
  | "1 hora"
  | "2 horas"
  | "3 horas ou mais";

type Participante = {
  id: string;
  nome: string;
  humor: Humor | "";
  gasto: GastoOpcao | "";
  disposicao: Disposicao | "";
  tempo: TempoOpcao | "";
};

const OPCOES_TIPO: { valor: Tipo; rotulo: string }[] = [
  { valor: "casal", rotulo: "Casal" },
  { valor: "amigos", rotulo: "Amigos" },
  { valor: "sozinho", rotulo: "Sozinho" },
];

const OPCOES_HUMOR: { valor: Humor; rotulo: string }[] = [
  { valor: "preguiça", rotulo: "Com preguiça" },
  { valor: "fome", rotulo: "Com fome" },
  { valor: "animado", rotulo: "Animado" },
  { valor: "tranquilo", rotulo: "Tranquilo" },
  { valor: "tanto faz", rotulo: "Tanto faz" },
];

const OPCOES_GASTO: {
  valor: GastoOpcao;
  botao: string;
  rotulo: string;
  categoria: Gasto;
}[] = [
  {
    valor: "R$ 0",
    botao: "R$ 0 — Hoje não sai dinheiro",
    rotulo: "R$ 0",
    categoria: "nada",
  },
  {
    valor: "até 30",
    botao: "Até R$ 30",
    rotulo: "Até R$ 30",
    categoria: "pouco",
  },
  {
    valor: "até 60",
    botao: "Até R$ 60",
    rotulo: "Até R$ 60",
    categoria: "medio",
  },
  {
    valor: "até 100",
    botao: "Até R$ 100",
    rotulo: "Até R$ 100",
    categoria: "livre",
  },
  {
    valor: "sem limite",
    botao: "Hoje eu posso gastar",
    rotulo: "Sem limite",
    categoria: "livre",
  },
];

const OPCOES_DISPOSICAO: { valor: Disposicao; rotulo: string }[] = [
  { valor: "baixa", rotulo: "Pouca disposição" },
  { valor: "media", rotulo: "Disposto" },
  { valor: "alta", rotulo: "Muito disposto" },
];

const OPCOES_TEMPO: { valor: TempoOpcao; minutos: number }[] = [
  { valor: "30 minutos", minutos: 30 },
  { valor: "40 minutos", minutos: 40 },
  { valor: "1 hora", minutos: 60 },
  { valor: "2 horas", minutos: 120 },
  { valor: "3 horas ou mais", minutos: 180 },
];

const TIPO_LOCAL_POR_ATIVIDADE: Partial<Record<string, TipoLocal>> = {
  restaurante: "restaurante",
  cafe: "cafe",
  cinema: "cinema",
  parque: "parque",
  passeio: "passeio",
};

const ATIVIDADES_COM_LOCALIZACAO = [
  "restaurante",
  "cafe",
  "cinema",
  "parque",
  "passeio",
  "evento",
];

const ROTULO_BOTAO_RESULTADO: Record<string, string> = {
  "filme-casa": "Escolher filme",
  jogar: "Ver sugestões",
  evento: "Encontrar eventos",
  cinema: "Encontrar cinemas e filmes",
  cafe: "Descobrir a melhor opção",
};

const TITULO_LOCAIS: Record<string, string> = {
  cafe: "Cafeterias próximas",
  parque: "Parques próximos",
  cinema: "Cinemas próximos",
  passeio: "Lugares próximos",
  restaurante: "Restaurantes próximos",
};

function avisar(mensagem: string) {
  alert(mensagem);
}

function comTimeout<T>(
  promessa: Promise<T>,
  limiteMs: number = TEMPO_LIMITE_PADRAO,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const temporizador = setTimeout(() => {
      reject(new Error(ERRO_TEMPO_ESGOTADO));
    }, limiteMs);

    promessa.then(
      (valor) => {
        clearTimeout(temporizador);
        resolve(valor);
      },
      (erro) => {
        clearTimeout(temporizador);
        reject(erro);
      },
    );
  });
}

function mensagemDeErro(erro: unknown, padrao: string) {
  if (erro instanceof Error && erro.message === ERRO_TEMPO_ESGOTADO) {
    return "A consulta demorou demais. Verifique sua conexão e tente novamente.";
  }

  return padrao;
}

async function buscarCidadeOnline(
  lat: number,
  lon: number,
): Promise<string | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=10&addressdetails=1&accept-language=pt-BR&lat=${lat}&lon=${lon}`;

    const resposta = await comTimeout(fetch(url), 10000);

    if (!resposta.ok) {
      return null;
    }

    const dados = await resposta.json();

    const endereco = dados?.address ?? {};

    return (
      endereco.city ??
      endereco.town ??
      endereco.village ??
      endereco.municipality ??
      endereco.county ??
      null
    );
  } catch (erro) {
    console.error("Falha ao identificar a cidade online:", erro);

    return null;
  }
}

function rotuloHumor(valor: Humor | "") {
  return OPCOES_HUMOR.find((opcao) => opcao.valor === valor)?.rotulo ?? valor;
}

function rotuloGasto(valor: GastoOpcao | "") {
  return OPCOES_GASTO.find((opcao) => opcao.valor === valor)?.rotulo ?? valor;
}

function rotuloDisposicao(valor: Disposicao | "") {
  return (
    OPCOES_DISPOSICAO.find((opcao) => opcao.valor === valor)?.rotulo ?? valor
  );
}

function converterGasto(gasto: GastoOpcao | ""): Gasto | "" {
  return OPCOES_GASTO.find((opcao) => opcao.valor === gasto)?.categoria ?? "";
}

function converterTempo(tempo: TempoOpcao | "") {
  return OPCOES_TEMPO.find((opcao) => opcao.valor === tempo)?.minutos ?? 0;
}

function gerarId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function criarParticipante(nome: string): Participante {
  return {
    id: gerarId(),
    nome,
    humor: "",
    gasto: "",
    disposicao: "",
    tempo: "",
  };
}

function useReduzirMovimento() {
  const [reduzir, setReduzir] = useState(false);

  useEffect(() => {
    let ativo = true;

    AccessibilityInfo.isReduceMotionEnabled()
      .then((valor) => {
        if (ativo) {
          setReduzir(valor);
        }
      })
      .catch(() => {
        if (ativo) {
          setReduzir(false);
        }
      });

    return () => {
      ativo = false;
    };
  }, []);

  return reduzir;
}

type TextoDigitadoProps = {
  texto: string;
  estilo?: StyleProp<TextStyle>;
  atraso?: number;
  velocidade?: number;
};

function TextoDigitado({
  texto,
  estilo,
  atraso = 0,
  velocidade = VELOCIDADE_DIGITACAO,
}: TextoDigitadoProps) {
  const [quantidade, setQuantidade] = useState(0);

  const reduzirMovimento = useReduzirMovimento();

  useEffect(() => {
    if (reduzirMovimento) {
      setQuantidade(texto.length);

      return undefined;
    }

    setQuantidade(0);

    let intervalo: ReturnType<typeof setInterval> | undefined;

    const inicio = setTimeout(() => {
      let atual = 0;

      intervalo = setInterval(() => {
        atual += 1;

        setQuantidade(atual);

        if (atual >= texto.length && intervalo) {
          clearInterval(intervalo);
        }
      }, velocidade);
    }, atraso);

    return () => {
      clearTimeout(inicio);

      if (intervalo) {
        clearInterval(intervalo);
      }
    };
  }, [texto, atraso, velocidade, reduzirMovimento]);

  return (
    <Text style={estilo} accessibilityLabel={texto}>
      {texto.slice(0, quantidade)}
      <Text style={styles.textoInvisivel}>{texto.slice(quantidade)}</Text>
    </Text>
  );
}

type PerguntaAnimadaProps = {
  titulo: string;
  descricao?: string;
  descricaoMenor?: string;
  modoEscuro: boolean;
};

function PerguntaAnimada({
  titulo,
  descricao,
  descricaoMenor,
  modoEscuro,
}: PerguntaAnimadaProps) {
  const atrasoDescricao = titulo.length * VELOCIDADE_DIGITACAO;

  const atrasoDescricaoMenor =
    atrasoDescricao + (descricao?.length ?? 0) * VELOCIDADE_DIGITACAO;

  return (
    <>
      <TextoDigitado
        texto={titulo}
        estilo={[styles.titulo, modoEscuro && styles.textoEscuro]}
      />

      {descricao ? (
        <TextoDigitado
          texto={descricao}
          atraso={atrasoDescricao}
          estilo={[styles.descricao, modoEscuro && styles.textoEscuro]}
        />
      ) : null}

      {descricaoMenor ? (
        <TextoDigitado
          texto={descricaoMenor}
          atraso={atrasoDescricaoMenor}
          estilo={[styles.descricaoMenor, modoEscuro && styles.textoEscuro]}
        />
      ) : null}
    </>
  );
}

export default function Index() {
  const [iniciou, setIniciou] = useState(false);
  const [tipo, setTipo] = useState<Tipo | "">("");
  const [salaCriada, setSalaCriada] = useState(false);
  const [codigoSala, setCodigoSala] = useState("");

  const [etapa, setEtapa] = useState<Etapa>("sala");

  const [modoEscuro, setModoEscuro] = useState(false);

  const [nomeParticipante, setNomeParticipante] = useState("");

  const [participantes, setParticipantes] = useState<Participante[]>([]);

  const [participanteAtual, setParticipanteAtual] = useState(0);

  const [atividadeEscolhida, setAtividadeEscolhida] =
    useState<Atividade | null>(null);

  const [atividadeSemFiltro, setAtividadeSemFiltro] = useState(false);

  const [modalidadeEscolhida, setModalidadeEscolhida] =
    useState<Modalidade | null>(null);

  const [latitude, setLatitude] = useState<number | null>(null);

  const [longitude, setLongitude] = useState<number | null>(null);

  const [precisao, setPrecisao] = useState<number | null>(null);

  const [locais, setLocais] = useState<Local[]>([]);

  const [clima, setClima] = useState<Clima | null>(null);

  const [filmes, setFilmes] = useState<Filme[]>([]);

  const [eventos, setEventos] = useState<Evento[]>([]);

  const [receitas, setReceitas] = useState<Receita[]>([]);

  const [jogosFiltrados, setJogosFiltrados] = useState<Jogo[]>([]);

  const [jogosSemFiltro, setJogosSemFiltro] = useState(false);

  const [carregandoLocalizacao, setCarregandoLocalizacao] = useState(false);

  const [carregandoLocais, setCarregandoLocais] = useState(false);

  const [carregandoFilmes, setCarregandoFilmes] = useState(false);

  const [carregandoEventos, setCarregandoEventos] = useState(false);

  const [carregandoReceitas, setCarregandoReceitas] = useState(false);

  const [erroApi, setErroApi] = useState("");

<<<<<<< HEAD
  const roletaEmProcessamento = useRef(false);

  function comecar() {
    setIniciou(true);
  }
=======
  const [erroClima, setErroClima] = useState("");
>>>>>>> 8e67322 (corrigindo antes de Aplicar a acessibilidade)

  const [erroFilmes, setErroFilmes] = useState("");

  const [permissaoNegada, setPermissaoNegada] = useState(false);

  const execucaoId = useRef(0);

  function criarSala() {
    const nome = nomeParticipante.trim();

    if (nome === "") {
      avisar("A roleta ainda não sabe quem é você. Digite seu nome primeiro!");
      return;
    }

    if (tipo === "") {
      avisar("Calma aí. Primeiro precisamos saber quem está participando.");
      return;
    }

    const codigo = Math.random().toString(36).substring(2, 6).toUpperCase();

    setCodigoSala(codigo);
    setParticipantes([criarParticipante(nome)]);
    setNomeParticipante("");
    setSalaCriada(true);
  }

  function podeContinuar() {
    if (tipo === "sozinho") {
      return participantes.length === 1;
    }

    if (tipo === "casal") {
      return participantes.length === 2;
    }

    if (tipo === "amigos") {
      return participantes.length >= 2 && participantes.length <= 10;
    }

    return false;
  }

  function continuar() {
    if (!podeContinuar()) {
      if (tipo === "casal") {
        avisar(
          "Para o modo casal, precisamos de duas pessoas. Nem a roleta consegue namorar sozinha.",
        );
        return;
      }

      if (tipo === "amigos") {
        avisar(
          "Adicione pelo menos mais uma pessoa. Tédio em grupo é mais divertido.",
        );
        return;
      }

      return;
    }

    setParticipanteAtual(0);
    setEtapa("humor");
  }

  function atualizarAtual<K extends "humor" | "gasto" | "disposicao" | "tempo">(
    campo: K,
    valor: Participante[K],
  ) {
    setParticipantes((anteriores) =>
      anteriores.map((participante, index) =>
        index === participanteAtual
          ? { ...participante, [campo]: valor }
          : participante,
      ),
    );
  }

  function escolherHumor(valor: Humor) {
    atualizarAtual("humor", valor);
    setEtapa("humorEscolhido");
  }

  function escolherGasto(valor: GastoOpcao) {
    atualizarAtual("gasto", valor);
    setEtapa("gastoEscolhido");
  }

  function escolherDisposicao(valor: Disposicao) {
    atualizarAtual("disposicao", valor);
    setEtapa("disposicaoEscolhida");
  }

  function escolherTempo(valor: TempoOpcao) {
    atualizarAtual("tempo", valor);
    setEtapa("tempoEscolhido");
  }

  function proximoParticipante() {
    if (participanteAtual < participantes.length - 1) {
      setParticipanteAtual(participanteAtual + 1);
      setEtapa("humor");
      return;
    }

    setEtapa("resumo");
  }

  function adicionarParticipante() {
    const nome = nomeParticipante.trim();

    if (nome === "") {
      avisar("Digite o nome de quem vai entrar na brincadeira.");
      return;
    }

    if (
      participantes.some(
        (participante) =>
          participante.nome.toLowerCase() === nome.toLowerCase(),
      )
    ) {
      avisar("Esse participante já está na sala. A roleta percebeu.");
      return;
    }

    if (tipo === "sozinho") {
      avisar("No modo sozinho, a companhia oficial é você mesmo.");
      return;
    }

    if (tipo === "casal" && participantes.length >= 2) {
      avisar(
        "O modo casal já está completo. Não cabe mais um no relacionamento.",
      );
      return;
    }

    if (tipo === "amigos" && participantes.length >= 10) {
      avisar(
        "A sala chegou ao limite de 10 pessoas. Já está parecendo reunião.",
      );
      return;
    }

    setParticipantes((anteriores) => [...anteriores, criarParticipante(nome)]);
    setNomeParticipante("");
  }

  function removerParticipante(id: string) {
    if (tipo === "sozinho") {
      avisar("Você não pode remover o único participante. Aí vira nada.");
      return;
    }

    setParticipantes((anteriores) =>
      anteriores.filter((participante) => participante.id !== id),
    );
  }

  function alternarTema() {
    setModoEscuro((anterior) => !anterior);
  }

  function menorTempoDisponivel() {
    let menor = 999;

    for (const participante of participantes) {
      const tempo = converterTempo(participante.tempo);

      if (tempo < menor) {
        menor = tempo;
      }
    }

    return menor;
  }

  function atividadePodeSerEscolhida(atividade: Atividade) {
    const tempo = menorTempoDisponivel();

    for (const participante of participantes) {
      const gastoConvertido = converterGasto(participante.gasto);

      if (
        gastoConvertido === "" ||
        !atividade.gasto.includes(gastoConvertido)
      ) {
        return false;
      }

      if (
        !atividade.disposicao.includes(
          participante.disposicao as Atividade["disposicao"][number],
        )
      ) {
        return false;
      }
    }

    if (tempo < atividade.tempoMinimo) {
      return false;
    }

    return true;
  }

  function calcularPontuacao(atividade: Atividade) {
    let pontos = 0;

    const tempo = menorTempoDisponivel();

    if (tempo >= atividade.tempoMinimo && tempo <= atividade.tempoMaximo) {
      pontos += 4;
    } else if (tempo >= atividade.tempoMinimo) {
      pontos += 2;
    }

    for (const participante of participantes) {
      const gastoConvertido = converterGasto(participante.gasto);

      if (gastoConvertido !== "" && atividade.gasto.includes(gastoConvertido)) {
        pontos += 2;
      }

      if (
        atividade.disposicao.includes(
          participante.disposicao as Atividade["disposicao"][number],
        )
      ) {
        pontos += 2;
      }

      if (
        participante.humor === "preguiça" &&
        atividade.disposicao.includes("baixa")
      ) {
        pontos += 2;
      }

      if (
        participante.humor === "animado" &&
        atividade.disposicao.includes("alta")
      ) {
        pontos += 2;
      }

      if (participante.humor === "fome" && atividade.id === "restaurante") {
        pontos += 4;
      }

      if (participante.humor === "fome" && atividade.id === "cafe") {
        pontos += 2;
      }

      if (
        participante.humor === "tranquilo" &&
        atividade.disposicao.includes("baixa")
      ) {
        pontos += 2;
      }

      if (participante.humor === "tanto faz") {
        pontos += 1;
      }
    }

    return pontos;
  }

<<<<<<< HEAD
  function escolherAtividade() {
    if (roletaEmProcessamento.current) {
      return;
    }

    roletaEmProcessamento.current = true;

    setCarregandoRoleta(true);
=======
  function salvarSessaoSemBloquear(nomeAtividade: string, tipoSala: string) {
    (async () => {
      try {
        await salvarSessao(nomeAtividade, tipoSala);
      } catch (erro) {
        console.error("Não foi possível salvar a sessão:", erro);
      }
    })();
  }

  function escolherAtividade() {
>>>>>>> 8e67322 (corrigindo antes de Aplicar a acessibilidade)
    setErroApi("");
    setModalidadeEscolhida(null);

    let escolhida: Atividade;

    const atividadesValidas = atividades.filter((atividade) =>
      atividadePodeSerEscolhida(atividade),
    );

    if (atividadesValidas.length === 0) {
      escolhida = atividades[Math.floor(Math.random() * atividades.length)];

      setAtividadeSemFiltro(true);
    } else {
      let maiorPontuacao = -1;
      let melhores: Atividade[] = [];

      for (const atividade of atividadesValidas) {
        const pontuacao = calcularPontuacao(atividade);

        if (pontuacao > maiorPontuacao) {
          maiorPontuacao = pontuacao;
          melhores = [atividade];
        } else if (pontuacao === maiorPontuacao) {
          melhores.push(atividade);
        }
      }

      escolhida = melhores[Math.floor(Math.random() * melhores.length)];

      setAtividadeSemFiltro(false);
    }

    setAtividadeEscolhida(escolhida);
<<<<<<< HEAD

    setCarregandoRoleta(false);

    setEtapa("resultado");

    roletaEmProcessamento.current = false;

    void salvarSessao(escolhida.nome, tipo).catch((erro) => {
      console.error("Não foi possível salvar a sessão:", erro);
    });
=======
    setEtapa("resultado");

    salvarSessaoSemBloquear(escolhida.nome, tipo);
>>>>>>> 8e67322 (corrigindo antes de Aplicar a acessibilidade)
  }

  function calcularModalidadeCafe(): Modalidade | null {
    const modalidades = atividadeEscolhida?.modalidades ?? [];

    const tempo = menorTempoDisponivel();

    let melhorModalidade: Modalidade | null = null;

    let maiorPontuacao = -1;

    for (const modalidade of modalidades) {
      let pontos = 0;

      if (tempo >= modalidade.tempoMinimo && tempo <= modalidade.tempoMaximo) {
        pontos += 4;
      } else if (tempo >= modalidade.tempoMinimo) {
        pontos += 1;
      } else {
        continue;
      }

      for (const participante of participantes) {
        const gasto = converterGasto(participante.gasto);

        if (gasto !== "" && modalidade.gasto.includes(gasto)) {
          pontos += 3;
        }

        if (
          modalidade.disposicao.includes(
            participante.disposicao as Modalidade["disposicao"][number],
          )
        ) {
          pontos += 3;
        }

        if (
          participante.humor === "preguiça" &&
          modalidade.disposicao.includes("baixa")
        ) {
          pontos += 2;
        }

        if (
          participante.humor === "animado" &&
          modalidade.disposicao.includes("alta")
        ) {
          pontos += 2;
        }

        if (participante.humor === "tanto faz") {
          pontos += 1;
        }

        if (participante.gasto === "R$ 0" && modalidade.id === "cafe-casa") {
          pontos += 4;
        }

        if (
          participante.disposicao === "baixa" &&
          modalidade.id === "cafe-casa"
        ) {
          pontos += 3;
        }
      }

      if (pontos > maiorPontuacao) {
        maiorPontuacao = pontos;
        melhorModalidade = modalidade;
      }
    }

    return melhorModalidade;
  }

  function calcularModalidadeCafeComClima(
    climaAtual: Clima,
  ): Modalidade | null {
    const modalidades = atividadeEscolhida?.modalidades ?? [];

    const tempo = menorTempoDisponivel();

    let melhor: Modalidade | null = null;

    let maiorPontuacao = -1;

    for (const modalidade of modalidades) {
      let pontos = 0;

      if (tempo < modalidade.tempoMinimo) {
        continue;
      }

      if (tempo <= modalidade.tempoMaximo) {
        pontos += 4;
      } else {
        pontos += 1;
      }

      for (const participante of participantes) {
        const gasto = converterGasto(participante.gasto);

        if (gasto !== "" && modalidade.gasto.includes(gasto)) {
          pontos += 3;
        }

        if (
          modalidade.disposicao.includes(
            participante.disposicao as Modalidade["disposicao"][number],
          )
        ) {
          pontos += 3;
        }

        if (
          participante.humor === "preguiça" &&
          modalidade.disposicao.includes("baixa")
        ) {
          pontos += 2;
        }

        if (
          participante.humor === "animado" &&
          modalidade.disposicao.includes("alta")
        ) {
          pontos += 2;
        }

        if (participante.humor === "tanto faz") {
          pontos += 1;
        }

        if (participante.gasto === "R$ 0" && modalidade.id === "cafe-casa") {
          pontos += 5;
        }

        if (
          participante.disposicao === "baixa" &&
          modalidade.id === "cafe-casa"
        ) {
          pontos += 3;
        }

        if (
          participante.disposicao === "alta" &&
          modalidade.id === "cafe-fora"
        ) {
          pontos += 3;
        }
      }

      if (climaAtual.chuva > 0 && modalidade.id === "cafe-casa") {
        pontos += 5;
      }

      if (climaAtual.chuva === 0 && modalidade.id === "cafe-fora") {
        pontos += 3;
      }

      if (climaAtual.chuva > 0 && modalidade.id === "cafe-fora") {
        pontos -= 3;
      }

      if (pontos > maiorPontuacao) {
        maiorPontuacao = pontos;
        melhor = modalidade;
      }
    }

    return melhor;
  }

  async function buscarClima(lat: number, lon: number) {
    const id = execucaoId.current;

    try {
      const climaAtual = await comTimeout(
        buscarClimaService(lat, lon),
        TEMPO_LIMITE_PADRAO,
      );

      if (id !== execucaoId.current) {
        return null;
      }

      setClima(climaAtual);

      return climaAtual;
    } catch (erro) {
      if (id === execucaoId.current) {
        setErroClima(
          mensagemDeErro(erro, "Não foi possível consultar o clima."),
        );
      }

      return null;
    }
  }

  function obterTipoLocal(): TipoLocal | null {
    if (!atividadeEscolhida) {
      return null;
    }

    return TIPO_LOCAL_POR_ATIVIDADE[atividadeEscolhida.id] ?? null;
  }

  function precisaDeLocalizacao() {
    if (!atividadeEscolhida) {
      return false;
    }

    return ATIVIDADES_COM_LOCALIZACAO.includes(atividadeEscolhida.id);
  }

  async function buscarLocaisProximos(
    lat: number,
    lon: number,
    tipoLocalForcado?: TipoLocal,
  ) {
    const id = execucaoId.current;

    const tipoLocal = tipoLocalForcado ?? obterTipoLocal();

    if (!tipoLocal) {
      setLocais([]);
      return;
    }

    const chaveCache = `${tipoLocal}:${lat.toFixed(3)}:${lon.toFixed(3)}`;

    const emCache = cacheLocais.get(chaveCache);

    if (emCache && Date.now() - emCache.quando < DURACAO_CACHE_LOCAIS) {
      setLocais(emCache.dados);
      return;
    }

    try {
      setCarregandoLocais(true);
      setErroApi("");

      const resultados = await comTimeout(
        buscarLocais(lat, lon, tipoLocal),
        TEMPO_LIMITE_LOCAIS,
      );

      if (id !== execucaoId.current) {
        return;
      }

      setLocais(resultados);

      if (resultados.length === 0) {
        setErroApi(
          "Nenhuma opção foi encontrada próxima da localização informada.",
        );
      } else {
        cacheLocais.set(chaveCache, { quando: Date.now(), dados: resultados });
      }
    } catch (erro) {
      if (id !== execucaoId.current) {
        return;
      }

      console.error("Erro ao buscar locais próximos:", erro);

      setErroApi(
        mensagemDeErro(erro, "Não foi possível buscar opções próximas."),
      );
    } finally {
      if (id === execucaoId.current) {
        setCarregandoLocais(false);
      }
    }
  }

  async function buscarFilmesResultado() {
    const id = execucaoId.current;

    try {
      setCarregandoFilmes(true);
      setErroFilmes("");

      const resultados = await comTimeout(buscarFilmes(8), TEMPO_LIMITE_PADRAO);

      if (id !== execucaoId.current) {
        return;
      }

      setFilmes(resultados);

      if (resultados.length === 0) {
        setErroFilmes("Não encontramos filmes disponíveis para mostrar.");
      }
    } catch (erro) {
      if (id === execucaoId.current) {
        setErroFilmes(
          mensagemDeErro(erro, "Não foi possível consultar os filmes."),
        );
      }
    } finally {
      if (id === execucaoId.current) {
        setCarregandoFilmes(false);
      }
    }
  }

  async function buscarReceitasResultado() {
    const id = execucaoId.current;

    try {
      setCarregandoReceitas(true);
      setErroApi("");

      const resultados = await comTimeout(
        buscarReceitas(6),
        TEMPO_LIMITE_PADRAO,
      );

      if (id !== execucaoId.current) {
        return;
      }

      setReceitas(resultados);

      if (resultados.length === 0) {
        setErroApi("Não encontramos receitas disponíveis.");
      }
    } catch (erro) {
      if (id === execucaoId.current) {
        setErroApi(
          mensagemDeErro(erro, "Não foi possível consultar as receitas."),
        );
      }
    } finally {
      if (id === execucaoId.current) {
        setCarregandoReceitas(false);
      }
    }
  }

  function jogoCombinaComParticipantes(jogo: Jogo) {
    const quantidade = participantes.length;

    if (
      quantidade < jogo.jogadoresMinimos ||
      quantidade > jogo.jogadoresMaximos
    ) {
      return false;
    }

    const tempo = menorTempoDisponivel();

    if (jogo.tempo > tempo) {
      return false;
    }

    for (const participante of participantes) {
      const gasto = converterGasto(participante.gasto);

      if (gasto === "nada" && jogo.gasto !== "nada") {
        return false;
      }

      if (gasto === "pouco" && jogo.gasto === "medio") {
        return false;
      }

      if (
        participante.disposicao === "baixa" &&
        jogo.dificuldade === "Difícil"
      ) {
        return false;
      }
    }

    return true;
  }

  function pontuarJogo(jogo: Jogo, tempo: number) {
    let pontos = 0;

    if (jogo.tempo <= tempo) {
      pontos += 2;
    }

    for (const participante of participantes) {
      if (participante.disposicao === "baixa" && jogo.dificuldade === "Fácil") {
        pontos += 2;
      }

      if (
        participante.disposicao === "alta" &&
        jogo.dificuldade === "Difícil"
      ) {
        pontos += 2;
      }
    }

    return pontos;
  }

  function ordenarJogos(lista: Jogo[]) {
    const tempo = menorTempoDisponivel();

    return lista
      .map((jogo) => ({ jogo, pontos: pontuarJogo(jogo, tempo) }))
      .sort((a, b) => b.pontos - a.pontos)
      .map((item) => item.jogo);
  }

  function prepararJogos() {
    const filtrados = jogos.filter((jogo) => jogoCombinaComParticipantes(jogo));

    const semFiltro = filtrados.length === 0;

    const ordenados = ordenarJogos(semFiltro ? jogos : filtrados);

    setJogosSemFiltro(semFiltro);
    setJogosFiltrados(ordenados.slice(0, 8));
  }

  async function obterCidadeAtual(
    lat: number,
    lon: number,
  ): Promise<string | null> {
    if (Platform.OS !== "web") {
      try {
        const enderecos = await comTimeout(
          Location.reverseGeocodeAsync({
            latitude: lat,
            longitude: lon,
          }),
          10000,
        );

        const endereco = enderecos[0];

        const cidade =
          endereco?.city ?? endereco?.subregion ?? endereco?.district ?? null;

        if (cidade) {
          return cidade;
        }
      } catch (erro) {
        console.error("Falha na geocodificação nativa:", erro);
      }
    }

    return buscarCidadeOnline(lat, lon);
  }

  async function buscarEventosResultado(lat: number, lon: number) {
    const id = execucaoId.current;

    try {
      setCarregandoEventos(true);
      setErroApi("");

      const cidade = await obterCidadeAtual(lat, lon);

      if (id !== execucaoId.current) {
        return;
      }

      if (!cidade) {
        setErroApi(
          "Não conseguimos identificar sua cidade para buscar eventos.",
        );
        return;
      }

      const resultados = await comTimeout(
        buscarEventos(cidade, 10),
        TEMPO_LIMITE_PADRAO,
      );

      if (id !== execucaoId.current) {
        return;
      }

      setEventos(resultados);

      if (resultados.length === 0) {
        setErroApi(`Não encontramos eventos cadastrados para ${cidade}.`);
      }
    } catch (erro) {
      if (id === execucaoId.current) {
        setErroApi(
          mensagemDeErro(erro, "Não foi possível consultar eventos próximos."),
        );
      }
    } finally {
      if (id === execucaoId.current) {
        setCarregandoEventos(false);
      }
    }
  }

  async function obterPosicao() {
    try {
      return await comTimeout(
        Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        }),
        TEMPO_LIMITE_POSICAO,
      );
    } catch (erro) {
      try {
        const ultima = await Location.getLastKnownPositionAsync();

        if (ultima) {
          return ultima;
        }
      } catch (erroUltima) {
        console.error(
          "Não foi possível obter a última posição conhecida:",
          erroUltima,
        );
      }

      throw erro;
    }
  }

  async function buscarLocalizacao() {
    execucaoId.current += 1;

    const id = execucaoId.current;

    const cancelado = () => id !== execucaoId.current;

    try {
      setCarregandoLocalizacao(true);
      setErroApi("");
      setErroClima("");
      setPermissaoNegada(false);

      const permissao = await Location.requestForegroundPermissionsAsync();

      if (cancelado()) {
        return;
      }

      if (permissao.status !== "granted") {
        setPermissaoNegada(true);

        setErroApi(
          "Permissão de localização não concedida. Autorize a localização para encontrar opções próximas.",
        );

        return;
      }

      const localizacao = await obterPosicao();

      if (cancelado()) {
        return;
      }

      const lat = localizacao.coords.latitude;

      const lon = localizacao.coords.longitude;

      setLatitude(lat);
      setLongitude(lon);
      setPrecisao(localizacao.coords.accuracy ?? null);

      const climaAtual = await buscarClima(lat, lon);

      if (cancelado()) {
        return;
      }

      if (atividadeEscolhida?.id === "cafe") {
        const modalidade = climaAtual
          ? calcularModalidadeCafeComClima(climaAtual)
          : calcularModalidadeCafe();

        setModalidadeEscolhida(modalidade);

        if (!modalidade) {
          setErroApi(
            "Não encontramos uma forma de café que caiba no tempo de vocês.",
          );

          return;
        }

        if (modalidade.id === "cafe-casa") {
          setLocais([]);
          setReceitas([]);

          setEtapa("resultadoModalidade");

          await buscarReceitasResultado();

          return;
        }

        await buscarLocaisProximos(lat, lon, "cafe");

        return;
      }

      if (atividadeEscolhida?.id === "evento") {
        setLocais([]);
        setEventos([]);

        setEtapa("resultadoEventos");

        await buscarEventosResultado(lat, lon);

        return;
      }

      if (atividadeEscolhida?.id === "cinema") {
        setLocais([]);
        setFilmes([]);

        await Promise.all([
          buscarLocaisProximos(lat, lon),
          buscarFilmesResultado(),
        ]);

        return;
      }

      await buscarLocaisProximos(lat, lon);
    } catch (erro) {
      if (cancelado()) {
        return;
      }

      console.error("Erro ao obter localização:", erro);

      setErroApi(
        mensagemDeErro(
          erro,
          "Não foi possível obter sua localização. Verifique se o GPS está disponível e tente novamente.",
        ),
      );
    } finally {
      if (!cancelado()) {
        setCarregandoLocalizacao(false);
      }
    }
  }

  async function continuarDepoisResultado() {
    if (!atividadeEscolhida) {
      return;
    }

    execucaoId.current += 1;

    setErroApi("");

    if (atividadeEscolhida.id === "jogar") {
      prepararJogos();
      setEtapa("resultadoJogos");
      return;
    }

    if (atividadeEscolhida.id === "filme-casa") {
      setFilmes([]);
      setEtapa("resultadoFilmes");

      await buscarFilmesResultado();

      return;
    }

    if (precisaDeLocalizacao()) {
      setEtapa("localizacao");

      await buscarLocalizacao();

      return;
    }

    setEtapa("resultado");
  }

  function continuarParaLocalizacao() {
    setLocais([]);
    setClima(null);
    setFilmes([]);
    setEventos([]);
    setReceitas([]);
    setJogosFiltrados([]);
    setJogosSemFiltro(false);
    setErroApi("");
    setErroClima("");
    setErroFilmes("");
    setPermissaoNegada(false);
    setLatitude(null);
    setLongitude(null);
    setPrecisao(null);

    if (atividadeEscolhida?.id !== "cafe") {
      setModalidadeEscolhida(null);
    }

    continuarDepoisResultado();
  }

  function climaPermiteAtividade() {
    if (!atividadeEscolhida || !clima) {
      return true;
    }

    if (atividadeEscolhida.chuvaPermitida) {
      return true;
    }

    return clima.chuva === 0;
  }

  async function abrirConfiguracoes() {
    if (Platform.OS === "web") {
      return;
    }

    try {
      await Linking.openSettings();
    } catch (erro) {
      console.error("Não foi possível abrir as configurações:", erro);
    }
  }

  function reiniciar() {
    execucaoId.current += 1;

    setIniciou(false);
    setTipo("");
    setSalaCriada(false);
    setCodigoSala("");
    setEtapa("sala");
    setNomeParticipante("");
    setParticipantes([]);
    setParticipanteAtual(0);
    setAtividadeEscolhida(null);
    setAtividadeSemFiltro(false);
    setModalidadeEscolhida(null);
    setLatitude(null);
    setLongitude(null);
    setPrecisao(null);
    setLocais([]);
    setClima(null);
    setFilmes([]);
    setEventos([]);
    setReceitas([]);
    setJogosFiltrados([]);
    setJogosSemFiltro(false);
    setErroApi("");
    setErroClima("");
    setErroFilmes("");
    setPermissaoNegada(false);
    setCarregandoLocalizacao(false);
    setCarregandoLocais(false);
    setCarregandoFilmes(false);
    setCarregandoEventos(false);
    setCarregandoReceitas(false);
<<<<<<< HEAD
    setCarregandoJogos(false);
    roletaEmProcessamento.current = false;
=======
>>>>>>> 8e67322 (corrigindo antes de Aplicar a acessibilidade)
  }

  function renderAcoesDeErro(aoTentar: () => void) {
    return (
      <View style={styles.blocoDepois}>
        <Button title="Tentar novamente" onPress={aoTentar} />

        {permissaoNegada && Platform.OS !== "web" && (
          <>
            <View style={styles.espaco} />

            <Button title="Abrir configurações" onPress={abrirConfiguracoes} />
          </>
        )}

        {permissaoNegada && Platform.OS === "web" && (
          <Text
            style={[
              styles.aviso,
              styles.avisoComEspaco,
              modoEscuro && styles.textoEscuro,
            ]}
          >
            Clique no ícone de cadeado ao lado do endereço do site, permita a
            localização e depois toque em "Tentar novamente".
          </Text>
        )}
      </View>
    );
  }

  const participanteDaVez = participantes[participanteAtual];

  const telaDeResultado =
    etapa === "resultado" ||
    etapa === "resultadoModalidade" ||
    etapa === "resultadoFilmes" ||
    etapa === "resultadoJogos" ||
    etapa === "resultadoEventos" ||
    etapa === "localizacao";

  const buscandoOpcoes =
    carregandoLocalizacao || carregandoLocais || carregandoFilmes;

  const tituloBusca = buscandoOpcoes
    ? "Encontrando opções..."
    : erroApi !== "" && locais.length === 0
      ? "Não deu certo desta vez"
      : "Veja o que encontramos";

  const descricaoBusca = buscandoOpcoes
    ? "Agora a roleta vai tentar descobrir se existe alguma coisa interessante perto de vocês."
    : "Confira abaixo o resultado da busca da roleta.";

  return (
    <KeyboardAvoidingView
      style={styles.raiz}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View
        style={[
          styles.container,
          modoEscuro ? styles.containerEscuro : styles.containerClaro,
          telaDeResultado && styles.containerResultado,
        ]}
      >
        <TouchableOpacity
          style={styles.botaoTema}
          onPress={alternarTema}
          accessibilityRole="button"
          accessibilityLabel="Alternar tema claro e escuro"
        >
          <Text style={styles.iconeTema}>{modoEscuro ? "☀" : "☾"}</Text>
        </TouchableOpacity>

        {!iniciou ? (
          <View style={styles.conteudoPrincipal}>
            <Text style={[styles.titulo, modoEscuro && styles.textoEscuro]}>
              Roleta do Tédio
            </Text>

            <Text style={[styles.descricao, modoEscuro && styles.textoEscuro]}>
              Vocês se juntaram e mesmo assim não sabem o que fazer?
            </Text>

            <Text style={[styles.descricao, modoEscuro && styles.textoEscuro]}>
              Perfeito. Aparentemente pensar virou trabalho demais.
            </Text>

            <Button title="Começar" onPress={() => setIniciou(true)} />
          </View>
        ) : !salaCriada ? (
          <View style={styles.conteudoPrincipal}>
            <PerguntaAnimada
              key="situacao"
              titulo="Primeiro, vamos entender a situação"
              descricao='Quem está prestes a reclamar que "não tem nada para fazer"?'
              modoEscuro={modoEscuro}
            />

            {tipo === "" ? (
              <>
                {OPCOES_TIPO.map((opcao) => (
                  <View key={opcao.valor} style={styles.opcaoBotao}>
                    <Button
                      title={opcao.rotulo}
                      onPress={() => setTipo(opcao.valor)}
                    />
                  </View>
                ))}
              </>
            ) : (
              <View style={styles.blocoDepois}>
                <TextoDigitado
                  key={tipo}
                  texto="Qual é o seu nome?"
                  estilo={[styles.descricao, modoEscuro && styles.textoEscuro]}
                />

                <TextInput
                  style={[styles.input, modoEscuro && styles.inputEscuro]}
                  placeholder="Digite seu nome"
                  placeholderTextColor={modoEscuro ? "#aaaaaa" : "#666666"}
                  value={nomeParticipante}
                  onChangeText={setNomeParticipante}
                  maxLength={30}
                  autoCapitalize="words"
                  returnKeyType="done"
                  onSubmitEditing={criarSala}
                />

                <Button title="Criar sala" onPress={criarSala} />
              </View>
            )}
          </View>
        ) : etapa === "sala" ? (
          <View style={styles.conteudoPrincipal}>
            <Text style={[styles.titulo, modoEscuro && styles.textoEscuro]}>
              Sala criada
            </Text>

            <Text style={[styles.descricao, modoEscuro && styles.textoEscuro]}>
              Este é o código da sua sala.
            </Text>

            <Text style={[styles.codigo, modoEscuro && styles.textoEscuro]}>
              {codigoSala}
            </Text>

            <Text style={[styles.subtitulo, modoEscuro && styles.textoEscuro]}>
              Participantes
            </Text>

            <Text style={[styles.contador, modoEscuro && styles.textoEscuro]}>
              {participantes.length}
              {tipo === "sozinho" && " / 1"}
              {tipo === "casal" && " / 2"}
              {tipo === "amigos" && " / 10"}
            </Text>

            {tipo !== "sozinho" && (
              <>
                <TextInput
                  style={[styles.input, modoEscuro && styles.inputEscuro]}
                  placeholder="Nome de quem vai entrar"
                  placeholderTextColor={modoEscuro ? "#aaaaaa" : "#666666"}
                  value={nomeParticipante}
                  onChangeText={setNomeParticipante}
                  maxLength={30}
                  autoCapitalize="words"
                  returnKeyType="done"
                  onSubmitEditing={adicionarParticipante}
                />

                <Button
                  title="Adicionar participante"
                  onPress={adicionarParticipante}
                />
              </>
            )}

            <FlatList
              data={participantes}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <ParticipanteItem
                  nome={item.nome}
                  onRemover={() => removerParticipante(item.id)}
                />
              )}
              style={styles.lista}
            />

            {!podeContinuar() && (
              <Text style={[styles.aviso, modoEscuro && styles.textoEscuro]}>
                {tipo === "casal" &&
                  "Falta uma pessoa. Afinal, casal exige duas pessoas."}

                {tipo === "amigos" &&
                  participantes.length < 2 &&
                  "Adicione pelo menos mais uma pessoa para começar a confusão."}
              </Text>
            )}

            <Button
              title="Continuar"
              onPress={continuar}
              disabled={!podeContinuar()}
            />
          </View>
        ) : etapa === "humor" ? (
          <View style={styles.conteudoPrincipal}>
            <PerguntaAnimada
              key={`humor-${participanteAtual}`}
              titulo={`Agora é pessoal, ${participanteDaVez?.nome ?? ""}`}
              descricao="Como você está agora?"
              descricaoMenor="Seja sincero. A roleta precisa saber com quem está lidando."
              modoEscuro={modoEscuro}
            />

            {OPCOES_HUMOR.map((opcao) => (
              <View key={opcao.valor} style={styles.opcaoBotao}>
                <Button
                  title={opcao.rotulo}
                  onPress={() => escolherHumor(opcao.valor)}
                />
              </View>
            ))}
          </View>
        ) : etapa === "humorEscolhido" ? (
          <View style={styles.conteudoPrincipal}>
            <Text style={[styles.titulo, modoEscuro && styles.textoEscuro]}>
              Entendido...
            </Text>

            <Text style={[styles.descricao, modoEscuro && styles.textoEscuro]}>
              {participanteDaVez?.nome}, você está:
            </Text>

            <Text style={[styles.codigo, modoEscuro && styles.textoEscuro]}>
              {rotuloHumor(participanteDaVez?.humor ?? "")}
            </Text>

            <Text style={[styles.descricao, modoEscuro && styles.textoEscuro]}>
              Interessante. Agora precisamos descobrir uma coisa importante:
              quanto dói no bolso?
            </Text>

            <Button title="Descobrir" onPress={() => setEtapa("gasto")} />
          </View>
        ) : etapa === "gasto" ? (
          <View style={styles.conteudoPrincipal}>
            <PerguntaAnimada
              key={`gasto-${participanteAtual}`}
              titulo="Quanto você pretende gastar?"
              descricao="Pode ser sincero. A roleta não julga. Só usa essa informação contra o tédio."
              modoEscuro={modoEscuro}
            />

            {OPCOES_GASTO.map((opcao) => (
              <View key={opcao.valor} style={styles.opcaoBotao}>
                <Button
                  title={opcao.botao}
                  onPress={() => escolherGasto(opcao.valor)}
                />
              </View>
            ))}
          </View>
        ) : etapa === "gastoEscolhido" ? (
          <View style={styles.conteudoPrincipal}>
            <Text style={[styles.titulo, modoEscuro && styles.textoEscuro]}>
              Anotado...
            </Text>

            <Text style={[styles.descricao, modoEscuro && styles.textoEscuro]}>
              {participanteDaVez?.nome}, seu orçamento é:
            </Text>

            <Text style={[styles.codigo, modoEscuro && styles.textoEscuro]}>
              {rotuloGasto(participanteDaVez?.gasto ?? "")}
            </Text>

            <Text style={[styles.descricao, modoEscuro && styles.textoEscuro]}>
              Estamos chegando perto. Agora queremos saber se você realmente
              quer fazer alguma coisa.
            </Text>

            <Button title="Continuar" onPress={() => setEtapa("disposicao")} />
          </View>
        ) : etapa === "disposicao" ? (
          <View style={styles.conteudoPrincipal}>
            <PerguntaAnimada
              key={`disposicao-${participanteAtual}`}
              titulo="Qual é a sua disposição?"
              descricao="O quanto você está disposto a sair da posição atual do sofá?"
              modoEscuro={modoEscuro}
            />

            {OPCOES_DISPOSICAO.map((opcao) => (
              <View key={opcao.valor} style={styles.opcaoBotao}>
                <Button
                  title={opcao.rotulo}
                  onPress={() => escolherDisposicao(opcao.valor)}
                />
              </View>
            ))}
          </View>
        ) : etapa === "disposicaoEscolhida" ? (
          <View style={styles.conteudoPrincipal}>
            <Text style={[styles.titulo, modoEscuro && styles.textoEscuro]}>
              Última pergunta...
            </Text>

            <Text style={[styles.descricao, modoEscuro && styles.textoEscuro]}>
              {participanteDaVez?.nome}, sua disposição é:
            </Text>

            <Text style={[styles.codigo, modoEscuro && styles.textoEscuro]}>
              {rotuloDisposicao(participanteDaVez?.disposicao ?? "")}
            </Text>

            <Text style={[styles.descricao, modoEscuro && styles.textoEscuro]}>
              Só falta descobrir quanto tempo vocês realmente têm.
            </Text>

            <Button
              title="Descobrir meu tempo"
              onPress={() => setEtapa("tempo")}
            />
          </View>
        ) : etapa === "tempo" ? (
          <View style={styles.conteudoPrincipal}>
            <PerguntaAnimada
              key={`tempo-${participanteAtual}`}
              titulo="Quanto tempo você tem?"
              descricao="Escolha o tempo que você realmente tem disponível. Não vale colocar 3 horas se você precisa sair em 20 minutos."
              modoEscuro={modoEscuro}
            />

            {OPCOES_TEMPO.map((opcao) => (
              <View key={opcao.valor} style={styles.opcaoBotao}>
                <Button
                  title={opcao.valor}
                  onPress={() => escolherTempo(opcao.valor)}
                />
              </View>
            ))}
          </View>
        ) : etapa === "tempoEscolhido" ? (
          <View style={styles.conteudoPrincipal}>
            <Text style={[styles.titulo, modoEscuro && styles.textoEscuro]}>
              Perfeito...
            </Text>

            <Text style={[styles.descricao, modoEscuro && styles.textoEscuro]}>
              {participanteDaVez?.nome} tem {participanteDaVez?.tempo}{" "}
              disponíveis.
            </Text>

            <Text style={[styles.descricao, modoEscuro && styles.textoEscuro]}>
              {participanteAtual < participantes.length - 1
                ? "Agora é a vez da próxima vítima."
                : "Todos responderam. A roleta já tem informações suficientes para tomar uma decisão questionável."}
            </Text>

            <Button
              title={
                participanteAtual < participantes.length - 1
                  ? "Próximo participante"
                  : "Ver respostas"
              }
              onPress={proximoParticipante}
            />
          </View>
        ) : etapa === "resumo" ? (
          <View style={styles.conteudoPrincipal}>
            <Text style={[styles.titulo, modoEscuro && styles.textoEscuro]}>
              Então é isso...
            </Text>

            <Text style={[styles.descricao, modoEscuro && styles.textoEscuro]}>
              A roleta já sabe demais sobre vocês.
            </Text>

            <FlatList
              data={participantes}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View
                  style={[styles.resposta, modoEscuro && styles.respostaEscuro]}
                >
                  <Text
                    style={[
                      styles.nomeResposta,
                      modoEscuro && styles.textoEscuro,
                    ]}
                  >
                    {item.nome}
                  </Text>

                  <Text
                    style={[
                      styles.textoResposta,
                      modoEscuro && styles.textoEscuro,
                    ]}
                  >
                    Humor: {rotuloHumor(item.humor)}
                  </Text>

                  <Text
                    style={[
                      styles.textoResposta,
                      modoEscuro && styles.textoEscuro,
                    ]}
                  >
                    Gasto: {rotuloGasto(item.gasto)}
                  </Text>

                  <Text
                    style={[
                      styles.textoResposta,
                      modoEscuro && styles.textoEscuro,
                    ]}
                  >
                    Disposição: {rotuloDisposicao(item.disposicao)}
                  </Text>

                  <Text
                    style={[
                      styles.textoResposta,
                      modoEscuro && styles.textoEscuro,
                    ]}
                  >
                    Tempo: {item.tempo}
                  </Text>
                </View>
              )}
              style={styles.lista}
            />

            <Text style={[styles.descricao, modoEscuro && styles.textoEscuro]}>
              Tudo registrado. Agora vocês não podem mais dizer que a roleta não
              conhece vocês.
            </Text>

            <Button title="Girar a roleta" onPress={escolherAtividade} />
          </View>
        ) : telaDeResultado ? (
          <ScrollView
            style={styles.resultadoScroll}
            contentContainerStyle={styles.resultadoScrollFundo}
            showsVerticalScrollIndicator
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
          >
            <View style={styles.resultadoScrollConteudo}>
              {etapa === "resultado" ? (
                <View style={styles.blocoResultado}>
                  <Text
                    style={[styles.titulo, modoEscuro && styles.textoEscuro]}
                  >
                    A Roleta decidiu.
                  </Text>

                  <Text
                    style={[styles.descricao, modoEscuro && styles.textoEscuro]}
                  >
                    Depois de analisar todas as informações, ela chegou a uma
                    conclusão.
                  </Text>

                  <View
                    style={[
                      styles.resultadoCard,
                      modoEscuro && styles.resultadoCardEscuro,
                    ]}
                  >
                    <Text
                      style={[
                        styles.resultadoTitulo,
                        modoEscuro && styles.textoEscuro,
                      ]}
                    >
                      {atividadeEscolhida?.nome}
                    </Text>

                    <Text
                      style={[
                        styles.resultadoDescricao,
                        modoEscuro && styles.textoEscuro,
                      ]}
                    >
                      {atividadeEscolhida?.descricao}
                    </Text>
                  </View>

                  {atividadeSemFiltro && (
                    <Text
                      style={[styles.aviso, modoEscuro && styles.textoEscuro]}
                    >
                      Nada combinou perfeitamente com as respostas de vocês,
                      então a roleta improvisou.
                    </Text>
                  )}

                  <Text
                    style={[styles.pergunta, modoEscuro && styles.textoEscuro]}
                  >
                    Tempo disponível:
                  </Text>

                  <Text
                    style={[styles.subtitulo, modoEscuro && styles.textoEscuro]}
                  >
                    {menorTempoDisponivel()} minutos
                  </Text>

                  <Button
                    title={
                      ROTULO_BOTAO_RESULTADO[atividadeEscolhida?.id ?? ""] ??
                      "Encontrar opções próximas"
                    }
                    onPress={continuarParaLocalizacao}
                  />

                  <View style={styles.espacoGrande} />

                  <Button title="Girar novamente" onPress={escolherAtividade} />
                </View>
              ) : etapa === "resultadoModalidade" ? (
                <View style={styles.blocoResultado}>
                  <Text
                    style={[styles.titulo, modoEscuro && styles.textoEscuro]}
                  >
                    A Roleta pensou um pouco mais...
                  </Text>

                  <Text
                    style={[styles.descricao, modoEscuro && styles.textoEscuro]}
                  >
                    A atividade escolhida foi:
                  </Text>

                  <View
                    style={[
                      styles.resultadoCard,
                      modoEscuro && styles.resultadoCardEscuro,
                    ]}
                  >
                    <Text
                      style={[
                        styles.resultadoTitulo,
                        modoEscuro && styles.textoEscuro,
                      ]}
                    >
                      ☕ {atividadeEscolhida?.nome}
                    </Text>

                    <Text
                      style={[
                        styles.resultadoDescricao,
                        modoEscuro && styles.textoEscuro,
                      ]}
                    >
                      {modalidadeEscolhida?.nome}
                    </Text>

                    <Text
                      style={[
                        styles.textoCard,
                        modoEscuro && styles.textoEscuro,
                      ]}
                    >
                      {modalidadeEscolhida?.descricao}
                    </Text>
                  </View>

                  <Text
                    style={[styles.descricao, modoEscuro && styles.textoEscuro]}
                  >
                    Pelo tempo, disposição, dinheiro e clima de vocês, parece
                    que essa é a opção que faz mais sentido agora.
                  </Text>

                  {carregandoReceitas ? (
                    <View style={styles.carregando}>
                      <ActivityIndicator />

                      <Text style={modoEscuro && styles.textoEscuro}>
                        Procurando ideias para o café...
                      </Text>
                    </View>
                  ) : (
                    <ResultadoReceitas
                      receitas={receitas}
                      titulo="Ideias para preparar"
                      subtitulo="Algumas receitas para transformar o café em um pequeno evento."
                    />
                  )}

                  {erroApi !== "" && (
                    <Text
                      style={[styles.erro, modoEscuro && styles.textoEscuro]}
                    >
                      {erroApi}
                    </Text>
                  )}

                  {erroApi !== "" &&
                    !carregandoReceitas &&
                    renderAcoesDeErro(buscarReceitasResultado)}

                  <View style={styles.espacoGrande} />

                  <Button title="Começar novamente" onPress={reiniciar} />
                </View>
              ) : etapa === "resultadoFilmes" ? (
                <View style={styles.blocoResultado}>
                  {carregandoFilmes ? (
                    <View style={styles.carregando}>
                      <ActivityIndicator size="large" />

                      <Text style={modoEscuro && styles.textoEscuro}>
                        Procurando filmes...
                      </Text>
                    </View>
                  ) : (
                    <ResultadoFilmes
                      filmes={filmes}
                      titulo="Escolha um filme"
                      subtitulo="A decisão já foi tomada. Agora só falta escolher o filme."
                      mostrarCategorias
                    />
                  )}

                  {erroFilmes !== "" && (
                    <Text
                      style={[styles.erro, modoEscuro && styles.textoEscuro]}
                    >
                      {erroFilmes}
                    </Text>
                  )}

                  {erroFilmes !== "" &&
                    !carregandoFilmes &&
                    renderAcoesDeErro(buscarFilmesResultado)}

                  <View style={styles.espacoGrande} />

                  <Button title="Começar novamente" onPress={reiniciar} />
                </View>
              ) : etapa === "resultadoJogos" ? (
                <View style={styles.blocoResultado}>
                  <ResultadoJogos
                    jogos={jogosFiltrados}
                    titulo="Hora de jogar"
                    subtitulo="Filtramos as opções de acordo com o número de pessoas, tempo, dinheiro e disposição."
                  />

                  {jogosSemFiltro && (
                    <Text
                      style={[styles.aviso, modoEscuro && styles.textoEscuro]}
                    >
                      Nenhum jogo combinou com tudo, então estas são as opções
                      mais próximas.
                    </Text>
                  )}

                  <View style={styles.espacoGrande} />

                  <Button title="Começar novamente" onPress={reiniciar} />
                </View>
              ) : etapa === "resultadoEventos" ? (
                <View style={styles.blocoResultado}>
                  {carregandoEventos ? (
                    <View style={styles.carregando}>
                      <ActivityIndicator size="large" />

                      <Text style={modoEscuro && styles.textoEscuro}>
                        Procurando eventos...
                      </Text>
                    </View>
                  ) : (
                    <ResultadoEventos
                      eventos={eventos}
                      titulo="O que está acontecendo por aí?"
                      subtitulo="Encontramos alguns eventos que podem combinar com o momento."
                    />
                  )}

                  {erroApi !== "" && (
                    <Text
                      style={[styles.erro, modoEscuro && styles.textoEscuro]}
                    >
                      {erroApi}
                    </Text>
                  )}

                  {erroApi !== "" &&
                    !carregandoEventos &&
                    renderAcoesDeErro(buscarLocalizacao)}

                  <View style={styles.espacoGrande} />

                  <Button title="Começar novamente" onPress={reiniciar} />
                </View>
              ) : (
                <View style={styles.blocoResultado}>
                  <Text
                    style={[styles.titulo, modoEscuro && styles.textoEscuro]}
                  >
                    {tituloBusca}
                  </Text>

                  <Text
                    style={[styles.descricao, modoEscuro && styles.textoEscuro]}
                  >
                    {descricaoBusca}
                  </Text>

                  {atividadeEscolhida && (
                    <View
                      style={[styles.card, modoEscuro && styles.cardEscuro]}
                    >
                      <Text
                        style={[
                          styles.cardTitulo,
                          modoEscuro && styles.textoEscuro,
                        ]}
                      >
                        Atividade escolhida
                      </Text>

                      <Text
                        style={[
                          styles.textoCard,
                          modoEscuro && styles.textoEscuro,
                        ]}
                      >
                        {atividadeEscolhida.nome}
                      </Text>

                      {modalidadeEscolhida && (
                        <>
                          <Text
                            style={[
                              styles.cardTitulo,
                              modoEscuro && styles.textoEscuro,
                            ]}
                          >
                            Forma escolhida
                          </Text>

                          <Text
                            style={[
                              styles.textoCard,
                              modoEscuro && styles.textoEscuro,
                            ]}
                          >
                            {modalidadeEscolhida.nome}
                          </Text>
                        </>
                      )}
                    </View>
                  )}

                  {carregandoLocalizacao && (
                    <View style={styles.carregando}>
                      <ActivityIndicator size="large" />

                      <Text style={modoEscuro && styles.textoEscuro}>
                        Descobrindo onde vocês estão...
                      </Text>
                    </View>
                  )}

                  {latitude !== null && longitude !== null && (
                    <View
                      style={[styles.card, modoEscuro && styles.cardEscuro]}
                    >
                      <Text
                        style={[
                          styles.cardTitulo,
                          modoEscuro && styles.textoEscuro,
                        ]}
                      >
                        Localização encontrada
                      </Text>

                      <Text
                        style={[
                          styles.textoCard,
                          modoEscuro && styles.textoEscuro,
                        ]}
                      >
                        Latitude: {latitude.toFixed(6)}
                      </Text>

                      <Text
                        style={[
                          styles.textoCard,
                          modoEscuro && styles.textoEscuro,
                        ]}
                      >
                        Longitude: {longitude.toFixed(6)}
                      </Text>

                      {precisao !== null && (
                        <Text
                          style={[
                            styles.textoCard,
                            modoEscuro && styles.textoEscuro,
                          ]}
                        >
                          Precisão aproximada: {Math.round(precisao)} metros
                        </Text>
                      )}
                    </View>
                  )}

                  {clima && (
                    <View
                      style={[styles.card, modoEscuro && styles.cardEscuro]}
                    >
                      <Text
                        style={[
                          styles.cardTitulo,
                          modoEscuro && styles.textoEscuro,
                        ]}
                      >
                        Clima atual
                      </Text>

                      <Text
                        style={[
                          styles.textoCard,
                          modoEscuro && styles.textoEscuro,
                        ]}
                      >
                        Temperatura: {clima.temperatura} °C
                      </Text>

                      <Text
                        style={[
                          styles.textoCard,
                          modoEscuro && styles.textoEscuro,
                        ]}
                      >
                        Precipitação: {clima.chuva} mm
                      </Text>

                      {!climaPermiteAtividade() && (
                        <Text
                          style={[
                            styles.aviso,
                            modoEscuro && styles.textoEscuro,
                          ]}
                        >
                          O clima não parece muito interessado nessa atividade.
                        </Text>
                      )}
                    </View>
                  )}

                  {erroClima !== "" && (
                    <Text
                      style={[styles.erro, modoEscuro && styles.textoEscuro]}
                    >
                      {erroClima}
                    </Text>
                  )}

                  {erroApi !== "" && (
                    <Text
                      style={[styles.erro, modoEscuro && styles.textoEscuro]}
                    >
                      {erroApi}
                    </Text>
                  )}

                  {erroApi !== "" &&
                    !buscandoOpcoes &&
                    renderAcoesDeErro(buscarLocalizacao)}

                  {carregandoLocais && (
                    <View style={styles.carregando}>
                      <ActivityIndicator />

                      <Text style={modoEscuro && styles.textoEscuro}>
                        Procurando opções próximas...
                      </Text>
                    </View>
                  )}

                  {locais.length > 0 && (
                    <ResultadoLocais
                      titulo={
                        TITULO_LOCAIS[atividadeEscolhida?.id ?? ""] ??
                        "Opções próximas"
                      }
                      locais={locais}
                      latitude={latitude ?? 0}
                      longitude={longitude ?? 0}
                      mostrarMapa
                    />
                  )}

                  {atividadeEscolhida?.id === "cinema" && (
                    <View style={styles.blocoResultado}>
                      {carregandoFilmes ? (
                        <View style={styles.carregando}>
                          <ActivityIndicator />

                          <Text style={modoEscuro && styles.textoEscuro}>
                            Procurando filmes...
                          </Text>
                        </View>
                      ) : (
                        <ResultadoFilmes
                          filmes={filmes}
                          titulo="Filmes para assistir no cinema"
                          subtitulo="Depois de encontrar os cinemas, veja também algumas sugestões de filmes."
                          mostrarCategorias
                        />
                      )}

                      {erroFilmes !== "" && (
                        <Text
                          style={[
                            styles.erro,
                            modoEscuro && styles.textoEscuro,
                          ]}
                        >
                          {erroFilmes}
                        </Text>
                      )}
                    </View>
                  )}

                  <View style={styles.espacoGrande} />

                  <Button title="Começar novamente" onPress={reiniciar} />
                </View>
              )}
            </View>
          </ScrollView>
        ) : null}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  raiz: {
    flex: 1,
  },

  container: {
    flex: 1,
    justifyContent: "center",
    width: "100%",
    alignSelf: "center",
  },

  containerResultado: {
    justifyContent: "flex-start",
  },

  containerClaro: {
    backgroundColor: "#ffffff",
  },

  containerEscuro: {
    backgroundColor: "#121212",
  },

  conteudoPrincipal: {
    width: "100%",
    maxWidth: 700,
    alignSelf: "center",
    paddingHorizontal: 16,
  },

  resultadoScroll: {
    flex: 1,
    width: "100%",
  },

  resultadoScrollFundo: {
    width: "100%",
    alignItems: "center",
    paddingTop: 10,
    paddingHorizontal: 16,
    paddingBottom: 100,
  },

  resultadoScrollConteudo: {
    width: "100%",
    maxWidth: 1000,
    alignSelf: "center",
    minWidth: 0,
  },

  titulo: {
    width: "100%",
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 15,
    lineHeight: 34,
  },

  descricao: {
    width: "100%",
    fontSize: 18,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 25,
    flexShrink: 1,
  },

  descricaoMenor: {
    width: "100%",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 22,
    flexShrink: 1,
  },

  subtitulo: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 5,
  },

  contador: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 15,
  },

  pergunta: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },

  textoEscuro: {
    color: "#ffffff",
  },

  textoInvisivel: {
    color: "transparent",
  },

  textoCard: {
    width: "100%",
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 5,
    flexShrink: 1,
  },

  espaco: {
    height: 10,
  },

  espacoGrande: {
    marginTop: 20,
  },

  opcaoBotao: {
    marginBottom: 10,
  },

  blocoDepois: {
    marginTop: 25,
    width: "100%",
  },

  blocoResultado: {
    width: "100%",
    minWidth: 0,
  },

  codigo: {
    fontSize: 42,
    fontWeight: "bold",
    textAlign: "center",
    letterSpacing: 8,
    marginVertical: 20,
  },

  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#999999",
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 18,
  },

  inputEscuro: {
    color: "#ffffff",
    borderColor: "#666666",
  },

  lista: {
    maxHeight: 200,
    marginTop: 15,
    marginBottom: 15,
  },

  aviso: {
    width: "100%",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 10,
    lineHeight: 22,
    flexShrink: 1,
  },

  avisoComEspaco: {
    marginTop: 15,
  },

  resposta: {
    borderWidth: 1,
    borderColor: "#999999",
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },

  respostaEscuro: {
    borderColor: "#666666",
  },

  nomeResposta: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 7,
  },

  textoResposta: {
    fontSize: 16,
    marginBottom: 4,
    flexShrink: 1,
  },

  botaoTema: {
    position: "absolute",
    bottom: 25,
    right: 25,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#eeeeee",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },

  iconeTema: {
    fontSize: 26,
  },

  carregando: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 20,
    gap: 10,
  },

  card: {
    width: "100%",
    minWidth: 0,
    borderWidth: 1,
    borderColor: "#999999",
    borderRadius: 10,
    padding: 15,
    marginTop: 15,
  },

  cardEscuro: {
    borderColor: "#666666",
  },

  cardTitulo: {
    width: "100%",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    flexShrink: 1,
  },

  erro: {
    width: "100%",
    marginTop: 15,
    fontWeight: "bold",
    textAlign: "center",
    lineHeight: 22,
    flexShrink: 1,
  },

  resultadoCard: {
    width: "100%",
    minWidth: 0,
    borderWidth: 2,
    borderColor: "#333333",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },

  resultadoCardEscuro: {
    borderColor: "#ffffff",
  },

  resultadoTitulo: {
    width: "100%",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
    lineHeight: 30,
    flexShrink: 1,
  },

  resultadoDescricao: {
    width: "100%",
    fontSize: 16,
    lineHeight: 22,
    textAlign: "center",
    flexShrink: 1,
  },
});

import * as Location from "expo-location";
import { useState } from "react";
import {
  ActivityIndicator,
  Button,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
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

import { buscarLocais, Local } from "../services/overpass";

import {
  buscarClima as buscarClimaService,
  Clima,
} from "../services/openMeteo";

import { buscarReceitas, Receita } from "../services/receitas";

import { buscarFilmes, Filme } from "../services/filmes";

import { buscarEventos, Evento } from "../services/eventos";

type Participante = {
  nome: string;
  humor: string;
  gasto: string;
  disposicao: string;
  tempo: string;
};

export default function Index() {
  const [iniciou, setIniciou] = useState(false);
  const [tipo, setTipo] = useState("");
  const [salaCriada, setSalaCriada] = useState(false);
  const [codigoSala, setCodigoSala] = useState("");

  const [etapa, setEtapa] = useState("tipo");

  const [modoEscuro, setModoEscuro] = useState(false);

  const [nomeParticipante, setNomeParticipante] = useState("");

  const [participantes, setParticipantes] = useState<Participante[]>([]);

  const [participanteAtual, setParticipanteAtual] = useState(0);

  const [atividadeEscolhida, setAtividadeEscolhida] =
    useState<Atividade | null>(null);

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

  const [carregandoLocalizacao, setCarregandoLocalizacao] = useState(false);

  const [carregandoLocais, setCarregandoLocais] = useState(false);

  const [carregandoFilmes, setCarregandoFilmes] = useState(false);

  const [carregandoEventos, setCarregandoEventos] = useState(false);

  const [carregandoReceitas, setCarregandoReceitas] = useState(false);

  const [carregandoJogos, setCarregandoJogos] = useState(false);

  const [carregandoRoleta, setCarregandoRoleta] = useState(false);

  const [erroApi, setErroApi] = useState("");

  function comecar() {
    setIniciou(true);
  }

  function escolherTipo(valor: string) {
    setTipo(valor);
  }

  function criarSala() {
    if (nomeParticipante.trim() === "") {
      alert("A roleta ainda não sabe quem é você. Digite seu nome primeiro!");
      return;
    }

    if (tipo === "") {
      alert("Calma aí. Primeiro precisamos saber quem está participando.");
      return;
    }

    const codigo = Math.random().toString(36).substring(2, 6).toUpperCase();

    const participante: Participante = {
      nome: nomeParticipante.trim(),
      humor: "",
      gasto: "",
      disposicao: "",
      tempo: "",
    };

    setCodigoSala(codigo);
    setParticipantes([participante]);
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
        alert(
          "Para o modo casal, precisamos de duas pessoas. Nem a roleta consegue namorar sozinha.",
        );
        return;
      }

      if (tipo === "amigos") {
        alert(
          "Adicione pelo menos mais uma pessoa. Tédio em grupo é mais divertido.",
        );
        return;
      }

      return;
    }

    setParticipanteAtual(0);
    setEtapa("humor");
  }

  function escolherHumor(valor: string) {
    setParticipantes(
      participantes.map((participante, index) =>
        index === participanteAtual
          ? {
              ...participante,
              humor: valor,
            }
          : participante,
      ),
    );

    setEtapa("humorEscolhido");
  }

  function escolherGasto(valor: string) {
    setParticipantes(
      participantes.map((participante, index) =>
        index === participanteAtual
          ? {
              ...participante,
              gasto: valor,
            }
          : participante,
      ),
    );

    setEtapa("gastoEscolhido");
  }

  function escolherDisposicao(valor: string) {
    setParticipantes(
      participantes.map((participante, index) =>
        index === participanteAtual
          ? {
              ...participante,
              disposicao: valor,
            }
          : participante,
      ),
    );

    setEtapa("disposicaoEscolhida");
  }

  function escolherTempo(valor: string) {
    setParticipantes(
      participantes.map((participante, index) =>
        index === participanteAtual
          ? {
              ...participante,
              tempo: valor,
            }
          : participante,
      ),
    );

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
      alert("Digite o nome de quem vai entrar na brincadeira.");
      return;
    }

    if (
      participantes.some(
        (participante) =>
          participante.nome.toLowerCase() === nome.toLowerCase(),
      )
    ) {
      alert("Esse participante já está na sala. A roleta percebeu.");
      return;
    }

    if (tipo === "sozinho") {
      alert("No modo sozinho, a companhia oficial é você mesmo.");
      return;
    }

    if (tipo === "casal" && participantes.length >= 2) {
      alert(
        "O modo casal já está completo. Não cabe mais um no relacionamento.",
      );
      return;
    }

    if (tipo === "amigos" && participantes.length >= 10) {
      alert(
        "A sala chegou ao limite de 10 pessoas. Já está parecendo reunião.",
      );
      return;
    }

    const participante: Participante = {
      nome,
      humor: "",
      gasto: "",
      disposicao: "",
      tempo: "",
    };

    setParticipantes([...participantes, participante]);

    setNomeParticipante("");
  }

  function removerParticipante(nome: string) {
    if (tipo === "sozinho") {
      alert("Você não pode remover o único participante. Aí vira nada.");
      return;
    }

    setParticipantes(
      participantes.filter((participante) => participante.nome !== nome),
    );
  }

  function alternarTema() {
    setModoEscuro(!modoEscuro);
  }

  function converterGasto(gasto: string): Gasto | "" {
    if (gasto === "R$ 0") {
      return "nada";
    }

    if (gasto === "até 30") {
      return "pouco";
    }

    if (gasto === "até 60") {
      return "medio";
    }

    if (gasto === "até 100") {
      return "livre";
    }

    if (gasto === "sem limite") {
      return "livre";
    }

    return "";
  }

  function converterTempo(tempo: string) {
    if (tempo === "30 minutos") {
      return 30;
    }

    if (tempo === "40 minutos") {
      return 40;
    }

    if (tempo === "1 hora") {
      return 60;
    }

    if (tempo === "2 horas") {
      return 120;
    }

    if (tempo === "3 horas ou mais") {
      return 180;
    }

    return 0;
  }

  function menorTempoDisponivel() {
    let menor = 999;

    participantes.forEach((participante) => {
      const tempo = converterTempo(participante.tempo);

      if (tempo < menor) {
        menor = tempo;
      }
    });

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

    participantes.forEach((participante) => {
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
    });

    return pontos;
  }

  function escolherAtividade() {
    if (carregandoRoleta) {
      return;
    }

    setCarregandoRoleta(true);
    setErroApi("");
    setModalidadeEscolhida(null);

    const atividadesValidas = atividades.filter((atividade) =>
      atividadePodeSerEscolhida(atividade),
    );

    if (atividadesValidas.length === 0) {
      const atividadeAlternativa =
        atividades[Math.floor(Math.random() * atividades.length)];

      setAtividadeEscolhida(atividadeAlternativa);

      setCarregandoRoleta(false);
      setEtapa("resultado");
      return;
    }

    let maiorPontuacao = -1;

    let melhores: Atividade[] = [];

    atividadesValidas.forEach((atividade) => {
      const pontuacao = calcularPontuacao(atividade);

      if (pontuacao > maiorPontuacao) {
        maiorPontuacao = pontuacao;

        melhores = [atividade];
      } else if (pontuacao === maiorPontuacao) {
        melhores.push(atividade);
      }
    });

    const escolhida = melhores[Math.floor(Math.random() * melhores.length)];

    setAtividadeEscolhida(escolhida);

    setCarregandoRoleta(false);
    setEtapa("resultado");
  }

  function calcularModalidadeCafe() {
    if (!atividadeEscolhida?.modalidades) {
      return null;
    }

    const modalidades = atividadeEscolhida.modalidades;

    const tempo = menorTempoDisponivel();

    let melhorModalidade: Modalidade | null = null;

    let maiorPontuacao = -1;

    modalidades.forEach((modalidade) => {
      let pontos = 0;

      if (tempo >= modalidade.tempoMinimo && tempo <= modalidade.tempoMaximo) {
        pontos += 4;
      } else if (tempo >= modalidade.tempoMinimo) {
        pontos += 1;
      } else {
        return;
      }

      participantes.forEach((participante) => {
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
      });

      if (pontos > maiorPontuacao) {
        maiorPontuacao = pontos;

        melhorModalidade = modalidade;
      }
    });

    return melhorModalidade;
  }

  async function calcularModalidadeCafeComClima(lat: number, lon: number) {
    try {
      const climaAtual = await buscarClimaService(lat, lon);

      setClima(climaAtual);

      const modalidades = atividadeEscolhida?.modalidades ?? [];

      let melhor: Modalidade | null = null;

      let maiorPontuacao = -1;

      const tempo = menorTempoDisponivel();

      modalidades.forEach((modalidade) => {
        let pontos = 0;

        if (tempo < modalidade.tempoMinimo) {
          return;
        }

        if (
          tempo >= modalidade.tempoMinimo &&
          tempo <= modalidade.tempoMaximo
        ) {
          pontos += 4;
        } else {
          pontos += 1;
        }

        participantes.forEach((participante) => {
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
        });

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
      });

      return melhor;
    } catch (erro) {
      return calcularModalidadeCafe();
    }
  }

  async function buscarClima(lat: number, lon: number) {
    try {
      const climaAtual = await buscarClimaService(lat, lon);

      setClima(climaAtual);

      return climaAtual;
    } catch (erro) {
      setErroApi("Não foi possível consultar o clima.");

      return null;
    }
  }

  function obterTipoLocal() {
    if (!atividadeEscolhida) {
      return null;
    }

    if (atividadeEscolhida.id === "restaurante") {
      return "restaurante" as const;
    }

    if (atividadeEscolhida.id === "cafe") {
      if (modalidadeEscolhida?.id !== "cafe-fora") {
        return null;
      }

      return "cafe" as const;
    }

    if (atividadeEscolhida.id === "cinema") {
      return "cinema" as const;
    }

    if (atividadeEscolhida.id === "parque") {
      return "parque" as const;
    }

    if (atividadeEscolhida.id === "passeio") {
      return "passeio" as const;
    }

    return null;
  }

  function precisaDeLocalizacao() {
    if (!atividadeEscolhida) {
      return false;
    }

    if (atividadeEscolhida.id === "restaurante") {
      return true;
    }

    if (atividadeEscolhida.id === "cafe") {
      return true;
    }

    if (atividadeEscolhida.id === "cinema") {
      return true;
    }

    if (atividadeEscolhida.id === "parque") {
      return true;
    }

    if (atividadeEscolhida.id === "passeio") {
      return true;
    }

    if (atividadeEscolhida.id === "evento") {
      return true;
    }

    return false;
  }

  async function buscarLocaisProximos(lat: number, lon: number) {
    const tipoLocal = obterTipoLocal();

    if (!tipoLocal) {
      setLocais([]);
      return;
    }

    try {
      setCarregandoLocais(true);

      setErroApi("");

      const resultados = await buscarLocais(lat, lon, tipoLocal);

      setLocais(resultados);

      if (resultados.length === 0) {
        setErroApi(
          "Nenhuma opção foi encontrada próxima da localização informada.",
        );
      }
    } catch (erro) {
      setErroApi("Não foi possível buscar opções próximas.");
    } finally {
      setCarregandoLocais(false);
    }
  }

  async function buscarFilmesResultado() {
    try {
      setCarregandoFilmes(true);

      setErroApi("");

      const resultados = await buscarFilmes(8);

      setFilmes(resultados);

      if (resultados.length === 0) {
        setErroApi("Não encontramos filmes disponíveis para mostrar.");
      }
    } catch (erro) {
      setErroApi("Não foi possível consultar os filmes.");
    } finally {
      setCarregandoFilmes(false);
    }
  }

  async function buscarReceitasResultado() {
    try {
      setCarregandoReceitas(true);

      setErroApi("");

      const resultados = await buscarReceitas(6);

      setReceitas(resultados);

      if (resultados.length === 0) {
        setErroApi("Não encontramos receitas disponíveis.");
      }
    } catch (erro) {
      setErroApi("Não foi possível consultar as receitas.");
    } finally {
      setCarregandoReceitas(false);
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

  function ordenarJogos(lista: Jogo[]) {
    return [...lista].sort((a, b) => {
      let pontosA = 0;
      let pontosB = 0;

      const tempo = menorTempoDisponivel();

      if (a.tempo <= tempo) {
        pontosA += 2;
      }

      if (b.tempo <= tempo) {
        pontosB += 2;
      }

      participantes.forEach((participante) => {
        if (participante.disposicao === "baixa" && a.dificuldade === "Fácil") {
          pontosA += 2;
        }

        if (participante.disposicao === "baixa" && b.dificuldade === "Fácil") {
          pontosB += 2;
        }

        if (participante.disposicao === "alta" && a.dificuldade === "Difícil") {
          pontosA += 2;
        }

        if (participante.disposicao === "alta" && b.dificuldade === "Difícil") {
          pontosB += 2;
        }
      });

      return pontosB - pontosA;
    });
  }

  function prepararJogos() {
    setCarregandoJogos(true);

    const filtrados = jogos.filter(jogoCombinaComParticipantes);

    const ordenados = ordenarJogos(filtrados.length > 0 ? filtrados : jogos);

    setJogosFiltrados(ordenados.slice(0, 8));

    setCarregandoJogos(false);
  }

  async function obterCidadeAtual(lat: number, lon: number) {
    try {
      const enderecos = await Location.reverseGeocodeAsync({
        latitude: lat,
        longitude: lon,
      });

      if (enderecos.length > 0) {
        return enderecos[0].city ?? enderecos[0].district ?? "Saquarema";
      }
    } catch (erro) {
      return "Saquarema";
    }

    return "Saquarema";
  }

  async function buscarEventosResultado(lat: number, lon: number) {
    try {
      setCarregandoEventos(true);

      setErroApi("");

      const cidade = await obterCidadeAtual(lat, lon);

      const resultados = await buscarEventos(cidade, 10);

      setEventos(resultados);

      if (resultados.length === 0) {
        setErroApi(`Não encontramos eventos cadastrados para ${cidade}.`);
      }
    } catch (erro) {
      setErroApi("Não foi possível consultar eventos próximos.");
    } finally {
      setCarregandoEventos(false);
    }
  }

  async function continuarDepoisResultado() {
    if (!atividadeEscolhida) {
      return;
    }

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

    if (atividadeEscolhida.id === "evento") {
      setEventos([]);

      setEtapa("localizacao");

      await buscarLocalizacao();

      return;
    }

    if (precisaDeLocalizacao()) {
      setEtapa("localizacao");

      await buscarLocalizacao();

      return;
    }

    setEtapa("resultado");
  }

  async function buscarLocalizacao() {
    try {
      setCarregandoLocalizacao(true);

      setErroApi("");

      const permissao = await Location.requestForegroundPermissionsAsync();

      if (permissao.status !== "granted") {
        setErroApi(
          "Permissão de localização não concedida. Autorize a localização para encontrar opções próximas.",
        );
        return;
      }

      const localizacao = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const lat = localizacao.coords.latitude;

      const lon = localizacao.coords.longitude;

      const precisaoObtida = localizacao.coords.accuracy;

      setLatitude(lat);
      setLongitude(lon);

      setPrecisao(precisaoObtida ?? null);

      if (atividadeEscolhida?.id === "cafe") {
        const climaAtual = await buscarClima(lat, lon);

        const modalidade = climaAtual
          ? await calcularModalidadeCafeComClima(lat, lon)
          : calcularModalidadeCafe();

        setModalidadeEscolhida(modalidade);

        if (modalidade?.id === "cafe-casa") {
          setLocais([]);
          setReceitas([]);

          setEtapa("resultadoModalidade");

          await buscarReceitasResultado();

          return;
        }

        if (modalidade?.id === "cafe-fora") {
          await buscarLocaisProximos(lat, lon);

          return;
        }
      }

      if (atividadeEscolhida?.id === "evento") {
        setLocais([]);
        setEventos([]);

        await buscarEventosResultado(lat, lon);

        setEtapa("resultadoEventos");

        return;
      }

      if (atividadeEscolhida?.id === "cinema") {
        setLocais([]);
        setFilmes([]);

        await buscarLocaisProximos(lat, lon);

        await buscarFilmesResultado();

        return;
      }

      await buscarLocaisProximos(lat, lon);
    } catch (erro) {
      setErroApi(
        "Não foi possível obter sua localização. Verifique se o GPS está disponível e tente novamente.",
      );
    } finally {
      setCarregandoLocalizacao(false);
    }
  }

  function continuarParaLocalizacao() {
    setLocais([]);
    setClima(null);
    setFilmes([]);
    setEventos([]);
    setReceitas([]);
    setJogosFiltrados([]);
    setErroApi("");
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

  function reiniciar() {
    setIniciou(false);
    setTipo("");
    setSalaCriada(false);
    setCodigoSala("");
    setEtapa("tipo");
    setNomeParticipante("");
    setParticipantes([]);
    setParticipanteAtual(0);
    setAtividadeEscolhida(null);
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
    setErroApi("");
    setCarregandoRoleta(false);
    setCarregandoLocalizacao(false);
    setCarregandoLocais(false);
    setCarregandoFilmes(false);
    setCarregandoEventos(false);
    setCarregandoReceitas(false);
    setCarregandoJogos(false);
  }

  const participante = participantes[participanteAtual];

  return (
    <View
      style={[
        styles.container,
        modoEscuro ? styles.containerEscuro : styles.containerClaro,
      ]}
    >
      <TouchableOpacity style={styles.botaoTema} onPress={alternarTema}>
        <Text style={styles.iconeTema}>{modoEscuro ? "☀" : "☾"}</Text>
      </TouchableOpacity>

      {!iniciou ? (
        <View>
          <Text style={[styles.titulo, modoEscuro && styles.textoEscuro]}>
            Roleta do Tédio
          </Text>

          <Text style={[styles.descricao, modoEscuro && styles.textoEscuro]}>
            Vocês se juntaram e mesmo assim não sabem o que fazer?
          </Text>

          <Text style={[styles.descricao, modoEscuro && styles.textoEscuro]}>
            Perfeito. Aparentemente pensar virou trabalho demais.
          </Text>

          <Button title="Começar" onPress={comecar} />
        </View>
      ) : !salaCriada ? (
        <View>
          <Text style={[styles.titulo, modoEscuro && styles.textoEscuro]}>
            Primeiro, vamos entender a situação
          </Text>

          <Text style={[styles.descricao, modoEscuro && styles.textoEscuro]}>
            Quem está prestes a reclamar que "não tem nada para fazer"?
          </Text>

          <Button title="Casal" onPress={() => escolherTipo("casal")} />

          <View style={styles.espaco} />

          <Button title="Amigos" onPress={() => escolherTipo("amigos")} />

          <View style={styles.espaco} />

          <Button title="Sozinho" onPress={() => escolherTipo("sozinho")} />

          {tipo !== "" && (
            <View style={styles.blocoDepois}>
              <Text
                style={[styles.resultado, modoEscuro && styles.textoEscuro]}
              >
                Então é um{" "}
                {tipo === "casal"
                  ? "casal"
                  : tipo === "amigos"
                    ? "grupo de amigos"
                    : "momento solo"}
                .
              </Text>

              <Text
                style={[styles.descricao, modoEscuro && styles.textoEscuro]}
              >
                Agora diga quem é você. A roleta precisa saber quem está por
                trás dessas decisões.
              </Text>

              <TextInput
                style={[styles.input, modoEscuro && styles.inputEscuro]}
                placeholder="Digite seu nome"
                placeholderTextColor={modoEscuro ? "#aaaaaa" : "#666666"}
                value={nomeParticipante}
                onChangeText={setNomeParticipante}
              />

              <Button title="Criar sala" onPress={criarSala} />
            </View>
          )}
        </View>
      ) : etapa === "tipo" ? (
        <View>
          <Text style={[styles.titulo, modoEscuro && styles.textoEscuro]}>
            Sala criada
          </Text>

          <Text style={[styles.descricao, modoEscuro && styles.textoEscuro]}>
            Compartilhe esse código com quem vai participar.
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
              />

              <Button
                title="Adicionar participante"
                onPress={adicionarParticipante}
              />
            </>
          )}

          <FlatList
            data={participantes}
            keyExtractor={(item, index) => `${item.nome}-${index}`}
            renderItem={({ item }) => (
              <ParticipanteItem
                nome={item.nome}
                onRemover={() => removerParticipante(item.nome)}
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
        <View>
          <Text style={[styles.titulo, modoEscuro && styles.textoEscuro]}>
            Agora é pessoal, {participante?.nome}
          </Text>

          <Text style={[styles.descricao, modoEscuro && styles.textoEscuro]}>
            Como você está agora?
          </Text>

          <Text
            style={[styles.descricaoMenor, modoEscuro && styles.textoEscuro]}
          >
            Seja sincero. A roleta precisa saber com quem está lidando.
          </Text>

          <Button
            title="Com preguiça"
            onPress={() => escolherHumor("preguiça")}
          />

          <View style={styles.espaco} />

          <Button title="Com fome" onPress={() => escolherHumor("fome")} />

          <View style={styles.espaco} />

          <Button title="Animado" onPress={() => escolherHumor("animado")} />

          <View style={styles.espaco} />

          <Button
            title="Tranquilo"
            onPress={() => escolherHumor("tranquilo")}
          />

          <View style={styles.espaco} />

          <Button
            title="Tanto faz"
            onPress={() => escolherHumor("tanto faz")}
          />
        </View>
      ) : etapa === "humorEscolhido" ? (
        <View>
          <Text style={[styles.titulo, modoEscuro && styles.textoEscuro]}>
            Entendido...
          </Text>

          <Text style={[styles.descricao, modoEscuro && styles.textoEscuro]}>
            {participante?.nome}, você está:
          </Text>

          <Text style={[styles.codigo, modoEscuro && styles.textoEscuro]}>
            {participante?.humor}
          </Text>

          <Text style={[styles.descricao, modoEscuro && styles.textoEscuro]}>
            Interessante. Agora precisamos descobrir uma coisa importante:
            quanto dói no bolso?
          </Text>

          <Button title="Descobrir" onPress={() => setEtapa("gasto")} />
        </View>
      ) : etapa === "gasto" ? (
        <View>
          <Text style={[styles.titulo, modoEscuro && styles.textoEscuro]}>
            Quanto você pretende gastar?
          </Text>

          <Text style={[styles.descricao, modoEscuro && styles.textoEscuro]}>
            Pode ser sincero. A roleta não julga. Só usa essa informação contra
            o tédio.
          </Text>

          <Button
            title="R$ 0 — Hoje não sai dinheiro"
            onPress={() => escolherGasto("R$ 0")}
          />

          <View style={styles.espaco} />

          <Button title="Até R$ 30" onPress={() => escolherGasto("até 30")} />

          <View style={styles.espaco} />

          <Button title="Até R$ 60" onPress={() => escolherGasto("até 60")} />

          <View style={styles.espaco} />

          <Button title="Até R$ 100" onPress={() => escolherGasto("até 100")} />

          <View style={styles.espaco} />

          <Button
            title="Hoje eu posso gastar"
            onPress={() => escolherGasto("sem limite")}
          />
        </View>
      ) : etapa === "gastoEscolhido" ? (
        <View>
          <Text style={[styles.titulo, modoEscuro && styles.textoEscuro]}>
            Anotado...
          </Text>

          <Text style={[styles.descricao, modoEscuro && styles.textoEscuro]}>
            {participante?.nome}, seu orçamento é:
          </Text>

          <Text style={[styles.codigo, modoEscuro && styles.textoEscuro]}>
            {participante?.gasto}
          </Text>

          <Text style={[styles.descricao, modoEscuro && styles.textoEscuro]}>
            Estamos chegando perto. Agora queremos saber se você realmente quer
            fazer alguma coisa.
          </Text>

          <Button title="Continuar" onPress={() => setEtapa("disposicao")} />
        </View>
      ) : etapa === "disposicao" ? (
        <View>
          <Text style={[styles.titulo, modoEscuro && styles.textoEscuro]}>
            Qual é a sua disposição?
          </Text>

          <Text style={[styles.descricao, modoEscuro && styles.textoEscuro]}>
            O quanto você está disposto a sair da posição atual do sofá?
          </Text>

          <Button
            title="Pouca disposição"
            onPress={() => escolherDisposicao("baixa")}
          />

          <View style={styles.espaco} />

          <Button
            title="Disposto"
            onPress={() => escolherDisposicao("media")}
          />

          <View style={styles.espaco} />

          <Button
            title="Muito disposto"
            onPress={() => escolherDisposicao("alta")}
          />
        </View>
      ) : etapa === "disposicaoEscolhida" ? (
        <View>
          <Text style={[styles.titulo, modoEscuro && styles.textoEscuro]}>
            Última pergunta...
          </Text>

          <Text style={[styles.descricao, modoEscuro && styles.textoEscuro]}>
            {participante?.nome}, sua disposição é:
          </Text>

          <Text style={[styles.codigo, modoEscuro && styles.textoEscuro]}>
            {participante?.disposicao}
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
        <View>
          <Text style={[styles.titulo, modoEscuro && styles.textoEscuro]}>
            Quanto tempo você tem?
          </Text>

          <Text style={[styles.descricao, modoEscuro && styles.textoEscuro]}>
            Escolha o tempo que você realmente tem disponível. Não vale colocar
            3 horas se você precisa sair em 20 minutos.
          </Text>

          <Button
            title="30 minutos"
            onPress={() => escolherTempo("30 minutos")}
          />

          <View style={styles.espaco} />

          <Button
            title="40 minutos"
            onPress={() => escolherTempo("40 minutos")}
          />

          <View style={styles.espaco} />

          <Button title="1 hora" onPress={() => escolherTempo("1 hora")} />

          <View style={styles.espaco} />

          <Button title="2 horas" onPress={() => escolherTempo("2 horas")} />

          <View style={styles.espaco} />

          <Button
            title="3 horas ou mais"
            onPress={() => escolherTempo("3 horas ou mais")}
          />
        </View>
      ) : etapa === "tempoEscolhido" ? (
        <View>
          <Text style={[styles.titulo, modoEscuro && styles.textoEscuro]}>
            Perfeito...
          </Text>

          <Text style={[styles.descricao, modoEscuro && styles.textoEscuro]}>
            {participante?.nome} tem {participante?.tempo} disponíveis.
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
        <View>
          <Text style={[styles.titulo, modoEscuro && styles.textoEscuro]}>
            Então é isso...
          </Text>

          <Text style={[styles.descricao, modoEscuro && styles.textoEscuro]}>
            A roleta já sabe demais sobre vocês.
          </Text>

          <FlatList
            data={participantes}
            keyExtractor={(item, index) => `${item.nome}-${index}`}
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
                  Humor: {item.humor}
                </Text>

                <Text
                  style={[
                    styles.textoResposta,
                    modoEscuro && styles.textoEscuro,
                  ]}
                >
                  Gasto: {item.gasto}
                </Text>

                <Text
                  style={[
                    styles.textoResposta,
                    modoEscuro && styles.textoEscuro,
                  ]}
                >
                  Disposição: {item.disposicao}
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
      ) : etapa === "resultado" ? (
        <View>
          <Text style={[styles.titulo, modoEscuro && styles.textoEscuro]}>
            A Roleta decidiu.
          </Text>

          <Text style={[styles.descricao, modoEscuro && styles.textoEscuro]}>
            Depois de analisar todas as informações, ela chegou a uma conclusão.
          </Text>

          {carregandoRoleta ? (
            <ActivityIndicator size="large" />
          ) : (
            <>
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

              <Text style={[styles.pergunta, modoEscuro && styles.textoEscuro]}>
                Tempo disponível:
              </Text>

              <Text
                style={[styles.subtitulo, modoEscuro && styles.textoEscuro]}
              >
                {menorTempoDisponivel()} minutos
              </Text>

              <Button
                title={
                  atividadeEscolhida?.id === "filme-casa"
                    ? "Escolher filme"
                    : atividadeEscolhida?.id === "jogar"
                      ? "Ver sugestões"
                      : atividadeEscolhida?.id === "evento"
                        ? "Encontrar eventos"
                        : atividadeEscolhida?.id === "cinema"
                          ? "Encontrar cinemas e filmes"
                          : atividadeEscolhida?.id === "cafe"
                            ? "Descobrir a melhor opção"
                            : "Encontrar opções próximas"
                }
                onPress={continuarParaLocalizacao}
              />

              <View style={styles.espacoGrande} />

              <Button title="Girar novamente" onPress={escolherAtividade} />
            </>
          )}
        </View>
      ) : etapa === "resultadoModalidade" ? (
        <View>
          <Text style={[styles.titulo, modoEscuro && styles.textoEscuro]}>
            A Roleta pensou um pouco mais...
          </Text>

          <Text style={[styles.descricao, modoEscuro && styles.textoEscuro]}>
            A atividade escolhida foi:
          </Text>

          <View
            style={[
              styles.resultadoCard,
              modoEscuro && styles.resultadoCardEscuro,
            ]}
          >
            <Text
              style={[styles.resultadoTitulo, modoEscuro && styles.textoEscuro]}
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

            <Text style={[styles.textoCard, modoEscuro && styles.textoEscuro]}>
              {modalidadeEscolhida?.descricao}
            </Text>
          </View>

          <Text style={[styles.descricao, modoEscuro && styles.textoEscuro]}>
            Pelo tempo, disposição, dinheiro e clima de vocês, parece que essa é
            a opção que faz mais sentido agora.
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
            <Text style={[styles.erro, modoEscuro && styles.textoEscuro]}>
              {erroApi}
            </Text>
          )}

          <View style={styles.espacoGrande} />

          <Button title="Começar novamente" onPress={reiniciar} />
        </View>
      ) : etapa === "resultadoFilmes" ? (
        <View>
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

          {erroApi !== "" && (
            <Text style={[styles.erro, modoEscuro && styles.textoEscuro]}>
              {erroApi}
            </Text>
          )}

          <View style={styles.espacoGrande} />

          <Button title="Começar novamente" onPress={reiniciar} />
        </View>
      ) : etapa === "resultadoJogos" ? (
        <View>
          {carregandoJogos ? (
            <View style={styles.carregando}>
              <ActivityIndicator size="large" />

              <Text style={modoEscuro && styles.textoEscuro}>
                Separando os jogos...
              </Text>
            </View>
          ) : (
            <ResultadoJogos
              jogos={jogosFiltrados}
              titulo="Hora de jogar"
              subtitulo="Filtramos as opções de acordo com o número de pessoas, tempo, dinheiro e disposição."
            />
          )}

          {erroApi !== "" && (
            <Text style={[styles.erro, modoEscuro && styles.textoEscuro]}>
              {erroApi}
            </Text>
          )}

          <View style={styles.espacoGrande} />

          <Button title="Começar novamente" onPress={reiniciar} />
        </View>
      ) : etapa === "resultadoEventos" ? (
        <View>
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
            <Text style={[styles.erro, modoEscuro && styles.textoEscuro]}>
              {erroApi}
            </Text>
          )}

          <View style={styles.espacoGrande} />

          <Button title="Começar novamente" onPress={reiniciar} />
        </View>
      ) : (
        <View>
          <Text style={[styles.titulo, modoEscuro && styles.textoEscuro]}>
            Encontrando opções...
          </Text>

          <Text style={[styles.descricao, modoEscuro && styles.textoEscuro]}>
            Agora a roleta vai tentar descobrir se existe alguma coisa
            interessante perto de vocês.
          </Text>

          {atividadeEscolhida && (
            <View style={[styles.card, modoEscuro && styles.cardEscuro]}>
              <Text
                style={[styles.cardTitulo, modoEscuro && styles.textoEscuro]}
              >
                Atividade escolhida
              </Text>

              <Text
                style={[styles.textoCard, modoEscuro && styles.textoEscuro]}
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
                    style={[styles.textoCard, modoEscuro && styles.textoEscuro]}
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
            <View style={[styles.card, modoEscuro && styles.cardEscuro]}>
              <Text
                style={[styles.cardTitulo, modoEscuro && styles.textoEscuro]}
              >
                Localização encontrada
              </Text>

              <Text
                style={[styles.textoCard, modoEscuro && styles.textoEscuro]}
              >
                Latitude: {latitude.toFixed(6)}
              </Text>

              <Text
                style={[styles.textoCard, modoEscuro && styles.textoEscuro]}
              >
                Longitude: {longitude.toFixed(6)}
              </Text>

              {precisao !== null && (
                <Text
                  style={[styles.textoCard, modoEscuro && styles.textoEscuro]}
                >
                  Precisão aproximada: {Math.round(precisao)} metros
                </Text>
              )}
            </View>
          )}

          {clima && (
            <View style={[styles.card, modoEscuro && styles.cardEscuro]}>
              <Text
                style={[styles.cardTitulo, modoEscuro && styles.textoEscuro]}
              >
                Clima atual
              </Text>

              <Text
                style={[styles.textoCard, modoEscuro && styles.textoEscuro]}
              >
                Temperatura: {clima.temperatura}
                °C
              </Text>

              <Text
                style={[styles.textoCard, modoEscuro && styles.textoEscuro]}
              >
                Precipitação: {clima.chuva} mm
              </Text>

              {!climaPermiteAtividade() && (
                <Text style={[styles.aviso, modoEscuro && styles.textoEscuro]}>
                  O clima não parece muito interessado nessa atividade.
                </Text>
              )}
            </View>
          )}

          {erroApi !== "" && (
            <Text style={[styles.erro, modoEscuro && styles.textoEscuro]}>
              {erroApi}
            </Text>
          )}

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
                atividadeEscolhida?.id === "cafe"
                  ? "Cafeterias próximas"
                  : atividadeEscolhida?.id === "parque"
                    ? "Parques próximos"
                    : atividadeEscolhida?.id === "cinema"
                      ? "Cinemas próximos"
                      : atividadeEscolhida?.id === "passeio"
                        ? "Lugares próximos"
                        : atividadeEscolhida?.id === "restaurante"
                          ? "Restaurantes próximos"
                          : "Opções próximas"
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
            </View>
          )}

          <View style={styles.espacoGrande} />

          <Button title="Começar novamente" onPress={reiniciar} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 30,
    maxWidth: 700,
    width: "100%",
    alignSelf: "center",
  },

  containerClaro: {
    backgroundColor: "#ffffff",
  },

  containerEscuro: {
    backgroundColor: "#121212",
  },

  titulo: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 15,
  },

  descricao: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 25,
  },

  descricaoMenor: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 22,
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

  textoCard: {
    fontSize: 16,
    marginBottom: 5,
  },

  espaco: {
    height: 10,
  },

  espacoGrande: {
    marginTop: 20,
  },

  blocoDepois: {
    marginTop: 25,
  },

  resultado: {
    fontSize: 18,
    marginTop: 10,
    marginBottom: 20,
    textAlign: "center",
    fontWeight: "bold",
  },

  codigo: {
    fontSize: 42,
    fontWeight: "bold",
    textAlign: "center",
    letterSpacing: 8,
    marginVertical: 20,
  },

  input: {
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
    fontSize: 16,
    textAlign: "center",
    marginBottom: 10,
    lineHeight: 22,
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
    marginVertical: 20,
    gap: 10,
  },

  card: {
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
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },

  erro: {
    marginTop: 15,
    fontWeight: "bold",
    textAlign: "center",
  },

  resultadoCard: {
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
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },

  resultadoDescricao: {
    fontSize: 16,
    lineHeight: 22,
    textAlign: "center",
  },

  blocoResultado: {
    marginTop: 10,
  },
});

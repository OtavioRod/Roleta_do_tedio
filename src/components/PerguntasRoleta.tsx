import { ReactNode, useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Platform,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
} from "react-native";

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
import { usePreferencias } from "../context/PreferenciasContext";
import { Respostas } from "../services/salas";
import { tocarSom } from "../services/sons";
import BarraProgresso from "./BarraProgresso";
import Botao from "./Botao";
import ContagemPrazo from "./ContagemPrazo";
import Texto from "./Texto";

const VELOCIDADE_DIGITACAO = 18;
const ESPERA_AUTOMATICA_MS = 3200;

const BOTAO_GASTO: Record<GastoOpcao, string> = {
  "R$ 0": "R$ 0 — Hoje não sai dinheiro",
  "até 30": "Até R$ 30",
  "até 60": "Até R$ 60",
  "até 100": "Até R$ 100",
  "sem limite": "Hoje eu posso gastar",
};

type EtapaPergunta =
  | "humor"
  | "humorEscolhido"
  | "gasto"
  | "gastoEscolhido"
  | "disposicao"
  | "disposicaoEscolhida"
  | "tempo"
  | "tempoEscolhido";

const PROXIMA_ETAPA: Partial<Record<EtapaPergunta, EtapaPergunta>> = {
  humorEscolhido: "gasto",
  gastoEscolhido: "disposicao",
  disposicaoEscolhida: "tempo",
};

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

function useReduzirMovimento() {
  const [reduzir, setReduzir] = useState(false);
  const [leitor, setLeitor] = useState(false);

  useEffect(() => {
    if (Platform.OS === "web") {
      if (typeof window === "undefined" || !window.matchMedia) {
        return undefined;
      }

      const consulta = window.matchMedia("(prefers-reduced-motion: reduce)");

      setReduzir(consulta.matches);

      const aoMudar = (evento: MediaQueryListEvent) => {
        setReduzir(evento.matches);
      };

      consulta.addEventListener("change", aoMudar);

      return () => {
        consulta.removeEventListener("change", aoMudar);
      };
    }

    let ativo = true;

    AccessibilityInfo.isReduceMotionEnabled()
      .then((valor) => {
        if (ativo) {
          setReduzir(valor);
        }
      })
      .catch(() => undefined);

    AccessibilityInfo.isScreenReaderEnabled()
      .then((valor) => {
        if (ativo) {
          setLeitor(valor);
        }
      })
      .catch(() => undefined);

    const assinaturaMovimento = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduzir,
    );

    const assinaturaLeitor = AccessibilityInfo.addEventListener(
      "screenReaderChanged",
      setLeitor,
    );

    return () => {
      ativo = false;
      assinaturaMovimento.remove();
      assinaturaLeitor.remove();
    };
  }, []);

  return reduzir || leitor;
}

type TextoDigitadoProps = {
  texto: string;
  estilo?: StyleProp<TextStyle>;
  atraso?: number;
  velocidade?: number;
  cabecalho?: boolean;
};

function TextoDigitado({
  texto,
  estilo,
  atraso = 0,
  velocidade = VELOCIDADE_DIGITACAO,
  cabecalho,
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
    <Texto style={estilo} accessibilityLabel={texto} cabecalho={cabecalho}>
      {texto.slice(0, quantidade)}
      <Text style={styles.textoInvisivel}>{texto.slice(quantidade)}</Text>
    </Texto>
  );
}

type PerguntaAnimadaProps = {
  titulo: string;
  descricao?: string;
  descricaoMenor?: string;
};

function PerguntaAnimada({
  titulo,
  descricao,
  descricaoMenor,
}: PerguntaAnimadaProps) {
  const atrasoDescricao = titulo.length * VELOCIDADE_DIGITACAO;

  const atrasoDescricaoMenor =
    atrasoDescricao + (descricao?.length ?? 0) * VELOCIDADE_DIGITACAO;

  useEffect(() => {
    tocarSom("pergunta");
  }, [titulo]);

  return (
    <>
      <TextoDigitado cabecalho texto={titulo} estilo={styles.titulo} />

      {descricao ? (
        <TextoDigitado
          texto={descricao}
          atraso={atrasoDescricao}
          estilo={styles.descricao}
        />
      ) : null}

      {descricaoMenor ? (
        <TextoDigitado
          texto={descricaoMenor}
          atraso={atrasoDescricaoMenor}
          estilo={styles.descricaoMenor}
        />
      ) : null}
    </>
  );
}

const PASSO_DA_ETAPA: Record<EtapaPergunta, number> = {
  humor: 0,
  humorEscolhido: 1,
  gasto: 1,
  gastoEscolhido: 2,
  disposicao: 2,
  disposicaoEscolhida: 3,
  tempo: 3,
  tempoEscolhido: 4,
};

function Tela({ children }: { children: ReactNode }) {
  return (
    <ScrollView
      style={styles.telaScroll}
      contentContainerStyle={styles.telaConteudo}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator
    >
      <View style={styles.conteudoPrincipal}>{children}</View>
    </ScrollView>
  );
}

type Props = {
  nome: string;
  enviando: boolean;
  erro?: string;
  aoProgresso: (perguntasRespondidas: number) => void;
  aoFinalizar: (respostas: Respostas) => void;
  aoSair: () => void;
  ultimasRespostas?: Respostas | null;
  prazoEm?: number;
};

export default function PerguntasRoleta({
  nome,
  enviando,
  erro,
  aoProgresso,
  aoFinalizar,
  aoSair,
  ultimasRespostas = null,
  prazoEm = 0,
}: Props) {
  const { cores } = usePreferencias();

  const reduzirMovimento = useReduzirMovimento();

  const [etapa, setEtapa] = useState<EtapaPergunta>("humor");
  const [humor, setHumor] = useState<Humor | "">("");
  const [gasto, setGasto] = useState<GastoOpcao | "">("");
  const [disposicao, setDisposicao] = useState<Disposicao | "">("");
  const [tempo, setTempo] = useState<TempoOpcao | "">("");

  const envioAutomaticoFeito = useRef(false);

  const proxima = PROXIMA_ETAPA[etapa];

  useEffect(() => {
    if (!proxima || reduzirMovimento) {
      return undefined;
    }

    const temporizador = setTimeout(
      () => setEtapa(proxima),
      ESPERA_AUTOMATICA_MS,
    );

    return () => clearTimeout(temporizador);
  }, [proxima, reduzirMovimento]);

  function enviar() {
    if (humor === "" || gasto === "" || disposicao === "" || tempo === "") {
      return;
    }

    aoFinalizar({ humor, gasto, disposicao, tempo });
  }

  useEffect(() => {
    if (etapa !== "tempoEscolhido" || reduzirMovimento) {
      return undefined;
    }

    const temporizador = setTimeout(() => {
      if (!envioAutomaticoFeito.current) {
        envioAutomaticoFeito.current = true;
        enviar();
      }
    }, ESPERA_AUTOMATICA_MS);

    return () => clearTimeout(temporizador);
  }, [etapa, reduzirMovimento]);

  function escolherHumor(valor: Humor) {
    setHumor(valor);
    setEtapa("humorEscolhido");
    aoProgresso(1);
  }

  function escolherGasto(valor: GastoOpcao) {
    setGasto(valor);
    setEtapa("gastoEscolhido");
    aoProgresso(2);
  }

  function escolherDisposicao(valor: Disposicao) {
    setDisposicao(valor);
    setEtapa("disposicaoEscolhida");
    aoProgresso(3);
  }

  function escolherTempo(valor: TempoOpcao) {
    setTempo(valor);
    setEtapa("tempoEscolhido");
    aoProgresso(4);
  }

  function reaproveitarRespostas() {
    if (!ultimasRespostas || envioAutomaticoFeito.current) {
      return;
    }

    envioAutomaticoFeito.current = true;

    setHumor(ultimasRespostas.humor);
    setGasto(ultimasRespostas.gasto);
    setDisposicao(ultimasRespostas.disposicao);
    setTempo(ultimasRespostas.tempo);

    aoProgresso(4);
    aoFinalizar(ultimasRespostas);
  }

  const rodape = (
    <View style={styles.rodape}>
      {erro ? (
        <Texto
          accessibilityRole="alert"
          style={[styles.aviso, { color: cores.erro }]}
        >
          {erro}
        </Texto>
      ) : null}

      <Botao titulo="Sair da sala" secundario onPress={aoSair} />
    </View>
  );

  if (etapa === "humor") {
    return (
      <Tela>
        <BarraProgresso total={4} atual={PASSO_DA_ETAPA[etapa]} />

        <ContagemPrazo prazoEm={prazoEm} />

        <PerguntaAnimada
          titulo={`Agora é pessoal, ${nome}`}
          descricao="Como você está agora?"
          descricaoMenor="Seja sincero. A roleta precisa saber com quem está lidando."
        />

        {ultimasRespostas ? (
          <View style={styles.opcaoBotao}>
            <Botao
              titulo="Usar as mesmas respostas da última rodada"
              secundario
              onPress={reaproveitarRespostas}
              desabilitado={enviando}
            />
          </View>
        ) : null}

        {OPCOES_HUMOR.map((opcao) => (
          <View key={opcao.valor} style={styles.opcaoBotao}>
            <Botao
              titulo={opcao.rotulo}
              onPress={() => escolherHumor(opcao.valor)}
            />
          </View>
        ))}

        {rodape}
      </Tela>
    );
  }

  if (etapa === "humorEscolhido") {
    return (
      <Tela>
        <Texto cabecalho style={styles.titulo}>
          Entendido...
        </Texto>

        <Texto style={styles.descricao}>{nome}, você está:</Texto>

        <Texto style={styles.codigo}>{rotuloHumor(humor)}</Texto>

        <Texto style={styles.descricao}>
          Interessante. Agora precisamos descobrir uma coisa importante: quanto
          dói no bolso?
        </Texto>

        <Botao titulo="Descobrir" onPress={() => setEtapa("gasto")} />

        {rodape}
      </Tela>
    );
  }

  if (etapa === "gasto") {
    return (
      <Tela>
        <BarraProgresso total={4} atual={PASSO_DA_ETAPA[etapa]} />

        <PerguntaAnimada
          titulo="Quanto você pretende gastar?"
          descricao="Pode ser sincero. A roleta não julga. Só usa essa informação contra o tédio."
        />

        {OPCOES_GASTO.map((opcao) => (
          <View key={opcao.valor} style={styles.opcaoBotao}>
            <Botao
              titulo={BOTAO_GASTO[opcao.valor]}
              onPress={() => escolherGasto(opcao.valor)}
            />
          </View>
        ))}

        {rodape}
      </Tela>
    );
  }

  if (etapa === "gastoEscolhido") {
    return (
      <Tela>
        <Texto cabecalho style={styles.titulo}>
          Anotado...
        </Texto>

        <Texto style={styles.descricao}>{nome}, seu orçamento é:</Texto>

        <Texto style={styles.codigo}>{rotuloGasto(gasto)}</Texto>

        <Texto style={styles.descricao}>
          Estamos chegando perto. Agora queremos saber se você realmente quer
          fazer alguma coisa.
        </Texto>

        <Botao titulo="Continuar" onPress={() => setEtapa("disposicao")} />

        {rodape}
      </Tela>
    );
  }

  if (etapa === "disposicao") {
    return (
      <Tela>
        <BarraProgresso total={4} atual={PASSO_DA_ETAPA[etapa]} />

        <PerguntaAnimada
          titulo="Qual é a sua disposição?"
          descricao="O quanto você está disposto a sair da posição atual do sofá?"
        />

        {OPCOES_DISPOSICAO.map((opcao) => (
          <View key={opcao.valor} style={styles.opcaoBotao}>
            <Botao
              titulo={opcao.rotulo}
              onPress={() => escolherDisposicao(opcao.valor)}
            />
          </View>
        ))}

        {rodape}
      </Tela>
    );
  }

  if (etapa === "disposicaoEscolhida") {
    return (
      <Tela>
        <Texto cabecalho style={styles.titulo}>
          Última pergunta...
        </Texto>

        <Texto style={styles.descricao}>{nome}, sua disposição é:</Texto>

        <Texto style={styles.codigo}>{rotuloDisposicao(disposicao)}</Texto>

        <Texto style={styles.descricao}>
          Só falta descobrir quanto tempo vocês realmente têm.
        </Texto>

        <Botao titulo="Descobrir meu tempo" onPress={() => setEtapa("tempo")} />

        {rodape}
      </Tela>
    );
  }

  if (etapa === "tempo") {
    return (
      <Tela>
        <BarraProgresso total={4} atual={PASSO_DA_ETAPA[etapa]} />

        <PerguntaAnimada
          titulo="Quanto tempo você tem?"
          descricao="Escolha o tempo que você realmente tem disponível. Não vale colocar 3 horas se você precisa sair em 20 minutos."
        />

        {OPCOES_TEMPO.map((opcao) => (
          <View key={opcao.valor} style={styles.opcaoBotao}>
            <Botao
              titulo={opcao.valor}
              onPress={() => escolherTempo(opcao.valor)}
            />
          </View>
        ))}

        {rodape}
      </Tela>
    );
  }

  return (
    <Tela>
      <Texto cabecalho style={styles.titulo}>
        Perfeito...
      </Texto>

      <Texto style={styles.descricao}>
        {nome} tem {tempo} disponíveis.
      </Texto>

      <Texto style={styles.descricao}>
        Suas respostas vão para os outros participantes. Quando todos
        terminarem, a roleta gira para o grupo inteiro ao mesmo tempo.
      </Texto>

      <Botao
        titulo={enviando ? "Enviando..." : "Enviar minhas respostas"}
        onPress={() => {
          envioAutomaticoFeito.current = true;
          enviar();
        }}
        desabilitado={enviando}
      />

      {rodape}
    </Tela>
  );
}

const styles = StyleSheet.create({
  telaScroll: {
    flex: 1,
    width: "100%",
  },

  telaConteudo: {
    flexGrow: 1,
    justifyContent: "center",
    paddingTop: 24,
    paddingBottom: 100,
  },

  conteudoPrincipal: {
    width: "100%",
    maxWidth: 700,
    alignSelf: "center",
    paddingHorizontal: 16,
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

  codigo: {
    fontSize: 42,
    fontWeight: "bold",
    textAlign: "center",
    letterSpacing: 8,
    marginVertical: 20,
  },

  textoInvisivel: {
    color: "transparent",
  },

  opcaoBotao: {
    marginBottom: 10,
  },

  rodape: {
    marginTop: 28,
  },

  aviso: {
    fontSize: 15,
    textAlign: "center",
    marginBottom: 10,
    lineHeight: 21,
  },
});

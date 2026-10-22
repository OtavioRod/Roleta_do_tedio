import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle, Path, Text as SvgText } from "react-native-svg";

import Texto from "./Texto";
import { Atividade } from "../data/atividades";

const TAMANHO = 300;
const CENTRO = TAMANHO / 2;
const RAIO = 145;
const DURACAO_GIRO_MS = 6200;
const DURACAO_RESULTADO_MS = 1000;
const VOLTAS_COMPLETAS = 8;
const MARGEM_DA_FATIA = 0.1;

const CORES_FATIAS = [
  "#1769aa",
  "#008577",
  "#7048a8",
  "#c45b17",
  "#b8325e",
  "#4267a9",
  "#587b21",
  "#775548",
];

const ROTULOS: Record<string, string> = {
  cafe: "Café",
  restaurante: "Comer fora",
  cinema: "Cinema",
  parque: "Parque",
  passeio: "Passeio",
  evento: "Evento",
  "filme-casa": "Filme em casa",
  jogar: "Jogos",
};

type RoletaAtividadesProps = {
  atividades: Atividade[];
  selecionada: Atividade;
  aoConcluir: () => void;
};

function pontoNoCirculo(angulo: number, raio: number) {
  const radianos = (angulo * Math.PI) / 180;

  return {
    x: CENTRO + raio * Math.cos(radianos),
    y: CENTRO + raio * Math.sin(radianos),
  };
}

function caminhoFatia(indice: number, quantidade: number) {
  const anguloFatia = 360 / quantidade;
  const inicio = pontoNoCirculo(-90 + indice * anguloFatia, RAIO);
  const fim = pontoNoCirculo(-90 + (indice + 1) * anguloFatia, RAIO);

  return `M ${CENTRO} ${CENTRO} L ${inicio.x} ${inicio.y} A ${RAIO} ${RAIO} 0 0 1 ${fim.x} ${fim.y} Z`;
}

export default function RoletaAtividades({
  atividades,
  selecionada,
  aoConcluir,
}: RoletaAtividadesProps) {
  const [parada, setParada] = useState(false);
  const temporizadorResultado =
    useRef<ReturnType<typeof setTimeout> | null>(null);
  const rotacao = useSharedValue(0);
  const estiloRotacao = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotacao.value}deg` }],
  }));
  const raioRotulo = RAIO * 0.58;
  const maiorRotulo = Math.max(
    1,
    ...atividades.map(
      (atividade) => (ROTULOS[atividade.id] ?? atividade.nome).length,
    ),
  );
  const espacoRadial = Math.min(
    raioRotulo - 30,
    RAIO - raioRotulo - 8,
  ) * 2;
  const espacoTangencial =
    raioRotulo *
    2 *
    Math.sin(Math.PI / Math.max(atividades.length, 1)) *
    0.8;
  const tamanhoFonteRotulo = Math.max(
    1,
    Math.floor(
      Math.min(18, espacoRadial / (maiorRotulo * 0.6), espacoTangencial),
    ),
  );

  const concluirDepoisDoResultado = useCallback(() => {
    setParada(true);
    temporizadorResultado.current = setTimeout(
      aoConcluir,
      DURACAO_RESULTADO_MS,
    );
  }, [aoConcluir]);

  useEffect(() => {
    const indice = atividades.findIndex(
      (atividade) => atividade.id === selecionada.id,
    );

    if (indice < 0) {
      throw new Error("A atividade sorteada não está na roleta.");
    }

    const anguloFatia = 360 / atividades.length;
    const margem = anguloFatia * MARGEM_DA_FATIA;
    const posicaoNaFatia =
      Math.random() * (anguloFatia - margem * 2) + margem;
    const anguloSelecionado = -90 + indice * anguloFatia + posicaoNaFatia;
    const rotacaoFinal = 360 * VOLTAS_COMPLETAS - anguloSelecionado;

    rotacao.value = withTiming(
      rotacaoFinal,
      {
        duration: DURACAO_GIRO_MS,
        easing: Easing.out(Easing.cubic),
      },
      (terminou) => {
        if (terminou) {
          runOnJS(concluirDepoisDoResultado)();
        }
      },
    );

    return () => {
      cancelAnimation(rotacao);

      if (temporizadorResultado.current !== null) {
        clearTimeout(temporizadorResultado.current);
      }
    };
  }, [
    atividades,
    concluirDepoisDoResultado,
    rotacao,
    selecionada.id,
    temporizadorResultado,
  ]);

  return (
    <View
      style={styles.container}
      accessibilityRole="progressbar"
      accessibilityLabel={
        parada
          ? `Resultado da roleta: ${selecionada.nome}`
          : "A roleta está girando para escolher uma atividade"
      }
    >
      <Texto cabecalho style={styles.titulo}>
        {parada ? `Saiu: ${selecionada.nome}` : "Girando a roleta..."}
      </Texto>

      <View style={styles.roleta}>
        <View style={styles.seta}>
          <Texto style={styles.textoSeta}>◀</Texto>
        </View>

        <Animated.View style={[styles.roda, estiloRotacao]}>
          <Svg
            width={TAMANHO}
            height={TAMANHO}
            viewBox={`0 0 ${TAMANHO} ${TAMANHO}`}
          >
            {atividades.map((atividade, indice) => {
              const anguloFatia = 360 / atividades.length;
              const meioFatia = -90 + (indice + 0.5) * anguloFatia;
              const rotulo = pontoNoCirculo(meioFatia, RAIO * 0.58);

              return (
                <Fragment key={atividade.id}>
                  <Path
                    d={caminhoFatia(indice, atividades.length)}
                    fill={CORES_FATIAS[indice % CORES_FATIAS.length]}
                    stroke="#ffffff"
                    strokeWidth={2}
                  />
                  <SvgText
                    x={rotulo.x}
                    y={rotulo.y}
                    transform={`rotate(${meioFatia}, ${rotulo.x}, ${rotulo.y})`}
                    fill="#ffffff"
                    fontSize={tamanhoFonteRotulo}
                    fontWeight="bold"
                    textAnchor="middle"
                    alignmentBaseline="middle"
                  >
                    {ROTULOS[atividade.id] ?? atividade.nome}
                  </SvgText>
                </Fragment>
              );
            })}

            <Circle
              cx={CENTRO}
              cy={CENTRO}
              r={22}
              fill="#ffffff"
              stroke="#263238"
              strokeWidth={2}
            />
            <Circle cx={CENTRO} cy={CENTRO} r={7} fill="#263238" />
          </Svg>
        </Animated.View>
      </View>

      <Texto style={styles.descricao}>
        {parada
          ? "A roleta decidiu."
          : "A roleta está escolhendo entre todas as atividades."}
      </Texto>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },

  titulo: {
    fontSize: 25,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 28,
  },

  roleta: {
    width: TAMANHO,
    height: TAMANHO,
    alignItems: "center",
    justifyContent: "center",
  },

  roda: {
    width: TAMANHO,
    height: TAMANHO,
  },

  seta: {
    position: "absolute",
    zIndex: 1,
    right: -18,
    top: "50%",
    alignItems: "center",
    transform: [{ translateY: -18 }],
  },

  textoSeta: {
    fontSize: 26,
    lineHeight: 36,
    color: "#d32f2f",
  },

  descricao: {
    marginTop: 28,
    fontSize: 16,
    textAlign: "center",
  },
});

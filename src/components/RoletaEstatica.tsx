import { StyleSheet, View } from "react-native";
import Svg, { Circle, G, Path, Text as SvgText } from "react-native-svg";

import { usePreferencias } from "../context/PreferenciasContext";

const ROTULOS = [
  "Café",
  "Comer fora",
  "Cinema",
  "Parque",
  "Passeio",
  "Evento",
  "Filme",
  "Jogos",
];

type Props = {
  tamanho?: number;
};

function ponto(centro: number, raio: number, graus: number) {
  const radianos = (graus * Math.PI) / 180;

  return {
    x: centro + raio * Math.cos(radianos),
    y: centro + raio * Math.sin(radianos),
  };
}

export default function RoletaEstatica({ tamanho = 240 }: Props) {
  const { cores } = usePreferencias();

  const centro = tamanho / 2;
  const raio = centro - 6;
  const fatia = 360 / ROTULOS.length;
  const preenchimentos = [cores.primaria, cores.amarelo, cores.verde, cores.rosa];

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.caixa, { width: tamanho + 12, height: tamanho + 24 }]}
    >
      <View
        style={[
          styles.sombra,
          {
            width: tamanho,
            height: tamanho,
            borderRadius: tamanho / 2,
            backgroundColor: cores.sombra,
          },
        ]}
      />

      <Svg width={tamanho} height={tamanho} style={styles.roda}>
        {ROTULOS.map((rotulo, indice) => {
          const inicio = -90 + indice * fatia;
          const fim = inicio + fatia;
          const a = ponto(centro, raio, inicio);
          const b = ponto(centro, raio, fim);
          const meio = ponto(centro, raio * 0.62, inicio + fatia / 2);

          return (
            <G key={rotulo}>
              <Path
                d={`M ${centro} ${centro} L ${a.x} ${a.y} A ${raio} ${raio} 0 0 1 ${b.x} ${b.y} Z`}
                fill={preenchimentos[indice % preenchimentos.length]}
                stroke="#1E130F"
                strokeWidth={3}
              />
              <SvgText
                x={meio.x}
                y={meio.y}
                fill="#1E130F"
                fontSize={tamanho / 20}
                fontWeight="bold"
                textAnchor="middle"
                alignmentBaseline="middle"
                transform={`rotate(${inicio + fatia / 2 + 90}, ${meio.x}, ${meio.y})`}
              >
                {rotulo}
              </SvgText>
            </G>
          );
        })}

        <Circle
          cx={centro}
          cy={centro}
          r={raio}
          fill="none"
          stroke="#1E130F"
          strokeWidth={5}
        />

        <Circle
          cx={centro}
          cy={centro}
          r={tamanho / 11}
          fill="#FFFBF4"
          stroke="#1E130F"
          strokeWidth={4}
        />

        <SvgText
          x={centro}
          y={centro + tamanho / 40}
          fontSize={tamanho / 11}
          textAnchor="middle"
          alignmentBaseline="middle"
        >
          😴
        </SvgText>
      </Svg>

      <View
        style={[
          styles.seta,
          { borderTopColor: cores.borda, top: 0 },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  caixa: {
    alignItems: "flex-start",
    justifyContent: "flex-end",
    alignSelf: "center",
  },

  sombra: {
    position: "absolute",
    left: 8,
    bottom: 0,
  },

  roda: {
    marginBottom: 8,
  },

  seta: {
    position: "absolute",
    left: "50%",
    marginLeft: -14,
    width: 0,
    height: 0,
    borderLeftWidth: 14,
    borderRightWidth: 14,
    borderTopWidth: 24,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
  },
});

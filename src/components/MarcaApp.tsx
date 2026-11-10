import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { usePreferencias } from "../context/PreferenciasContext";
import { useReduzirMovimento } from "../hooks/useReduzirMovimento";
import Texto from "./Texto";

type Props = {
  titulo: string;
  destacar?: string;
  subtitulo?: string;
};

export default function MarcaApp({ titulo, destacar, subtitulo }: Props) {
  const { cores } = usePreferencias();

  const reduzirMovimento = useReduzirMovimento();

  const angulo = useSharedValue(0);

  useEffect(() => {
    if (reduzirMovimento) {
      cancelAnimation(angulo);
      angulo.value = 0;

      return undefined;
    }

    angulo.value = -3;

    angulo.value = withRepeat(
      withSequence(
        withTiming(3, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(-3, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
    );

    return () => cancelAnimation(angulo);
  }, [angulo, reduzirMovimento]);

  const estiloAngulo = useAnimatedStyle(() => ({
    transform: [{ rotate: `${angulo.value}deg` }],
  }));

  const indice = destacar ? titulo.indexOf(destacar) : -1;

  return (
    <View style={styles.coluna}>
      <Animated.View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={[
          styles.dado,
          estiloAngulo,
          { backgroundColor: cores.amarelo, borderColor: cores.borda },
        ]}
      >
        <Texto librasIgnorado style={styles.emoji}>
          🎲
        </Texto>
      </Animated.View>

      <Texto cabecalho style={styles.titulo}>
        {indice >= 0 ? (
          <>
            {titulo.slice(0, indice)}
            <Texto
              librasIgnorado
              style={[styles.titulo, { color: cores.primaria }]}
            >
              {destacar}
            </Texto>
            {titulo.slice(indice + (destacar?.length ?? 0))}
          </>
        ) : (
          titulo
        )}
      </Texto>

      {subtitulo ? (
        <Texto style={[styles.subtitulo, { color: cores.textoSecundario }]}>
          {subtitulo}
        </Texto>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  coluna: {
    alignItems: "center",
    marginBottom: 24,
  },

  dado: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },

  emoji: {
    fontSize: 30,
    lineHeight: 38,
    color: "#1E130F",
  },

  titulo: {
    marginTop: 14,
    fontSize: 36,
    lineHeight: 40,
    textAlign: "center",
  },

  subtitulo: {
    marginTop: 4,
    fontSize: 16,
    textAlign: "center",
  },
});

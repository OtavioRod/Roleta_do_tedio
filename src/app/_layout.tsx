import { DarkTheme, DefaultTheme, Slot, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { View } from "react-native";

import { AnimatedSplashOverlay } from "@/components/animated-icon";
import PainelAcessibilidade from "@/components/PainelAcessibilidade";
import VLibrasWidget from "@/components/VLibrasWidget";
import {
  PreferenciasProvider,
  usePreferencias,
} from "@/context/PreferenciasContext";

SplashScreen.preventAutoHideAsync();

function Conteudo() {
  const { tema, cores } = usePreferencias();

  return (
    <ThemeProvider value={tema === "escuro" ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />

      <View style={{ flex: 1, backgroundColor: cores.fundo }}>
        <Slot />

        <PainelAcessibilidade />
      </View>

      <VLibrasWidget />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <PreferenciasProvider>
      <Conteudo />
    </PreferenciasProvider>
  );
}

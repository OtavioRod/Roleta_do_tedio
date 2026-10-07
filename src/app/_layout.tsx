<<<<<<< HEAD
import { DarkTheme, DefaultTheme, ThemeProvider } from "expo-router";
=======
import { DarkTheme, DefaultTheme, Slot, ThemeProvider } from "expo-router";
>>>>>>> 8e67322 (corrigindo antes de Aplicar a acessibilidade)
import * as SplashScreen from "expo-splash-screen";
import { useColorScheme } from "react-native";

import { AnimatedSplashOverlay } from "@/components/animated-icon";
<<<<<<< HEAD
import AppTabs from "@/components/app-tabs";
import { AccessibilityProvider } from "@/context/AccessibilityContext";
=======
>>>>>>> 8e67322 (corrigindo antes de Aplicar a acessibilidade)

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
<<<<<<< HEAD
    <AccessibilityProvider>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <AnimatedSplashOverlay />
        <AppTabs />
      </ThemeProvider>
    </AccessibilityProvider>
=======
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <Slot />
    </ThemeProvider>
>>>>>>> 8e67322 (corrigindo antes de Aplicar a acessibilidade)
  );
}

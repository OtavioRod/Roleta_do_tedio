import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { AnimatedSplashOverlay } from "@/components/animated-icon";
import AvisoConvite from "@/components/AvisoConvite";
import AvisoSessao from "@/components/AvisoSessao";
import BarraConta from "@/components/BarraConta";
import PainelAcessibilidade from "@/components/PainelAcessibilidade";
import Texto from "@/components/Texto";
import VLibrasWidget from "@/components/VLibrasWidget";
import {
  PreferenciasProvider,
  usePreferencias,
} from "@/context/PreferenciasContext";
import { SessaoProvider, useSessao } from "@/context/SessaoContext";
import { acordarBackend } from "@/services/acordarBackend";

SplashScreen.preventAutoHideAsync();

function Conteudo() {
  const { tema, cores } = usePreferencias();

  const { carregando, usuario, emailOk, permissoesConcluidas } = useSessao();

  useEffect(() => {
    acordarBackend();
  }, []);

  const autenticado = !!usuario;

  const liberado = autenticado && emailOk;

  return (
    <ThemeProvider value={tema === "escuro" ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />

      <View style={[styles.raiz, { backgroundColor: cores.fundo }]}>
        {carregando ? (
          <View
            style={styles.carregando}
            accessibilityRole="progressbar"
            accessibilityLabel="Verificando sua sessão"
          >
            <ActivityIndicator size="large" color={cores.destaque} />

            <Texto>Verificando sua sessão...</Texto>
          </View>
        ) : (
          <>
            {autenticado && <BarraConta />}

            <View style={styles.pilha}>
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: cores.fundo },
                }}
              >
                <Stack.Protected guard={liberado && permissoesConcluidas}>
                  <Stack.Screen name="index" />
                  <Stack.Screen name="perfil" />
                  <Stack.Screen name="salas" />
                  <Stack.Screen name="amigos" />
                  <Stack.Screen name="sala/[codigo]" />
                </Stack.Protected>

                <Stack.Protected guard={liberado}>
                  <Stack.Screen name="permissoes" />
                </Stack.Protected>

                <Stack.Protected guard={autenticado && !emailOk}>
                  <Stack.Screen name="verificar-email" />
                </Stack.Protected>

                <Stack.Protected guard={!autenticado}>
                  <Stack.Screen name="entrar" />
                  <Stack.Screen name="cadastrar" />
                </Stack.Protected>
              </Stack>
            </View>
          </>
        )}

        <AvisoConvite />

        <PainelAcessibilidade />

        <AvisoSessao />
      </View>

      <VLibrasWidget />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <PreferenciasProvider>
      <SessaoProvider>
        <Conteudo />
      </SessaoProvider>
    </PreferenciasProvider>
  );
}

const styles = StyleSheet.create({
  raiz: {
    flex: 1,
  },

  pilha: {
    flex: 1,
  },

  carregando: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
});

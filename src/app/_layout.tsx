import { BricolageGrotesque_800ExtraBold } from "@expo-google-fonts/bricolage-grotesque/800ExtraBold";
import { Figtree_400Regular } from "@expo-google-fonts/figtree/400Regular";
import { Figtree_500Medium } from "@expo-google-fonts/figtree/500Medium";
import { Figtree_700Bold } from "@expo-google-fonts/figtree/700Bold";
import { useFonts } from "expo-font";
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { ActivityIndicator, Platform, StyleSheet, View } from "react-native";

import AbrirSalaPendente from "@/components/AbrirSalaPendente";
import { AnimatedSplashOverlay } from "@/components/animated-icon";
import AvisoConvite from "@/components/AvisoConvite";
import AvisoNotificacao, {
  NotificadorSocial,
} from "@/components/AvisoNotificacao";
import AvisoSessao from "@/components/AvisoSessao";
import BarraConta from "@/components/BarraConta";
import OuvinteNotificacoes from "@/components/OuvinteNotificacoes";
import PainelAcessibilidade from "@/components/PainelAcessibilidade";
import Texto from "@/components/Texto";
import VLibrasAppProvider from "@/components/VLibrasAppProvider";
import VLibrasWidget from "@/components/VLibrasWidget";
import {
  PreferenciasProvider,
  usePreferencias,
} from "@/context/PreferenciasContext";
import { SessaoProvider, useSessao } from "@/context/SessaoContext";
import { acordarBackend } from "@/services/acordarBackend";
import { definirSistemaPermitido } from "@/services/notificar";
import { configurarNotificacoes } from "@/services/permissoes";
import { carregarPreferenciasAudio } from "@/services/preferenciasAudio";

SplashScreen.preventAutoHideAsync();

function Conteudo() {
  const { tema, cores } = usePreferencias();

  const [fontesCarregadas, erroFontes] = useFonts({
    BricolageGrotesque_800ExtraBold,
    Figtree_400Regular,
    Figtree_500Medium,
    Figtree_700Bold,
  });

  const fontesProntas = fontesCarregadas || erroFontes !== null;

  const { carregando, usuario, perfil, emailOk, permissoesConcluidas } =
    useSessao();

  useEffect(() => {
    acordarBackend();
    configurarNotificacoes().catch(() => undefined);
    carregarPreferenciasAudio().catch(() => undefined);
  }, []);

  const permitePush = perfil?.notificacoes.push === true;

  useEffect(() => {
    definirSistemaPermitido(permitePush);
  }, [permitePush]);

  const autenticado = !!usuario;

  const liberado = autenticado && emailOk;

  return (
    <ThemeProvider value={tema === "escuro" ? DarkTheme : DefaultTheme}>
      <VLibrasAppProvider>
        <AnimatedSplashOverlay />

        <View
          style={[
            styles.raiz,
            { backgroundColor: cores.fundo },
            Platform.OS === "web"
              ? ({
                  backgroundImage: `radial-gradient(${cores.ponto} 1px, transparent 1px)`,
                  backgroundSize: "22px 22px",
                } as object)
              : null,
          ]}
        >
          {carregando || !fontesProntas ? (
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
                    contentStyle: {
                      backgroundColor:
                        Platform.OS === "web" ? "transparent" : cores.fundo,
                    },
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

          <PainelAcessibilidade />

          <AbrirSalaPendente />

          <OuvinteNotificacoes />

          <AvisoConvite />

          <NotificadorSocial />

          <AvisoNotificacao />

          <AvisoSessao />
        </View>

        <VLibrasWidget />
      </VLibrasAppProvider>
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

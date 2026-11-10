import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";

import { usePreferencias } from "../context/PreferenciasContext";
import { useSessao } from "../context/SessaoContext";
import Botao from "./Botao";
import Texto from "./Texto";

export default function BarraConta() {
  const router = useRouter();

  const { cores } = usePreferencias();

  const { usuario, perfil, sair, emailOk, permissoesConcluidas } = useSessao();

  const nome = perfil?.nome || usuario?.displayName || usuario?.email || "";

  const liberado = emailOk && permissoesConcluidas;

  return (
    <View
      style={[
        styles.barra,
        { backgroundColor: cores.fundo, borderBottomColor: cores.borda },
      ]}
    >
      <View style={styles.marca}>
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={[
            styles.dado,
            { backgroundColor: cores.amarelo, borderColor: cores.borda },
          ]}
        >
          <Texto librasIgnorado style={styles.emoji}>
            🎲
          </Texto>
        </View>

        <Texto cabecalho numberOfLines={1} style={styles.nome}>
          Olá, {nome}
        </Texto>
      </View>

      <View style={styles.acoes}>
        {liberado && (
          <>
            <Botao
              titulo="Salas"
              secundario
              pequeno
              dica="Cria uma sala online ou entra em uma"
              onPress={() => router.push("/salas")}
            />

            <Botao
              titulo="Perfil"
              secundario
              pequeno
              dica="Mostra os dados da sua conta e da sessão"
              onPress={() => router.push("/perfil")}
            />
          </>
        )}

        <Botao titulo="Sair" pequeno onPress={sair} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  barra: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 2,
  },

  marca: {
    flex: 1,
    minWidth: 140,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  dado: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },

  emoji: {
    fontSize: 16,
    lineHeight: 22,
    color: "#1E130F",
  },

  nome: {
    flexShrink: 1,
    fontSize: 18,
  },

  acoes: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
});

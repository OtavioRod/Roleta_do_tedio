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

  const podeVerPerfil = emailOk && permissoesConcluidas;

  return (
    <View
      style={[
        styles.barra,
        { backgroundColor: cores.superficie, borderBottomColor: cores.borda },
      ]}
    >
      <Texto numberOfLines={1} style={styles.nome}>
        Olá, {nome}
      </Texto>

      {podeVerPerfil && (
        <View style={styles.acao}>
          <Botao
            titulo="Perfil"
            secundario
            dica="Mostra os dados da sua conta e da sessão"
            onPress={() => router.push("/perfil")}
          />
        </View>
      )}

      <View style={styles.acao}>
        <Botao titulo="Sair" secundario onPress={sair} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  barra: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomWidth: 1,
  },

  nome: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
  },

  acao: {
    minWidth: 84,
  },
});

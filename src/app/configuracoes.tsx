import { useRouter } from "expo-router";
import {
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import { useAccessibility } from "@/context/AccessibilityContext";

export default function Configuracoes() {
  const router = useRouter();

  const {
    modoEscuro,
    alternarTema,
    tamanhoFonte,
    definirTamanhoFonte,
    obterTamanhoFonte,
  } = useAccessibility();

  const estilos = criarEstilos(modoEscuro, obterTamanhoFonte);

  return (
    <View style={estilos.container}>
      <ScrollView
        contentContainerStyle={estilos.conteudo}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          style={estilos.botaoVoltar}
          onPress={() => router.back()}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          accessibilityHint="Volta para a tela anterior."
        >
          <Text style={estilos.botaoVoltarTexto}>← Voltar</Text>
        </TouchableOpacity>

        <Text style={estilos.titulo}>Configurações</Text>

        <Text style={estilos.descricao}>
          Personalize o aplicativo de acordo com suas necessidades de
          acessibilidade.
        </Text>

        {/* MODO ESCURO */}
        <View style={estilos.card}>
          <View style={estilos.linha}>
            <View style={estilos.textosLinha}>
              <Text style={estilos.tituloOpcao}>Modo escuro</Text>

              <Text style={estilos.descricaoOpcao}>
                Altera as cores do aplicativo para um tema mais escuro.
              </Text>
            </View>

            <Switch
              value={modoEscuro}
              onValueChange={alternarTema}
              accessible
              accessibilityRole="switch"
              accessibilityLabel="Modo escuro"
              accessibilityHint="Ativa ou desativa o modo escuro."
              accessibilityState={{ checked: modoEscuro }}
            />
          </View>
        </View>

        {/* TAMANHO DA FONTE */}
        <View style={estilos.card}>
          <Text style={estilos.tituloOpcao}>Tamanho da fonte</Text>

          <Text style={estilos.descricaoOpcao}>
            Escolha o tamanho dos textos exibidos no aplicativo.
          </Text>

          <TouchableOpacity
            style={[
              estilos.opcaoFonte,
              tamanhoFonte === "normal" && estilos.opcaoFonteSelecionada,
            ]}
            onPress={() => definirTamanhoFonte("normal")}
            accessible
            accessibilityRole="radio"
            accessibilityLabel="Tamanho da fonte normal"
            accessibilityState={{
              selected: tamanhoFonte === "normal",
            }}
          >
            <Text style={estilos.textoOpcaoFonte}>Normal</Text>

            <Text style={estilos.exemploNormal}>Exemplo de texto normal</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              estilos.opcaoFonte,
              tamanhoFonte === "grande" && estilos.opcaoFonteSelecionada,
            ]}
            onPress={() => definirTamanhoFonte("grande")}
            accessible
            accessibilityRole="radio"
            accessibilityLabel="Tamanho da fonte grande"
            accessibilityState={{
              selected: tamanhoFonte === "grande",
            }}
          >
            <Text style={estilos.textoOpcaoFonte}>Grande</Text>

            <Text style={estilos.exemploGrande}>Exemplo de texto grande</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              estilos.opcaoFonte,
              tamanhoFonte === "muitoGrande" && estilos.opcaoFonteSelecionada,
            ]}
            onPress={() => definirTamanhoFonte("muitoGrande")}
            accessible
            accessibilityRole="radio"
            accessibilityLabel="Tamanho da fonte muito grande"
            accessibilityState={{
              selected: tamanhoFonte === "muitoGrande",
            }}
          >
            <Text style={estilos.textoOpcaoFonte}>Muito grande</Text>

            <Text style={estilos.exemploMuitoGrande}>
              Exemplo de texto muito grande
            </Text>
          </TouchableOpacity>
        </View>

        {/* INFORMAÇÃO */}
        <View style={estilos.card}>
          <Text style={estilos.tituloOpcao}>Acessibilidade</Text>

          <Text style={estilos.descricaoOpcao}>
            As configurações escolhidas são salvas automaticamente neste
            dispositivo.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function criarEstilos(
  modoEscuro: boolean,
  obterTamanhoFonte: (tamanhoBase: number) => number,
) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: modoEscuro ? "#121212" : "#ffffff",
    },

    conteudo: {
      width: "100%",
      maxWidth: 700,
      alignSelf: "center",
      paddingHorizontal: 16,
      paddingTop: 20,
      paddingBottom: 40,
    },

    botaoVoltar: {
      alignSelf: "flex-start",
      paddingVertical: 8,
      paddingHorizontal: 4,
      marginBottom: 20,
    },

    botaoVoltarTexto: {
      fontSize: obterTamanhoFonte(18),
      color: modoEscuro ? "#ffffff" : "#222222",
      fontWeight: "600",
    },

    titulo: {
      fontSize: obterTamanhoFonte(30),
      lineHeight: obterTamanhoFonte(36),
      fontWeight: "bold",
      textAlign: "center",
      color: modoEscuro ? "#ffffff" : "#111111",
      marginBottom: 15,
    },

    descricao: {
      fontSize: obterTamanhoFonte(17),
      lineHeight: obterTamanhoFonte(24),
      textAlign: "center",
      color: modoEscuro ? "#dddddd" : "#444444",
      marginBottom: 25,
    },

    card: {
      width: "100%",
      borderWidth: 1,
      borderColor: modoEscuro ? "#555555" : "#cccccc",
      borderRadius: 12,
      padding: 16,
      marginBottom: 18,
      backgroundColor: modoEscuro ? "#1e1e1e" : "#f8f8f8",
    },

    linha: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 15,
    },

    textosLinha: {
      flex: 1,
    },

    tituloOpcao: {
      fontSize: obterTamanhoFonte(19),
      lineHeight: obterTamanhoFonte(25),
      fontWeight: "bold",
      color: modoEscuro ? "#ffffff" : "#111111",
      marginBottom: 7,
    },

    descricaoOpcao: {
      fontSize: obterTamanhoFonte(15),
      lineHeight: obterTamanhoFonte(21),
      color: modoEscuro ? "#cccccc" : "#555555",
      marginBottom: 15,
    },

    opcaoFonte: {
      width: "100%",
      borderWidth: 1,
      borderColor: modoEscuro ? "#555555" : "#bbbbbb",
      borderRadius: 10,
      padding: 14,
      marginTop: 10,
      backgroundColor: modoEscuro ? "#252525" : "#ffffff",
    },

    opcaoFonteSelecionada: {
      borderWidth: 2,
      borderColor: modoEscuro ? "#ffffff" : "#222222",
    },

    textoOpcaoFonte: {
      fontSize: obterTamanhoFonte(17),
      fontWeight: "bold",
      color: modoEscuro ? "#ffffff" : "#111111",
      marginBottom: 5,
    },

    exemploNormal: {
      fontSize: obterTamanhoFonte(16),
      color: modoEscuro ? "#dddddd" : "#444444",
    },

    exemploGrande: {
      fontSize: obterTamanhoFonte(19),
      color: modoEscuro ? "#dddddd" : "#444444",
    },

    exemploMuitoGrande: {
      fontSize: obterTamanhoFonte(22),
      color: modoEscuro ? "#dddddd" : "#444444",
    },
  });
}

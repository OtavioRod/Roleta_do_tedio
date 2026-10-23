import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import Botao from "../components/Botao";
import CampoFormulario from "../components/CampoFormulario";
import Texto from "../components/Texto";
import { usePreferencias } from "../context/PreferenciasContext";
import { useSessao } from "../context/SessaoContext";
import { firebaseConfigurado } from "../services/firebase";
import { ErroEntradaNativa } from "../services/entradaNativa";
import { codigoErroAuth, mensagemErroAuth } from "../utils/mensagensAuth";
import { validarEmail, validarLogin } from "../utils/validacoes";

export default function Entrar() {
  const router = useRouter();

  const { cores } = usePreferencias();

  const {
    entrar,
    desbloquearComEntradaNativa,
    recuperarSenha,
    motivoEncerramento,
    contaBloqueada,
    entradaNativaDisponivel,
    sair,
  } = useSessao();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erros, setErros] = useState<{ email?: string; senha?: string }>({});
  const [erroGeral, setErroGeral] = useState("");
  const [informacao, setInformacao] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (contaBloqueada?.email) {
      setEmail(contaBloqueada.email);
    }
  }, [contaBloqueada?.uid, contaBloqueada?.email]);

  async function enviar() {
    if (enviando) {
      return;
    }

    const resultado = validarLogin(email, senha);

    if (resultado.email || resultado.senha) {
      setErros(resultado);
      setErroGeral("");
      return;
    }

    setErros({});
    setErroGeral("");
    setInformacao("");
    setEnviando(true);

    try {
      await entrar(email, senha);
      setSenha("");
    } catch (falha) {
      setErroGeral(
        falha instanceof ErroEntradaNativa
          ? falha.message
          : mensagemErroAuth(falha),
      );
      setEnviando(false);
    }
  }

  async function recuperar() {
    const erroEmail = validarEmail(email);

    if (erroEmail) {
      setErros({ email: erroEmail });
      return;
    }

    setErros({});
    setErroGeral("");

    try {
      await recuperarSenha(email);
    } catch (falha) {
      const codigo = codigoErroAuth(falha);

      if (
        codigo === "auth/network-request-failed" ||
        codigo === "auth/too-many-requests"
      ) {
        setErroGeral(mensagemErroAuth(falha));
        return;
      }
    }

    setInformacao(
      "Se existir uma conta com este e-mail, enviamos as instruções para redefinir a senha. Confira também a caixa de spam.",
    );
  }

  async function desbloquearComBiometria() {
    if (enviando) {
      return;
    }

    setErroGeral("");
    setEnviando(true);

    try {
      await desbloquearComEntradaNativa();
      setSenha("");
    } catch (falha) {
      setErroGeral(
        falha instanceof ErroEntradaNativa
          ? falha.message
          : mensagemErroAuth(falha),
      );
      setEnviando(false);
    }
  }

  return (
    <ScrollView
      contentContainerStyle={styles.conteudo}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.coluna}>
        <Texto cabecalho style={styles.titulo}>
          Roleta do Tédio
        </Texto>

        <Texto style={styles.subtitulo}>Entre na sua conta</Texto>

        {motivoEncerramento === "inatividade" && (
          <Texto accessibilityRole="alert" style={styles.aviso}>
            Sua sessão expirou por inatividade. Entre novamente para continuar.
          </Texto>
        )}

        {motivoEncerramento === "segundo-plano" && (
          <Texto accessibilityRole="alert" style={styles.aviso}>
            O aplicativo ficou em segundo plano por tempo demais. Entre com
            sua senha ou use a biometria para desbloquear sua sessão Firebase.
          </Texto>
        )}

        {!firebaseConfigurado() && (
          <Texto accessibilityRole="alert" style={styles.aviso}>
            O Firebase ainda não foi configurado. Confira o arquivo .env.
          </Texto>
        )}

        <CampoFormulario
          rotulo="E-mail"
          valor={email}
          aoMudar={(texto) => {
            setEmail(texto);
            setErros((anteriores) => ({ ...anteriores, email: undefined }));
          }}
          teclado="email-address"
          autoComplete="email"
          erro={erros.email}
        />

        <CampoFormulario
          rotulo="Senha"
          valor={senha}
          aoMudar={(texto) => {
            setSenha(texto);
            setErros((anteriores) => ({ ...anteriores, senha: undefined }));
          }}
          aoEnviar={enviar}
          senha
          autoComplete="current-password"
          erro={erros.senha}
        />

        {contaBloqueada && entradaNativaDisponivel && (
          <>
            <Botao
              titulo={
                enviando ? "Confirmando..." : "Entrar com biometria"
              }
              onPress={desbloquearComBiometria}
              desabilitado={enviando}
              dica="Desbloqueia a sessão Firebase salva neste aparelho após confirmação biométrica."
            />

            <View style={styles.espaco} />
          </>
        )}

        {erroGeral !== "" && (
          <Texto
            accessibilityRole="alert"
            style={[styles.erroGeral, { color: cores.erro }]}
          >
            {erroGeral}
          </Texto>
        )}

        {informacao !== "" && (
          <Texto accessibilityRole="alert" style={styles.informacao}>
            {informacao}
          </Texto>
        )}

        <Botao
          titulo={enviando ? "Entrando..." : "Entrar"}
          onPress={enviar}
          desabilitado={enviando}
        />

        <View style={styles.espaco} />

        <Botao titulo="Esqueci minha senha" secundario onPress={recuperar} />

        <View style={styles.espaco} />

        <Botao
          titulo="Criar uma conta"
          secundario
          onPress={() => router.push("/cadastrar")}
        />

        {contaBloqueada && (
          <>
            <View style={styles.espaco} />

            <Botao
              titulo="Encerrar sessão salva"
              secundario
              onPress={sair}
              dica="Remove do aparelho a sessão Firebase que está bloqueada."
            />
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  conteudo: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 16,
    paddingBottom: 100,
  },

  coluna: {
    width: "100%",
    maxWidth: 480,
    alignSelf: "center",
  },

  titulo: {
    fontSize: 30,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 6,
  },

  subtitulo: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 20,
  },

  aviso: {
    fontSize: 16,
    lineHeight: 22,
    textAlign: "center",
    fontWeight: "600",
    marginBottom: 16,
  },

  erroGeral: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 12,
  },

  informacao: {
    fontSize: 15,
    lineHeight: 21,
    marginBottom: 12,
  },

  espaco: {
    height: 10,
  },
});

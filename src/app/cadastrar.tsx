import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import Botao from "../components/Botao";
import CaixaMarcacao from "../components/CaixaMarcacao";
import CampoFormulario from "../components/CampoFormulario";
import SeletorOpcoes from "../components/SeletorOpcoes";
import Texto from "../components/Texto";
import { Genero, GENEROS } from "../constants/genero";
import { usePreferencias } from "../context/PreferenciasContext";
import { useSessao } from "../context/SessaoContext";
import { firebaseConfigurado } from "../services/firebase";
import { codigoErroAuth, mensagemErroAuth } from "../utils/mensagensAuth";
import {
  ErrosCadastro,
  SENHA_MINIMA,
  validarCadastro,
} from "../utils/validacoes";

export default function Cadastrar() {
  const router = useRouter();

  const { cores } = usePreferencias();

  const { cadastrar } = useSessao();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [genero, setGenero] = useState<Genero | "">("");
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [notificarEmail, setNotificarEmail] = useState(false);
  const [notificarPush, setNotificarPush] = useState(false);
  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [erros, setErros] = useState<ErrosCadastro>({});
  const [erroGeral, setErroGeral] = useState("");
  const [enviando, setEnviando] = useState(false);

  function limpar(campo: keyof ErrosCadastro) {
    setErros((anteriores) => {
      if (!anteriores[campo]) {
        return anteriores;
      }

      const copia = { ...anteriores };

      delete copia[campo];

      return copia;
    });
  }

  async function enviar() {
    if (enviando) {
      return;
    }

    const resultado = validarCadastro({
      nome,
      email,
      genero,
      senha,
      confirmacao,
      aceitouTermos,
    });

    if (Object.keys(resultado).length > 0 || genero === "") {
      setErros(resultado);
      setErroGeral("Corrija os campos destacados e tente de novo.");
      return;
    }

    setErros({});
    setErroGeral("");
    setEnviando(true);

    try {
      await cadastrar({
        nome,
        email,
        senha,
        genero,
        notificarEmail,
        notificarPush,
      });
    } catch (falha) {
      if (codigoErroAuth(falha) === "auth/email-already-in-use") {
        setErros({ email: mensagemErroAuth(falha) });
        setErroGeral("Corrija os campos destacados e tente de novo.");
      } else {
        setErroGeral(mensagemErroAuth(falha));
      }

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
          Criar conta
        </Texto>

        {!firebaseConfigurado() && (
          <Texto accessibilityRole="alert" style={styles.aviso}>
            O Firebase ainda não foi configurado. Confira o arquivo .env.
          </Texto>
        )}

        <CampoFormulario
          rotulo="Nome"
          valor={nome}
          aoMudar={(texto) => {
            setNome(texto);
            limpar("nome");
          }}
          autoComplete="name"
          maxLength={60}
          erro={erros.nome}
        />

        <CampoFormulario
          rotulo="E-mail"
          valor={email}
          aoMudar={(texto) => {
            setEmail(texto);
            limpar("email");
          }}
          teclado="email-address"
          autoComplete="email"
          ajuda="Vamos enviar um e-mail para confirmar este endereço."
          erro={erros.email}
        />

        <SeletorOpcoes
          rotulo="Gênero"
          opcoes={GENEROS}
          valor={genero}
          aoEscolher={(valor) => {
            setGenero(valor);
            limpar("genero");
          }}
          erro={erros.genero}
        />

        <CampoFormulario
          rotulo="Senha"
          valor={senha}
          aoMudar={(texto) => {
            setSenha(texto);
            limpar("senha");
          }}
          senha
          autoComplete="new-password"
          ajuda={`Mínimo de ${SENHA_MINIMA} caracteres, com letras e números.`}
          erro={erros.senha}
        />

        <CampoFormulario
          rotulo="Confirmar senha"
          valor={confirmacao}
          aoMudar={(texto) => {
            setConfirmacao(texto);
            limpar("confirmacao");
          }}
          senha
          autoComplete="new-password"
          erro={erros.confirmacao}
        />

        <Texto cabecalho style={styles.secao}>
          Avisos
        </Texto>

        <CaixaMarcacao
          rotulo="Quero receber avisos por e-mail"
          marcado={notificarEmail}
          aoAlternar={setNotificarEmail}
        />

        <CaixaMarcacao
          rotulo="Quero receber notificações no aparelho"
          marcado={notificarPush}
          aoAlternar={setNotificarPush}
        />

        <Texto style={[styles.nota, { color: cores.textoSecundario }]}>
          Você pode mudar essas escolhas depois. Os avisos só serão enviados se
          você marcar.
        </Texto>

        <CaixaMarcacao
          rotulo="Aceito que o app use meu e-mail, meu gênero e minha localização para funcionar, conforme explicado nesta tela"
          marcado={aceitouTermos}
          aoAlternar={(valor) => {
            setAceitouTermos(valor);
            limpar("aceitouTermos");
          }}
          erro={erros.aceitouTermos}
        />

        <Texto style={[styles.nota, { color: cores.textoSecundario }]}>
          O e-mail serve para entrar e para os avisos. O gênero é opcional
          ("Prefiro não informar"). A localização só é usada na hora de buscar
          lugares perto de você e não é salva no seu perfil.
        </Texto>

        {erroGeral !== "" && (
          <Texto
            accessibilityRole="alert"
            style={[styles.erroGeral, { color: cores.erro }]}
          >
            {erroGeral}
          </Texto>
        )}

        <Botao
          titulo={enviando ? "Criando conta..." : "Criar conta"}
          onPress={enviar}
          desabilitado={enviando}
        />

        <View style={styles.espaco} />

        <Botao
          titulo="Já tenho conta"
          secundario
          onPress={() => router.back()}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  conteudo: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 100,
  },

  coluna: {
    width: "100%",
    maxWidth: 480,
    alignSelf: "center",
  },

  titulo: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },

  secao: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 8,
    marginBottom: 8,
  },

  nota: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 16,
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

  espaco: {
    height: 10,
  },
});

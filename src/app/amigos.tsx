import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import Botao from "../components/Botao";
import CampoFormulario from "../components/CampoFormulario";
import Texto from "../components/Texto";
import { usePreferencias } from "../context/PreferenciasContext";
import { useSessao } from "../context/SessaoContext";
import {
    aceitarAmizade,
    Amizade,
    buscarPorCodigoAmigo,
    observarAmizades,
    obterOuCriarCodigoAmigo,
    PessoaResumo,
    removerAmizade,
    solicitarAmizade,
} from "../services/amigos";
import { formatarCodigoAmigo, normalizarCodigo } from "../utils/codigos";
import { compartilharTexto } from "../utils/compartilhar";
import { mensagemErroSocial } from "../utils/mensagensSociais";

type LinhaProps = {
  nome: string;
  children: React.ReactNode;
};

function Linha({ nome, children }: LinhaProps) {
  const { cores } = usePreferencias();

  return (
    <View
      style={[
        styles.linha,
        { borderColor: cores.borda, backgroundColor: cores.superficie },
      ]}
    >
      <Texto style={styles.nomeLinha}>{nome}</Texto>

      <View style={styles.acoesLinha}>{children}</View>
    </View>
  );
}

export default function Amigos() {
  const router = useRouter();

  const { cores } = usePreferencias();

  const { usuario, perfil } = useSessao();

  const uid = usuario?.uid ?? "";

  const nome = perfil?.nome || usuario?.displayName || "Pessoa";

  const [meuCodigo, setMeuCodigo] = useState("");
  const [amizades, setAmizades] = useState<Amizade[]>([]);
  const [codigoAmigo, setCodigoAmigo] = useState("");
  const [encontrado, setEncontrado] = useState<PessoaResumo | null>(null);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    if (!uid) {
      return undefined;
    }

    let ativo = true;

    obterOuCriarCodigoAmigo(uid, nome)
      .then((codigo) => {
        if (ativo) {
          setMeuCodigo(codigo);
        }
      })
      .catch((falha) => {
        if (ativo) {
          setErro(mensagemErroSocial(falha));
        }
      });

    return () => {
      ativo = false;
    };
  }, [uid, nome]);

  useEffect(() => {
    if (!uid) {
      return undefined;
    }

    return observarAmizades(uid, setAmizades, (falha) =>
      setErro(mensagemErroSocial(falha)),
    );
  }, [uid]);

  async function executar(acao: () => Promise<void>) {
    setOcupado(true);
    setErro("");
    setMensagem("");

    try {
      await acao();
    } catch (falha) {
      setErro(mensagemErroSocial(falha));
    } finally {
      setOcupado(false);
    }
  }

  function procurar() {
    executar(async () => {
      setEncontrado(null);

      const pessoa = await buscarPorCodigoAmigo(codigoAmigo);

      if (!pessoa) {
        throw new Error("amigo-nao-encontrado");
      }

      setEncontrado(pessoa);
    });
  }

  function pedir() {
    if (!encontrado || !usuario) {
      return;
    }

    executar(async () => {
      const resultado = await solicitarAmizade(
        { uid: usuario.uid, nome },
        encontrado,
      );

      setMensagem(
        resultado === "aceita"
          ? `Agora você e ${encontrado.nome} são amigos.`
          : `Pedido enviado para ${encontrado.nome}. Ele precisa aceitar.`,
      );

      setEncontrado(null);
      setCodigoAmigo("");
    });
  }

  async function compartilhar() {
    const resultado = await compartilharTexto(
      `Me adicione na Roleta do Tédio! Meu código de amigo: ${formatarCodigoAmigo(meuCodigo)}`,
    );

    if (resultado === "copiado") {
      setMensagem("Texto copiado. Cole onde quiser.");
    } else if (resultado === "falhou") {
      setErro("Não foi possível compartilhar. Copie o código manualmente.");
    }
  }

  const recebidos = amizades.filter(
    (amizade) => amizade.estado === "pendente" && !amizade.solicitadaPorMim,
  );

  const enviados = amizades.filter(
    (amizade) => amizade.estado === "pendente" && amizade.solicitadaPorMim,
  );

  const amigos = amizades.filter((amizade) => amizade.estado === "aceita");

  return (
    <ScrollView
      contentContainerStyle={styles.conteudo}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.coluna}>
        <Texto cabecalho style={styles.titulo}>
          Meus amigos
        </Texto>

        <Texto cabecalho style={styles.secao}>
          Meu código de amigo
        </Texto>

        <View
          style={[
            styles.cartao,
            { borderColor: cores.borda, backgroundColor: cores.superficie },
          ]}
        >
          <Texto
            style={styles.codigo}
            accessibilityLabel={`Seu código de amigo: ${meuCodigo.split("").join(" ")}`}
          >
            {meuCodigo ? formatarCodigoAmigo(meuCodigo) : "..."}
          </Texto>

          <Texto style={[styles.nota, { color: cores.textoSecundario }]}>
            Passe este código para quem você quer ter como amigo.
          </Texto>

          <Botao
            titulo="Compartilhar meu código"
            onPress={compartilhar}
            desabilitado={meuCodigo === ""}
          />
        </View>

        <Texto cabecalho style={styles.secao}>
          Adicionar um amigo
        </Texto>

        <CampoFormulario
          rotulo="Código do amigo (8 caracteres)"
          valor={codigoAmigo}
          aoMudar={(texto) => {
            setCodigoAmigo(normalizarCodigo(texto).slice(0, 8));
            setEncontrado(null);
            setErro("");
          }}
          aoEnviar={procurar}
          maxLength={8}
        />

        {encontrado ? (
          <View
            style={[
              styles.cartao,
              { borderColor: cores.borda, backgroundColor: cores.superficie },
            ]}
          >
            <Texto style={styles.nomeLinha}>
              Encontramos: {encontrado.nome}
            </Texto>

            <Botao
              titulo={`Enviar pedido para ${encontrado.nome}`}
              onPress={pedir}
              desabilitado={ocupado}
            />
          </View>
        ) : (
          <Botao titulo="Procurar" onPress={procurar} desabilitado={ocupado} />
        )}

        {mensagem !== "" && (
          <Texto accessibilityRole="alert" style={styles.mensagem}>
            {mensagem}
          </Texto>
        )}

        {erro !== "" && (
          <Texto
            accessibilityRole="alert"
            style={[styles.mensagem, { color: cores.erro }]}
          >
            {erro}
          </Texto>
        )}

        {recebidos.length > 0 && (
          <>
            <Texto cabecalho style={styles.secao}>
              Pedidos recebidos
            </Texto>

            {recebidos.map((amizade) => (
              <Linha key={amizade.id} nome={amizade.amigoNome}>
                <Botao
                  titulo="Aceitar"
                  onPress={() => executar(() => aceitarAmizade(amizade.id))}
                  desabilitado={ocupado}
                />

                <Botao
                  titulo="Recusar"
                  secundario
                  onPress={() => executar(() => removerAmizade(amizade.id))}
                  desabilitado={ocupado}
                />
              </Linha>
            ))}
          </>
        )}

        {enviados.length > 0 && (
          <>
            <Texto cabecalho style={styles.secao}>
              Pedidos enviados
            </Texto>

            {enviados.map((amizade) => (
              <Linha
                key={amizade.id}
                nome={`${amizade.amigoNome} (aguardando)`}
              >
                <Botao
                  titulo="Cancelar"
                  secundario
                  onPress={() => executar(() => removerAmizade(amizade.id))}
                  desabilitado={ocupado}
                />
              </Linha>
            ))}
          </>
        )}

        <Texto cabecalho style={styles.secao}>
          Amigos salvos ({amigos.length})
        </Texto>

        {amigos.length === 0 ? (
          <Texto style={[styles.nota, { color: cores.textoSecundario }]}>
            Você ainda não tem amigos salvos.
          </Texto>
        ) : (
          amigos.map((amizade) => (
            <Linha key={amizade.id} nome={amizade.amigoNome}>
              <Botao
                titulo="Remover"
                secundario
                onPress={() => executar(() => removerAmizade(amizade.id))}
                desabilitado={ocupado}
              />
            </Linha>
          ))
        )}

        <View style={styles.espaco} />

        <Botao
          titulo="Ir para as salas"
          onPress={() => router.replace("/salas")}
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
    maxWidth: 520,
    alignSelf: "center",
  },

  titulo: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },

  secao: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
  },

  cartao: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },

  codigo: {
    fontSize: 32,
    fontWeight: "bold",
    letterSpacing: 4,
    textAlign: "center",
    marginBottom: 8,
  },

  nota: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },

  mensagem: {
    fontSize: 15,
    fontWeight: "700",
    marginTop: 12,
  },

  linha: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },

  nomeLinha: {
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 8,
  },

  acoesLinha: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  espaco: {
    height: 20,
  },
});

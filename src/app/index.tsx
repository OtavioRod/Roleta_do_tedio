import { useState } from "react";
import {
  Button,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import ParticipanteItem from "../components/ParticipanteItem";

type Participante = {
  nome: string;
  humor: string;
  gasto: string;
  disposicao: string;
};

export default function Index() {
  const [iniciou, setIniciou] = useState(false);
  const [tipo, setTipo] = useState("");
  const [salaCriada, setSalaCriada] = useState(false);
  const [codigoSala, setCodigoSala] = useState("");
  const [etapa, setEtapa] = useState("tipo");
  const [modoEscuro, setModoEscuro] = useState(false);
  const [nomeParticipante, setNomeParticipante] = useState("");
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [participanteAtual, setParticipanteAtual] = useState(0);

  function comecar() {
    setIniciou(true);
  }

  function escolherTipo(valor: string) {
    setTipo(valor);
  }

  function criarSala() {
    if (nomeParticipante.trim() === "") {
      alert("Digite seu nome antes de criar a sala!");
      return;
    }

    const codigo = Math.random().toString(36).substring(2, 6).toUpperCase();

    const participante: Participante = {
      nome: nomeParticipante.trim(),
      humor: "",
      gasto: "",
      disposicao: "",
    };

    setCodigoSala(codigo);
    setParticipantes([participante]);
    setNomeParticipante("");
    setSalaCriada(true);
  }

  function continuar() {
    const quantidade = participantes.length;

    if (tipo === "sozinho" && quantidade !== 1) {
      alert("No modo sozinho, deve existir exatamente 1 participante.");
      return;
    }

    if (tipo === "casal" && quantidade !== 2) {
      alert("No modo casal, precisamos de 2 participantes.");
      return;
    }

    if (tipo === "amigos" && (quantidade < 2 || quantidade > 10)) {
      alert("No modo amigos, a sala precisa ter entre 2 e 10 participantes.");
      return;
    }

    setParticipanteAtual(0);
    setEtapa("humor");
  }

  function escolherHumor(valor: string) {
    setParticipantes(
      participantes.map((participante, index) =>
        index === participanteAtual
          ? {
              ...participante,
              humor: valor,
            }
          : participante,
      ),
    );

    setEtapa("humorEscolhido");
  }

  function escolherGasto(valor: string) {
    setParticipantes(
      participantes.map((participante, index) =>
        index === participanteAtual
          ? {
              ...participante,
              gasto: valor,
            }
          : participante,
      ),
    );

    setEtapa("gastoEscolhido");
  }

  function escolherDisposicao(valor: string) {
    setParticipantes(
      participantes.map((participante, index) =>
        index === participanteAtual
          ? {
              ...participante,
              disposicao: valor,
            }
          : participante,
      ),
    );

    setEtapa("disposicaoEscolhida");
  }

  function proximoParticipante() {
    if (participanteAtual < participantes.length - 1) {
      setParticipanteAtual(participanteAtual + 1);
      setEtapa("humor");
      return;
    }

    setEtapa("resumo");
  }

  function adicionarParticipante() {
    const nome = nomeParticipante.trim();

    if (nome === "") {
      alert("Digite o nome do participante!");
      return;
    }

    if (participantes.some((participante) => participante.nome === nome)) {
      alert("Esse participante já está na sala!");
      return;
    }

    if (tipo === "sozinho") {
      alert("No modo sozinho, apenas você participa.");
      return;
    }

    if (tipo === "casal" && participantes.length >= 2) {
      alert("O modo casal permite apenas 2 participantes.");
      return;
    }

    if (tipo === "amigos" && participantes.length >= 10) {
      alert("O modo amigos permite no máximo 10 participantes.");
      return;
    }

    const participante: Participante = {
      nome,
      humor: "",
      gasto: "",
      disposicao: "",
    };

    setParticipantes([...participantes, participante]);

    setNomeParticipante("");
  }

  function removerParticipante(nome: string) {
    if (tipo === "sozinho") {
      alert("Você não pode remover o único participante.");
      return;
    }

    setParticipantes(
      participantes.filter((participante) => participante.nome !== nome),
    );
  }

  function alternarTema() {
    setModoEscuro(!modoEscuro);
  }

  function podeContinuar() {
    if (tipo === "sozinho") {
      return participantes.length === 1;
    }

    if (tipo === "casal") {
      return participantes.length === 2;
    }

    if (tipo === "amigos") {
      return participantes.length >= 2 && participantes.length <= 10;
    }

    return false;
  }

  return (
    <View
      style={[
        styles.container,
        modoEscuro ? styles.containerEscuro : styles.containerClaro,
      ]}
    >
      <TouchableOpacity style={styles.botaoTema} onPress={alternarTema}>
        <Text style={styles.iconeTema}>{modoEscuro ? "☀" : "☾"}</Text>
      </TouchableOpacity>

      {!iniciou ? (
        <>
          <Text style={[styles.titulo, modoEscuro && styles.textoEscuro]}>
            Roleta do Tédio
          </Text>

          <Text style={[styles.descricao, modoEscuro && styles.textoEscuro]}>
            Vocês se juntaram e mesmo assim não sabem o que fazer?
          </Text>

          <Button title="Começar" onPress={comecar} />
        </>
      ) : !salaCriada ? (
        <>
          <Text style={[styles.titulo, modoEscuro && styles.textoEscuro]}>
            Quem está jogando?
          </Text>

          <Text style={[styles.descricao, modoEscuro && styles.textoEscuro]}>
            Primeiro precisamos saber como vocês vão jogar.
          </Text>

          <Button title="Casal" onPress={() => escolherTipo("casal")} />

          <View style={styles.espaco} />

          <Button title="Amigos" onPress={() => escolherTipo("amigos")} />

          <View style={styles.espaco} />

          <Button title="Sozinho" onPress={() => escolherTipo("sozinho")} />

          {tipo !== "" && (
            <>
              <Text
                style={[styles.resultado, modoEscuro && styles.textoEscuro]}
              >
                Você escolheu: {tipo}
              </Text>

              <Text
                style={[styles.descricao, modoEscuro && styles.textoEscuro]}
              >
                Antes de criar a sala, diga seu nome.
              </Text>

              <TextInput
                style={[styles.input, modoEscuro && styles.inputEscuro]}
                placeholder="Digite seu nome"
                placeholderTextColor={modoEscuro ? "#aaaaaa" : "#666666"}
                value={nomeParticipante}
                onChangeText={setNomeParticipante}
              />

              <Button title="Criar sala" onPress={criarSala} />
            </>
          )}
        </>
      ) : etapa === "tipo" ? (
        <>
          <Text style={[styles.titulo, modoEscuro && styles.textoEscuro]}>
            Sala criada
          </Text>

          <Text style={[styles.descricao, modoEscuro && styles.textoEscuro]}>
            Compartilhe o código com quem vai jogar.
          </Text>

          <Text style={[styles.codigo, modoEscuro && styles.textoEscuro]}>
            {codigoSala}
          </Text>

          <Text style={[styles.subtitulo, modoEscuro && styles.textoEscuro]}>
            Participantes
          </Text>

          <Text style={[styles.contador, modoEscuro && styles.textoEscuro]}>
            {participantes.length}
            {tipo === "sozinho" && " / 1"}
            {tipo === "casal" && " / 2"}
            {tipo === "amigos" && " / 10"}
          </Text>

          {tipo !== "sozinho" && (
            <>
              <TextInput
                style={[styles.input, modoEscuro && styles.inputEscuro]}
                placeholder="Digite o nome do participante"
                placeholderTextColor={modoEscuro ? "#aaaaaa" : "#666666"}
                value={nomeParticipante}
                onChangeText={setNomeParticipante}
              />

              <Button
                title="Adicionar participante"
                onPress={adicionarParticipante}
              />
            </>
          )}

          <FlatList
            data={participantes}
            keyExtractor={(item, index) => `${item.nome}-${index}`}
            renderItem={({ item }) => (
              <ParticipanteItem
                nome={item.nome}
                onRemover={() => removerParticipante(item.nome)}
              />
            )}
            style={styles.lista}
          />

          {!podeContinuar() && (
            <Text style={[styles.aviso, modoEscuro && styles.textoEscuro]}>
              {tipo === "casal" &&
                "Adicione mais 1 participante para continuar."}

              {tipo === "amigos" &&
                participantes.length < 2 &&
                "Adicione pelo menos mais 1 participante para continuar."}
            </Text>
          )}

          <Button
            title="Continuar"
            onPress={continuar}
            disabled={!podeContinuar()}
          />
        </>
      ) : etapa === "humor" ? (
        <>
          <Text style={[styles.titulo, modoEscuro && styles.textoEscuro]}>
            {participantes[participanteAtual]?.nome}
          </Text>

          <Text style={[styles.descricao, modoEscuro && styles.textoEscuro]}>
            Como você está agora?
          </Text>

          <Text style={[styles.descricao, modoEscuro && styles.textoEscuro]}>
            Seja sincero. A roleta precisa saber com quem está lidando.
          </Text>

          <Button
            title="Com preguiça"
            onPress={() => escolherHumor("preguiça")}
          />

          <View style={styles.espaco} />

          <Button title="Com fome" onPress={() => escolherHumor("fome")} />

          <View style={styles.espaco} />

          <Button title="Animado" onPress={() => escolherHumor("animado")} />

          <View style={styles.espaco} />

          <Button
            title="Tranquilo"
            onPress={() => escolherHumor("tranquilo")}
          />

          <View style={styles.espaco} />

          <Button
            title="Tanto faz"
            onPress={() => escolherHumor("tanto faz")}
          />
        </>
      ) : etapa === "humorEscolhido" ? (
        <>
          <Text style={[styles.titulo, modoEscuro && styles.textoEscuro]}>
            Resposta registrada
          </Text>

          <Text style={[styles.descricao, modoEscuro && styles.textoEscuro]}>
            {participantes[participanteAtual]?.nome}, você está:
          </Text>

          <Text style={[styles.codigo, modoEscuro && styles.textoEscuro]}>
            {participantes[participanteAtual]?.humor}
          </Text>

          <Text style={[styles.descricao, modoEscuro && styles.textoEscuro]}>
            Agora vamos descobrir o quanto você está disposto a gastar.
          </Text>

          <Button title="Continuar" onPress={() => setEtapa("gasto")} />
        </>
      ) : etapa === "gasto" ? (
        <>
          <Text style={[styles.titulo, modoEscuro && styles.textoEscuro]}>
            Quanto você pretende gastar?
          </Text>

          <Text style={[styles.descricao, modoEscuro && styles.textoEscuro]}>
            Pode ser sincero. A roleta não vai julgar.
          </Text>

          <Button
            title="R$ 0 — Quero gastar nada"
            onPress={() => escolherGasto("nada")}
          />

          <View style={styles.espaco} />

          <Button title="Até R$ 30" onPress={() => escolherGasto("até 30")} />

          <View style={styles.espaco} />

          <Button title="Até R$ 60" onPress={() => escolherGasto("até 60")} />

          <View style={styles.espaco} />

          <Button title="Até R$ 100" onPress={() => escolherGasto("até 100")} />

          <View style={styles.espaco} />

          <Button
            title="Hoje eu posso gastar"
            onPress={() => escolherGasto("sem limite definido")}
          />
        </>
      ) : etapa === "gastoEscolhido" ? (
        <>
          <Text style={[styles.titulo, modoEscuro && styles.textoEscuro]}>
            Resposta registrada
          </Text>

          <Text style={[styles.descricao, modoEscuro && styles.textoEscuro]}>
            {participantes[participanteAtual]?.nome}, seu orçamento é:
          </Text>

          <Text style={[styles.codigo, modoEscuro && styles.textoEscuro]}>
            {participantes[participanteAtual]?.gasto}
          </Text>

          <Text style={[styles.descricao, modoEscuro && styles.textoEscuro]}>
            Agora vamos descobrir sua disposição.
          </Text>

          <Button title="Continuar" onPress={() => setEtapa("disposicao")} />
        </>
      ) : etapa === "disposicao" ? (
        <>
          <Text style={[styles.titulo, modoEscuro && styles.textoEscuro]}>
            Qual é a sua disposição?
          </Text>

          <Text style={[styles.descricao, modoEscuro && styles.textoEscuro]}>
            O quanto você está disposto a fazer alguma coisa hoje?
          </Text>

          <Button
            title="Pouca disposição"
            onPress={() => escolherDisposicao("baixa")}
          />

          <View style={styles.espaco} />

          <Button
            title="Disposto"
            onPress={() => escolherDisposicao("media")}
          />

          <View style={styles.espaco} />

          <Button
            title="Muito disposto"
            onPress={() => escolherDisposicao("alta")}
          />
        </>
      ) : etapa === "disposicaoEscolhida" ? (
        <>
          <Text style={[styles.titulo, modoEscuro && styles.textoEscuro]}>
            Resposta registrada
          </Text>

          <Text style={[styles.descricao, modoEscuro && styles.textoEscuro]}>
            {participantes[participanteAtual]?.nome}, sua disposição é:
          </Text>

          <Text style={[styles.codigo, modoEscuro && styles.textoEscuro]}>
            {participantes[participanteAtual]?.disposicao}
          </Text>

          <Text style={[styles.descricao, modoEscuro && styles.textoEscuro]}>
            {participanteAtual < participantes.length - 1
              ? "Agora é a vez do próximo participante."
              : "Todos os participantes já responderam."}
          </Text>

          <Button
            title={
              participanteAtual < participantes.length - 1
                ? "Próximo participante"
                : "Ver respostas"
            }
            onPress={proximoParticipante}
          />
        </>
      ) : (
        <>
          <Text style={[styles.titulo, modoEscuro && styles.textoEscuro]}>
            Respostas
          </Text>

          <Text style={[styles.descricao, modoEscuro && styles.textoEscuro]}>
            Agora já sabemos um pouco mais sobre vocês.
          </Text>

          <FlatList
            data={participantes}
            keyExtractor={(item, index) => `${item.nome}-${index}`}
            renderItem={({ item }) => (
              <View style={styles.resposta}>
                <Text
                  style={[
                    styles.nomeResposta,
                    modoEscuro && styles.textoEscuro,
                  ]}
                >
                  {item.nome}
                </Text>

                <Text
                  style={[
                    styles.textoResposta,
                    modoEscuro && styles.textoEscuro,
                  ]}
                >
                  Humor: {item.humor}
                </Text>

                <Text
                  style={[
                    styles.textoResposta,
                    modoEscuro && styles.textoEscuro,
                  ]}
                >
                  Gasto: {item.gasto}
                </Text>

                <Text
                  style={[
                    styles.textoResposta,
                    modoEscuro && styles.textoEscuro,
                  ]}
                >
                  Disposição: {item.disposicao}
                </Text>
              </View>
            )}
            style={styles.lista}
          />

          <Button title="Continuar" onPress={() => alert("Próxima etapa")} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 30,
  },

  containerClaro: {
    backgroundColor: "#ffffff",
  },

  containerEscuro: {
    backgroundColor: "#121212",
  },

  titulo: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 15,
  },

  descricao: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 20,
  },

  subtitulo: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 5,
  },

  contador: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 15,
  },

  textoEscuro: {
    color: "#ffffff",
  },

  espaco: {
    height: 10,
  },

  resultado: {
    fontSize: 18,
    marginTop: 20,
    marginBottom: 20,
    textAlign: "center",
  },

  codigo: {
    fontSize: 42,
    fontWeight: "bold",
    textAlign: "center",
    letterSpacing: 8,
    marginVertical: 20,
  },

  input: {
    borderWidth: 1,
    borderColor: "#999999",
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 18,
  },

  inputEscuro: {
    color: "#ffffff",
    borderColor: "#666666",
  },

  lista: {
    maxHeight: 180,
    marginTop: 15,
    marginBottom: 15,
  },

  aviso: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 10,
  },

  resposta: {
    borderWidth: 1,
    borderColor: "#999999",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },

  nomeResposta: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },

  textoResposta: {
    fontSize: 16,
    marginBottom: 3,
  },

  botaoTema: {
    position: "absolute",
    bottom: 25,
    right: 25,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#eeeeee",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },

  iconeTema: {
    fontSize: 26,
  },
});

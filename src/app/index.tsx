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

export default function Index() {
  const [iniciou, setIniciou] = useState(false);

  const [tipo, setTipo] = useState("");
  const [humor, setHumor] = useState("");
  const [gasto, setGasto] = useState("");

  const [salaCriada, setSalaCriada] = useState(false);
  const [codigoSala, setCodigoSala] = useState("");

  const [etapa, setEtapa] = useState("tipo");

  const [modoEscuro, setModoEscuro] = useState(false);

  const [nomeParticipante, setNomeParticipante] = useState("");
  const [participantes, setParticipantes] = useState<string[]>([]);

  function comecar() {
    setIniciou(true);
  }

  function escolherTipo(valor: string) {
    setTipo(valor);
  }

  function obterLimiteParticipantes() {
    if (tipo === "sozinho") {
      return 1;
    }

    if (tipo === "casal") {
      return 2;
    }

    return 10;
  }

  function criarSala() {
    const codigo = Math.random().toString(36).substring(2, 6).toUpperCase();

    setCodigoSala(codigo);
    setSalaCriada(true);
  }

  function continuar() {
    setEtapa("humor");
  }

  function continuarSala() {
    const quantidade = participantes.length;

    if (tipo === "sozinho" && quantidade !== 1) {
      alert("Você precisa adicionar seu nome para continuar.");
      return;
    }

    if (tipo === "casal" && quantidade !== 2) {
      alert("Um casal precisa ter 2 participantes.");
      return;
    }

    if (tipo === "amigos" && (quantidade < 2 || quantidade > 10)) {
      alert("A sala de amigos precisa ter entre 2 e 10 participantes.");
      return;
    }

    continuar();
  }

  function escolherHumor(valor: string) {
    setHumor(valor);
    setEtapa("humorEscolhido");
  }

  function escolherGasto(valor: string) {
    setGasto(valor);
    setEtapa("gastoEscolhido");
  }

  function adicionarParticipante() {
    if (nomeParticipante.trim() === "") {
      alert("Digite o nome do participante!");
      return;
    }

    const limite = obterLimiteParticipantes();

    if (participantes.length >= limite) {
      alert(`Essa sala permite no máximo ${limite} participante(s).`);
      return;
    }

    setParticipantes([...participantes, nomeParticipante.trim()]);

    setNomeParticipante("");
  }

  function removerParticipante(nome: string) {
    setParticipantes(
      participantes.filter((participante) => participante !== nome),
    );
  }

  function alternarTema() {
    setModoEscuro(!modoEscuro);
  }

  return (
    <View
      style={[
        styles.container,
        modoEscuro ? styles.containerEscuro : styles.containerClaro,
      ]}
    >
      {/* BOTÃO DE TEMA */}

      <TouchableOpacity style={styles.botaoTema} onPress={alternarTema}>
        <Text style={styles.iconeTema}>{modoEscuro ? "☀" : "☾"}</Text>
      </TouchableOpacity>

      {/* TELA INICIAL */}

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
          {/* ESCOLHA DO TIPO */}

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

              <View style={styles.espaco} />

              <Button title="Criar sala" onPress={criarSala} />
            </>
          )}
        </>
      ) : etapa === "tipo" ? (
        <>
          {/* SALA */}

          <Text style={[styles.titulo, modoEscuro && styles.textoEscuro]}>
            Sala criada
          </Text>

          <Text style={[styles.descricao, modoEscuro && styles.textoEscuro]}>
            Compartilhe o código com quem vai jogar.
          </Text>

          <Text style={[styles.codigo, modoEscuro && styles.textoEscuro]}>
            {codigoSala}
          </Text>

          {/* PARTICIPANTES */}

          <Text style={[styles.subtitulo, modoEscuro && styles.textoEscuro]}>
            Participantes
          </Text>

          <Text style={[styles.descricao, modoEscuro && styles.textoEscuro]}>
            {tipo === "sozinho"
              ? "Você vai jogar sozinho."
              : tipo === "casal"
                ? "A sala precisa ter 2 participantes."
                : "A sala pode ter de 2 a 10 participantes."}
          </Text>

          <TextInput
            style={[styles.input, modoEscuro && styles.inputEscuro]}
            placeholder="Digite seu nome"
            placeholderTextColor={modoEscuro ? "#aaaaaa" : "#666666"}
            value={nomeParticipante}
            onChangeText={setNomeParticipante}
          />

          <Button
            title="Adicionar participante"
            onPress={adicionarParticipante}
          />

          <FlatList
            data={participantes}
            keyExtractor={(item, index) => `${item}-${index}`}
            renderItem={({ item }) => (
              <ParticipanteItem
                nome={item}
                onRemover={() => removerParticipante(item)}
              />
            )}
            style={styles.lista}
          />

          <Text style={[styles.resultado, modoEscuro && styles.textoEscuro]}>
            {participantes.length} participante(s)
          </Text>

          <Button title="Continuar" onPress={continuarSala} />
        </>
      ) : etapa === "humor" ? (
        <>
          {/* ESCOLHA DO HUMOR */}

          <Text style={[styles.titulo, modoEscuro && styles.textoEscuro]}>
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
          {/* HUMOR ESCOLHIDO */}

          <Text style={[styles.titulo, modoEscuro && styles.textoEscuro]}>
            Resposta registrada
          </Text>

          <Text style={[styles.descricao, modoEscuro && styles.textoEscuro]}>
            Você está:
          </Text>

          <Text style={[styles.codigo, modoEscuro && styles.textoEscuro]}>
            {humor}
          </Text>

          <Text style={[styles.descricao, modoEscuro && styles.textoEscuro]}>
            Agora vamos descobrir o quanto você está disposto a gastar.
          </Text>

          <Button title="Continuar" onPress={() => setEtapa("gasto")} />
        </>
      ) : etapa === "gasto" ? (
        <>
          {/* ESCOLHA DO ORÇAMENTO */}

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
      ) : (
        <>
          {/* ORÇAMENTO ESCOLHIDO */}

          <Text style={[styles.titulo, modoEscuro && styles.textoEscuro]}>
            Tudo certo
          </Text>

          <Text style={[styles.descricao, modoEscuro && styles.textoEscuro]}>
            Seu orçamento:
          </Text>

          <Text style={[styles.codigo, modoEscuro && styles.textoEscuro]}>
            {gasto}
          </Text>

          <Text style={[styles.descricao, modoEscuro && styles.textoEscuro]}>
            Agora já sabemos um pouco mais sobre vocês.
          </Text>

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

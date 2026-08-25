import { useState } from "react";

import { Button, StyleSheet, Text, View } from "react-native";

export default function Index() {
  const [iniciou, setIniciou] = useState(false);
  const [tipo, setTipo] = useState("");
  const [humor, setHumor] = useState("");

  function comecar() {
    setIniciou(true);
  }

  function escolherTipo(valor: string) {
    setTipo(valor);
  }

  function escolherHumor(valor: string) {
    setHumor(valor);
  }

  return (
    <View style={styles.container}>
      {!iniciou ? (
        <>
          <Text style={styles.titulo}>Roleta do Tédio</Text>

          <Text style={styles.descricao}>
            Vocês se juntaram e mesmo assim não sabem o que fazer?
          </Text>

          <Button title="Começar" onPress={comecar} />
        </>
      ) : (
        <>
          <Text style={styles.titulo}>Quem está jogando?</Text>

          <Text style={styles.descricao}>
            Isso vai ajudar a gente a escolher o nível certo.
          </Text>

          <Button title="Casal" onPress={() => escolherTipo("casal")} />

          <View style={styles.espaco} />

          <Button title="Amigos" onPress={() => escolherTipo("amigos")} />

          <View style={styles.espaco} />

          <Button title="Sozinho" onPress={() => escolherTipo("sozinho")} />

          <Text style={styles.resultado}>
            {tipo !== "" ? `Você escolheu: ${tipo}` : ""}
          </Text>

          {tipo !== "" && (
            <>
              <Text style={styles.titulo}>Como você está agora?</Text>

              <Text style={styles.descricao}>
                Seja sincero. A roleta precisa saber com quem está lidando.
              </Text>

              <Button
                title="Com preguiça"
                onPress={() => escolherHumor("preguiça")}
              />

              <View style={styles.espaco} />

              <Button title="Com fome" onPress={() => escolherHumor("fome")} />

              <View style={styles.espaco} />

              <Button
                title="Animado"
                onPress={() => escolherHumor("animado")}
              />

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

              <Text style={styles.resultado}>
                {humor !== "" ? `Humor escolhido: ${humor}` : ""}
              </Text>
            </>
          )}
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

  espaco: {
    height: 10,
  },

  resultado: {
    fontSize: 18,
    marginTop: 20,
    marginBottom: 20,
    textAlign: "center",
  },
});

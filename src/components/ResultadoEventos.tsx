import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Evento = {
  id: string;
  nome: string;
  descricao?: string;
  data: string;
  horario?: string;
  local: string;
  endereco?: string;
  categoria?: string;
  preco?: string;
  url?: string;
};

type Props = {
  eventos: Evento[];
  titulo?: string;
  subtitulo?: string;
  onSelecionarEvento?: (evento: Evento) => void;
};

export default function ResultadoEventos({
  eventos,
  titulo = "O que está acontecendo por aí?",
  subtitulo = "Veja alguns eventos que podem combinar com o momento.",
  onSelecionarEvento,
}: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>{titulo}</Text>

      <Text style={styles.subtitulo}>{subtitulo}</Text>

      {eventos.length === 0 ? (
        <View style={styles.semEventos}>
          <Text style={styles.semEventosTitulo}>
            Não encontramos eventos no momento.
          </Text>

          <Text style={styles.semEventosTexto}>
            Isso pode acontecer quando não existem eventos cadastrados para a
            região ou quando a fonte de eventos não está disponível.
          </Text>
        </View>
      ) : (
        <View style={styles.lista}>
          {eventos.map((evento) => (
            <View key={evento.id} style={styles.card}>
              <Text style={styles.nome}>{evento.nome}</Text>

              {evento.categoria && (
                <View style={styles.categoria}>
                  <Text style={styles.textoCategoria}>{evento.categoria}</Text>
                </View>
              )}

              <View style={styles.informacoes}>
                <Text style={styles.informacao}>Data: {evento.data}</Text>

                {evento.horario && (
                  <Text style={styles.informacao}>
                    Horário: {evento.horario}
                  </Text>
                )}

                <Text style={styles.informacao}>Local: {evento.local}</Text>

                {evento.endereco && (
                  <Text style={styles.informacao}>
                    Endereço: {evento.endereco}
                  </Text>
                )}

                {evento.preco && (
                  <Text style={styles.informacao}>Preço: {evento.preco}</Text>
                )}
              </View>

              {evento.descricao && (
                <Text style={styles.descricao}>{evento.descricao}</Text>
              )}

              {onSelecionarEvento && (
                <TouchableOpacity
                  style={styles.botao}
                  onPress={() => onSelecionarEvento(evento)}
                >
                  <Text style={styles.textoBotao}>Escolher este evento</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginTop: 20,
  },

  titulo: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 6,
  },

  subtitulo: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 15,
  },

  lista: {
    width: "100%",
  },

  card: {
    borderWidth: 1,
    borderColor: "#cccccc",
    borderRadius: 10,
    padding: 15,
    marginBottom: 12,
  },

  nome: {
    fontSize: 19,
    fontWeight: "bold",
    marginBottom: 8,
  },

  categoria: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#cccccc",
    borderRadius: 15,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
  },

  textoCategoria: {
    fontSize: 13,
  },

  informacoes: {
    marginBottom: 10,
  },

  informacao: {
    fontSize: 14,
    marginBottom: 5,
  },

  descricao: {
    fontSize: 15,
    lineHeight: 21,
    marginBottom: 12,
  },

  botao: {
    backgroundColor: "#222222",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 4,
  },

  textoBotao: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "bold",
  },

  semEventos: {
    borderWidth: 1,
    borderColor: "#cccccc",
    borderRadius: 10,
    padding: 16,
  },

  semEventosTitulo: {
    fontSize: 17,
    fontWeight: "bold",
    marginBottom: 8,
  },

  semEventosTexto: {
    fontSize: 15,
    lineHeight: 21,
  },
});

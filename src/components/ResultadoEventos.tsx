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
    <View style={styles.areaResultado}>
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
                    <Text style={styles.textoCategoria}>
                      {evento.categoria}
                    </Text>
                  </View>
                )}

                <View style={styles.informacoes}>
                  <View style={styles.informacaoBloco}>
                    <Text style={styles.informacaoLabel}>Data</Text>

                    <Text style={styles.informacao}>{evento.data}</Text>
                  </View>

                  {evento.horario && (
                    <View style={styles.informacaoBloco}>
                      <Text style={styles.informacaoLabel}>Horário</Text>

                      <Text style={styles.informacao}>{evento.horario}</Text>
                    </View>
                  )}

                  <View style={styles.informacaoBloco}>
                    <Text style={styles.informacaoLabel}>Local</Text>

                    <Text style={styles.informacao}>{evento.local}</Text>
                  </View>

                  {evento.endereco && (
                    <View style={styles.informacaoBloco}>
                      <Text style={styles.informacaoLabel}>Endereço</Text>

                      <Text style={styles.informacao}>{evento.endereco}</Text>
                    </View>
                  )}

                  {evento.preco && (
                    <View style={styles.informacaoBloco}>
                      <Text style={styles.informacaoLabel}>Preço</Text>

                      <Text style={styles.informacao}>{evento.preco}</Text>
                    </View>
                  )}
                </View>

                {evento.descricao && (
                  <Text style={styles.descricao}>{evento.descricao}</Text>
                )}

                {onSelecionarEvento && (
                  <TouchableOpacity
                    style={styles.botao}
                    onPress={() => onSelecionarEvento(evento)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.textoBotao}>Escolher este evento</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  areaResultado: {
    width: "100%",
    maxWidth: 900,
    alignSelf: "center",
    minWidth: 0,
  },

  container: {
    width: "100%",
    minWidth: 0,
    marginTop: 20,
    paddingBottom: 30,
  },

  titulo: {
    width: "100%",
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "800",
    marginBottom: 7,
    color: "#171717",
    flexShrink: 1,
  },

  subtitulo: {
    width: "100%",
    fontSize: 16,
    lineHeight: 23,
    marginBottom: 18,
    color: "#555555",
    flexShrink: 1,
  },

  lista: {
    width: "100%",
    minWidth: 0,
  },

  card: {
    width: "100%",
    minWidth: 0,
    borderWidth: 1,
    borderColor: "#dddddd",
    borderRadius: 14,
    padding: 18,
    marginBottom: 14,
    backgroundColor: "#ffffff",
  },

  nome: {
    width: "100%",
    fontSize: 21,
    lineHeight: 27,
    fontWeight: "800",
    marginBottom: 9,
    color: "#171717",
    flexShrink: 1,
  },

  categoria: {
    alignSelf: "flex-start",
    maxWidth: "100%",
    borderWidth: 1,
    borderColor: "#d2d2d2",
    borderRadius: 16,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginBottom: 13,
    backgroundColor: "#fafafa",
  },

  textoCategoria: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "700",
    color: "#555555",
    flexShrink: 1,
  },

  informacoes: {
    width: "100%",
    minWidth: 0,
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 8,
  },

  informacaoBloco: {
    minWidth: 150,
    maxWidth: "100%",
    marginRight: 24,
    marginBottom: 12,
    flexShrink: 1,
  },

  informacaoLabel: {
    fontSize: 11,
    lineHeight: 16,
    color: "#777777",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 3,
  },

  informacao: {
    width: "100%",
    fontSize: 14,
    lineHeight: 20,
    color: "#333333",
    flexShrink: 1,
  },

  descricao: {
    width: "100%",
    fontSize: 15,
    lineHeight: 22,
    color: "#444444",
    marginBottom: 13,
    flexShrink: 1,
  },

  botao: {
    width: "100%",
    minHeight: 46,
    backgroundColor: "#222222",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },

  textoBotao: {
    width: "100%",
    color: "#ffffff",
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "700",
    textAlign: "center",
    flexShrink: 1,
  },

  semEventos: {
    width: "100%",
    minWidth: 0,
    borderWidth: 1,
    borderColor: "#dddddd",
    borderRadius: 14,
    padding: 18,
    backgroundColor: "#ffffff",
  },

  semEventosTitulo: {
    width: "100%",
    fontSize: 18,
    lineHeight: 23,
    fontWeight: "800",
    marginBottom: 8,
    color: "#222222",
    flexShrink: 1,
  },

  semEventosTexto: {
    width: "100%",
    fontSize: 15,
    lineHeight: 22,
    color: "#555555",
    flexShrink: 1,
  },
});

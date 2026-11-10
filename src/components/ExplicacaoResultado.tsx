import { StyleSheet, View } from "react-native";

import { usePreferencias } from "../context/PreferenciasContext";
import { Atividade } from "../data/atividades";
import { explicarResultado, ParticipanteGrupo } from "../utils/recomendacao";
import { estiloPainel } from "./Painel";
import Texto from "./Texto";

type Props = {
  participantes: ParticipanteGrupo[];
  atividade: Atividade;
  semFiltro: boolean;
  ocultarNomes?: boolean;
};

export default function ExplicacaoResultado({
  participantes,
  atividade,
  semFiltro,
  ocultarNomes = false,
}: Props) {
  const { cores } = usePreferencias();

  const linhas = explicarResultado(
    participantes,
    atividade,
    semFiltro,
    ocultarNomes,
  );

  if (linhas.length === 0) {
    return null;
  }

  return (
    <View style={[styles.caixa, estiloPainel(cores, true)]}>
      <Texto cabecalho style={styles.titulo}>
        Por que a roleta escolheu isso?
      </Texto>

      {linhas.map((linha) => (
        <Texto key={linha} style={styles.linha}>
          • {linha}
        </Texto>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  caixa: {
    width: "100%",
    padding: 16,
    marginBottom: 20,
    marginRight: 6,
  },

  titulo: {
    fontSize: 17,
    fontWeight: "bold",
    marginBottom: 8,
  },

  linha: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 6,
  },
});

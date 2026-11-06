import { StyleSheet, View } from "react-native";

import { usePreferencias } from "../context/PreferenciasContext";
import { MembroSala, VotoSala } from "../services/salas";
import Botao from "./Botao";
import Texto from "./Texto";

type Props = {
  tentativa: number;
  atividadesVetadas: string[];
  membros: MembroSala[];
  meuVoto: VotoSala | null;
  ocupado: boolean;
  aoVotar: (valor: "topo" | "nao") => void;
};

export default function VotacaoResultado({
  tentativa,
  atividadesVetadas,
  membros,
  meuVoto,
  ocupado,
  aoVotar,
}: Props) {
  const { cores } = usePreferencias();

  const votaram = membros.filter(
    (membro) => membro.voto !== null && membro.voto.tentativa === tentativa,
  ).length;

  const jaVotei = meuVoto !== null && meuVoto.tentativa === tentativa;

  return (
    <View style={[styles.caixa, { borderColor: cores.borda }]}>
      <Texto cabecalho style={styles.titulo}>
        O grupo topa?
      </Texto>

      {atividadesVetadas.length > 0 && (
        <Texto style={styles.texto}>
          Já foram recusadas nesta rodada: {atividadesVetadas.length}. A roleta
          não vai repetir essas.
        </Texto>
      )}

      {jaVotei ? (
        <Texto style={styles.texto} accessibilityRole="alert">
          Você votou {meuVoto?.valor === "topo" ? "“topamos”" : "“girar de novo”"}.
          Esperando os outros ({votaram} de {membros.length} já votaram).
        </Texto>
      ) : (
        <>
          <Texto style={styles.texto}>
            Mais da metade precisa topar. Se não der, a roleta gira de novo sem
            essa atividade.
          </Texto>

          <View style={styles.botao}>
            <Botao
              titulo="Topamos!"
              onPress={() => aoVotar("topo")}
              desabilitado={ocupado}
            />
          </View>

          <Botao
            titulo="Girar de novo (vetar)"
            secundario
            onPress={() => aoVotar("nao")}
            desabilitado={ocupado}
          />

          <Texto style={styles.contagem}>
            {votaram} de {membros.length} já votaram
          </Texto>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  caixa: {
    width: "100%",
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },

  titulo: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },

  texto: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
    textAlign: "center",
  },

  botao: {
    marginBottom: 10,
  },

  contagem: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 10,
  },
});

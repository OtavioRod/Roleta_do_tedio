import { StyleSheet, View } from "react-native";

import { usePreferencias } from "../context/PreferenciasContext";
import { StatusHorario } from "../utils/horarioFuncionamento";
import Texto from "./Texto";

type BadgeHorarioProps = {
  status: StatusHorario;
  minutosDisponiveis?: number;
};

export default function BadgeHorario({
  status,
  minutosDisponiveis,
}: BadgeHorarioProps) {
  const { cores, modoEscuro } = usePreferencias();

  const cor =
    status.estado === "aberto"
      ? modoEscuro
        ? "#81c784"
        : "#1b5e20"
      : status.estado === "fechado"
        ? cores.erro
        : cores.textoSecundario;

  const simbolo =
    status.estado === "aberto" ? "●" : status.estado === "fechado" ? "○" : "?";

  const fechaAntes =
    minutosDisponiveis !== undefined &&
    status.estado === "aberto" &&
    status.fechaEmMinutos !== undefined &&
    status.fechaEmMinutos < minutosDisponiveis;

  return (
    <View
      style={styles.container}
      accessible
      accessibilityLabel={`${status.texto}${status.parcial ? ". Feriados não verificados" : ""}${fechaAntes ? ". Fecha antes do tempo de vocês" : ""}`}
    >
      <Texto style={[styles.texto, { color: cor }]}>
        {simbolo} {status.texto}
      </Texto>

      {fechaAntes && (
        <Texto style={[styles.aviso, { color: cores.erro }]}>
          Fecha antes do tempo de vocês.
        </Texto>
      )}

      {status.parcial && (
        <Texto style={[styles.aviso, { color: cores.textoSecundario }]}>
          Feriados não verificados.
        </Texto>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },

  texto: {
    fontSize: 15,
    fontWeight: "600",
  },

  aviso: {
    fontSize: 13,
    marginTop: 2,
  },
});

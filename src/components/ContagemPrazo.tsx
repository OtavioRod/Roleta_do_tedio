import { useEffect, useState } from "react";
import { StyleSheet } from "react-native";

import Texto from "./Texto";

type Props = {
  prazoEm: number;
};

function formatar(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000));

  const minutos = Math.floor(total / 60);
  const segundos = total % 60;

  return `${String(minutos).padStart(2, "0")}:${String(segundos).padStart(2, "0")}`;
}

export default function ContagemPrazo({ prazoEm }: Props) {
  const [agora, setAgora] = useState(Date.now());

  useEffect(() => {
    if (prazoEm <= 0) {
      return undefined;
    }

    const intervalo = setInterval(() => setAgora(Date.now()), 1000);

    return () => clearInterval(intervalo);
  }, [prazoEm]);

  if (prazoEm <= 0) {
    return null;
  }

  const restante = prazoEm - agora;

  return (
    <Texto
      style={styles.texto}
      accessibilityLabel={
        restante > 0
          ? `Faltam ${Math.ceil(restante / 60000)} minutos para o fim do prazo`
          : "O prazo da rodada acabou"
      }
    >
      {restante > 0
        ? `Tempo restante da rodada: ${formatar(restante)}`
        : "O prazo da rodada acabou"}
    </Texto>
  );
}

const styles = StyleSheet.create({
  texto: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 14,
  },
});

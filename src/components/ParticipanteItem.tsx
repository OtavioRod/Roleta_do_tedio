import { View } from "react-native";

import Texto from "./Texto";
import TouchableLibras from "./TouchableLibras";

type Props = {
  nome: string;
  onRemover: () => void;
};

export default function ParticipanteItem({ nome, onRemover }: Props) {
  return (
    <View>
      <Texto>{nome}</Texto>

      <TouchableLibras textoTraducao="Remover" onPress={onRemover}>
        <Texto librasIgnorado>Remover</Texto>
      </TouchableLibras>
    </View>
  );
}

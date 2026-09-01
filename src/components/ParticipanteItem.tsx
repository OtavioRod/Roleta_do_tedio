import { Text, TouchableOpacity, View } from "react-native";

type Props = {
  nome: string;
  onRemover: () => void;
};

export default function ParticipanteItem({ nome, onRemover }: Props) {
  return (
    <View>
      <Text>{nome}</Text>

      <TouchableOpacity onPress={onRemover}>
        <Text>Remover</Text>
      </TouchableOpacity>
    </View>
  );
}

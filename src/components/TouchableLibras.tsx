import type { ComponentRef } from "react";
import {
  TouchableOpacity,
  type TouchableOpacityProps,
} from "react-native";

import { useVLibrasTouch } from "../hooks/useVLibrasTouch";

type TouchableLibrasProps = TouchableOpacityProps & {
  textoTraducao: string;
};

export default function TouchableLibras({
  textoTraducao,
  onPress,
  ...props
}: TouchableLibrasProps) {
  const { ref, onPress: onPressTraduzir } =
    useVLibrasTouch<ComponentRef<typeof TouchableOpacity>>(
      textoTraducao,
      onPress,
    );

  return (
    <TouchableOpacity
      {...props}
      ref={ref}
      onPress={onPressTraduzir}
    />
  );
}

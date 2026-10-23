import {
  useVLibrasTouchableWrapper,
  type UseVLibrasTouchableWrapperReturn,
} from "react-native-vlibras";
import type { GestureResponderEvent, NativeMethods } from "react-native";

export function useVLibrasTouch<TRef extends NativeMethods>(
  text: string,
  onPress?: (event: GestureResponderEvent) => void,
): UseVLibrasTouchableWrapperReturn<TRef> {
  return useVLibrasTouchableWrapper<TRef>({ text, onPress });
}

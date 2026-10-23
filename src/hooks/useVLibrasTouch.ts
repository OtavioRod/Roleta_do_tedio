import type { GestureResponderEvent, NativeMethods } from "react-native";
import type { RefObject } from "react";

export type VLibrasTouchResult<TRef extends NativeMethods> = {
  ref?: RefObject<TRef | null>;
  onPress?: (event: GestureResponderEvent) => void;
};

export function useVLibrasTouch<TRef extends NativeMethods>(
  _text: string,
  onPress?: (event: GestureResponderEvent) => void,
): VLibrasTouchResult<TRef> {
  return { onPress };
}

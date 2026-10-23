import { useLayoutEffect, type ReactNode } from "react";
import { VLibrasProvider, useVLibras } from "react-native-vlibras";

import { usePreferencias } from "../context/PreferenciasContext";

function SincronizarVLibras() {
  const { libras } = usePreferencias();
  const { setFabEnabled, setTranslationEnabled } = useVLibras();

  useLayoutEffect(() => {
    setFabEnabled(libras);
    if (!libras) {
      setTranslationEnabled(false);
    }
  }, [libras, setFabEnabled, setTranslationEnabled]);

  return null;
}

export default function VLibrasAppProvider({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <VLibrasProvider>
      <SincronizarVLibras />
      {children}
    </VLibrasProvider>
  );
}

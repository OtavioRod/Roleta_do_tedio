import AsyncStorage from "@react-native-async-storage/async-storage";
import {
    createContext,
    ReactNode,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";

type TamanhoFonte = "normal" | "grande" | "muitoGrande";

type AccessibilityContextData = {
  modoEscuro: boolean;
  tamanhoFonte: TamanhoFonte;
  carregandoPreferencias: boolean;

  alternarTema: () => void;
  definirTema: (modoEscuro: boolean) => void;
  definirTamanhoFonte: (tamanho: TamanhoFonte) => void;

  obterTamanhoFonte: (tamanhoBase: number) => number;
};

type AccessibilityProviderProps = {
  children: ReactNode;
};

const CHAVE_PREFERENCIAS = "@roleta_do_tedio:preferencias";

const AccessibilityContext = createContext<
  AccessibilityContextData | undefined
>(undefined);

export function AccessibilityProvider({
  children,
}: AccessibilityProviderProps) {
  const [modoEscuro, setModoEscuro] = useState(false);

  const [tamanhoFonte, setTamanhoFonte] = useState<TamanhoFonte>("normal");

  const [carregandoPreferencias, setCarregandoPreferencias] = useState(true);

  useEffect(() => {
    async function carregarPreferencias() {
      try {
        const preferenciasSalvas =
          await AsyncStorage.getItem(CHAVE_PREFERENCIAS);

        if (preferenciasSalvas) {
          const preferencias = JSON.parse(preferenciasSalvas);

          if (typeof preferencias.modoEscuro === "boolean") {
            setModoEscuro(preferencias.modoEscuro);
          }

          if (
            preferencias.tamanhoFonte === "normal" ||
            preferencias.tamanhoFonte === "grande" ||
            preferencias.tamanhoFonte === "muitoGrande"
          ) {
            setTamanhoFonte(preferencias.tamanhoFonte);
          }
        }
      } catch (erro) {
        console.error(
          "Não foi possível carregar as preferências de acessibilidade:",
          erro,
        );
      } finally {
        setCarregandoPreferencias(false);
      }
    }

    void carregarPreferencias();
  }, []);

  useEffect(() => {
    if (carregandoPreferencias) {
      return;
    }

    async function salvarPreferencias() {
      try {
        await AsyncStorage.setItem(
          CHAVE_PREFERENCIAS,
          JSON.stringify({
            modoEscuro,
            tamanhoFonte,
          }),
        );
      } catch (erro) {
        console.error(
          "Não foi possível salvar as preferências de acessibilidade:",
          erro,
        );
      }
    }

    void salvarPreferencias();
  }, [modoEscuro, tamanhoFonte, carregandoPreferencias]);

  function alternarTema() {
    setModoEscuro((valorAtual) => !valorAtual);
  }

  function definirTema(novoModoEscuro: boolean) {
    setModoEscuro(novoModoEscuro);
  }

  function definirTamanhoFonte(tamanho: TamanhoFonte) {
    setTamanhoFonte(tamanho);
  }

  function obterTamanhoFonte(tamanhoBase: number) {
    if (tamanhoFonte === "grande") {
      return Math.round(tamanhoBase * 1.2);
    }

    if (tamanhoFonte === "muitoGrande") {
      return Math.round(tamanhoBase * 1.4);
    }

    return tamanhoBase;
  }

  const valor = useMemo(
    () => ({
      modoEscuro,
      tamanhoFonte,
      carregandoPreferencias,
      alternarTema,
      definirTema,
      definirTamanhoFonte,
      obterTamanhoFonte,
    }),
    [modoEscuro, tamanhoFonte, carregandoPreferencias],
  );

  return (
    <AccessibilityContext.Provider value={valor}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const contexto = useContext(AccessibilityContext);

  if (!contexto) {
    throw new Error(
      "useAccessibility deve ser utilizado dentro de AccessibilityProvider.",
    );
  }

  return contexto;
}

import AsyncStorage from "@react-native-async-storage/async-storage";
import {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";
import { useColorScheme } from "react-native";

export type Tema = "claro" | "escuro";

export type Cores = {
  fundo: string;
  superficie: string;
  texto: string;
  textoSecundario: string;
  borda: string;
  botao: string;
  botaoTexto: string;
  botaoDesabilitado: string;
  erro: string;
  destaque: string;
  sobreposicao: string;
};

export const ESCALAS_FONTE = [0.85, 1, 1.15, 1.3, 1.5, 1.75];

const INDICE_PADRAO = 1;

const CHAVE_ARMAZENAMENTO = "@roleta/preferencias";

export const CORES: Record<Tema, Cores> = {
  claro: {
    fundo: "#ffffff",
    superficie: "#f2f4f8",
    texto: "#111111",
    textoSecundario: "#444444",
    borda: "#8a8a8a",
    botao: "#0b5fff",
    botaoTexto: "#ffffff",
    botaoDesabilitado: "#9aa5b8",
    erro: "#b00020",
    destaque: "#0b5fff",
    sobreposicao: "rgba(0,0,0,0.5)",
  },
  escuro: {
    fundo: "#121212",
    superficie: "#1e1e1e",
    texto: "#ffffff",
    textoSecundario: "#d0d0d0",
    borda: "#777777",
    botao: "#7aa7ff",
    botaoTexto: "#000000",
    botaoDesabilitado: "#4a5160",
    erro: "#ff8a80",
    destaque: "#7aa7ff",
    sobreposicao: "rgba(0,0,0,0.7)",
  },
};

type PreferenciasSalvas = {
  tema: Tema;
  indiceEscala: number;
  libras: boolean;
};

type PreferenciasContexto = {
  carregado: boolean;
  tema: Tema;
  modoEscuro: boolean;
  cores: Cores;
  indiceEscala: number;
  escala: number;
  podeAumentar: boolean;
  podeDiminuir: boolean;
  libras: boolean;
  definirTema: (tema: Tema) => void;
  alternarTema: () => void;
  aumentarFonte: () => void;
  diminuirFonte: () => void;
  redefinirFonte: () => void;
  alternarLibras: () => void;
  redefinirTudo: () => void;
};

const Contexto = createContext<PreferenciasContexto | null>(null);

export function PreferenciasProvider({ children }: { children: ReactNode }) {
  const sistema = useColorScheme();

  const [carregado, setCarregado] = useState(false);
  const [tema, setTema] = useState<Tema>(
    sistema === "dark" ? "escuro" : "claro",
  );
  const [indiceEscala, setIndiceEscala] = useState(INDICE_PADRAO);
  const [libras, setLibras] = useState(false);

  useEffect(() => {
    let ativo = true;

    (async () => {
      try {
        const bruto = await AsyncStorage.getItem(CHAVE_ARMAZENAMENTO);

        if (bruto && ativo) {
          const salvas = JSON.parse(bruto) as Partial<PreferenciasSalvas>;

          if (salvas.tema === "claro" || salvas.tema === "escuro") {
            setTema(salvas.tema);
          }

          if (
            typeof salvas.indiceEscala === "number" &&
            Number.isInteger(salvas.indiceEscala) &&
            salvas.indiceEscala >= 0 &&
            salvas.indiceEscala < ESCALAS_FONTE.length
          ) {
            setIndiceEscala(salvas.indiceEscala);
          }

          if (typeof salvas.libras === "boolean") {
            setLibras(salvas.libras);
          }
        }
      } catch (erro) {
        console.error("Não foi possível carregar as preferências:", erro);
      } finally {
        if (ativo) {
          setCarregado(true);
        }
      }
    })();

    return () => {
      ativo = false;
    };
  }, []);

  useEffect(() => {
    if (!carregado) {
      return;
    }

    const preferencias: PreferenciasSalvas = { tema, indiceEscala, libras };

    AsyncStorage.setItem(
      CHAVE_ARMAZENAMENTO,
      JSON.stringify(preferencias),
    ).catch((erro) => {
      console.error("Não foi possível salvar as preferências:", erro);
    });
  }, [carregado, tema, indiceEscala, libras]);

  const alternarTema = useCallback(() => {
    setTema((anterior) => (anterior === "claro" ? "escuro" : "claro"));
  }, []);

  const aumentarFonte = useCallback(() => {
    setIndiceEscala((anterior) =>
      Math.min(anterior + 1, ESCALAS_FONTE.length - 1),
    );
  }, []);

  const diminuirFonte = useCallback(() => {
    setIndiceEscala((anterior) => Math.max(anterior - 1, 0));
  }, []);

  const redefinirFonte = useCallback(() => {
    setIndiceEscala(INDICE_PADRAO);
  }, []);

  const alternarLibras = useCallback(() => {
    setLibras((anterior) => !anterior);
  }, []);

  const redefinirTudo = useCallback(() => {
    setTema(sistema === "dark" ? "escuro" : "claro");
    setIndiceEscala(INDICE_PADRAO);
    setLibras(false);
  }, [sistema]);

  const valor = useMemo<PreferenciasContexto>(
    () => ({
      carregado,
      tema,
      modoEscuro: tema === "escuro",
      cores: CORES[tema],
      indiceEscala,
      escala: ESCALAS_FONTE[indiceEscala],
      podeAumentar: indiceEscala < ESCALAS_FONTE.length - 1,
      podeDiminuir: indiceEscala > 0,
      libras,
      definirTema: setTema,
      alternarTema,
      aumentarFonte,
      diminuirFonte,
      redefinirFonte,
      alternarLibras,
      redefinirTudo,
    }),
    [
      carregado,
      tema,
      indiceEscala,
      libras,
      alternarTema,
      aumentarFonte,
      diminuirFonte,
      redefinirFonte,
      alternarLibras,
      redefinirTudo,
    ],
  );

  if (!carregado) {
    return null;
  }

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function usePreferencias() {
  const contexto = useContext(Contexto);

  if (!contexto) {
    throw new Error(
      "usePreferencias precisa ser usado dentro de PreferenciasProvider.",
    );
  }

  return contexto;
}

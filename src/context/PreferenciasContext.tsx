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
  sombra: string;
  primaria: string;
  primariaTexto: string;
  amarelo: string;
  verde: string;
  rosa: string;
  sobreCor: string;
  ponto: string;
};

export const ESCALAS_FONTE = [0.85, 1, 1.15, 1.3, 1.5, 1.75];

const INDICE_PADRAO = 1;

const CHAVE_ARMAZENAMENTO = "@roleta/preferencias";

export const CORES: Record<Tema, Cores> = {
  claro: {
    fundo: "#FAF3E3",
    superficie: "#FFFBF4",
    texto: "#1E130F",
    textoSecundario: "#635147",
    borda: "#1E130F",
    botao: "#F0491C",
    botaoTexto: "#1E130F",
    botaoDesabilitado: "#CFC4B2",
    erro: "#B3000A",
    destaque: "#CC2D00",
    sobreposicao: "rgba(30,19,15,0.55)",
    sombra: "#1E130F",
    primaria: "#F0491C",
    primariaTexto: "#CC2D00",
    amarelo: "#F6D653",
    verde: "#43BD99",
    rosa: "#DCA0D6",
    sobreCor: "#1E130F",
    ponto: "rgba(30,19,15,0.12)",
  },
  escuro: {
    fundo: "#1E130F",
    superficie: "#2B1D17",
    texto: "#FAF3E3",
    textoSecundario: "#D9CBBB",
    borda: "#FAF3E3",
    botao: "#F0491C",
    botaoTexto: "#1E130F",
    botaoDesabilitado: "#5A4A41",
    erro: "#FF9A92",
    destaque: "#FF8A63",
    sobreposicao: "rgba(0,0,0,0.7)",
    sombra: "#FAF3E3",
    primaria: "#F0491C",
    primariaTexto: "#FF8A63",
    amarelo: "#F6D653",
    verde: "#43BD99",
    rosa: "#DCA0D6",
    sobreCor: "#1E130F",
    ponto: "rgba(250,243,227,0.10)",
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

import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createUserWithEmailAndPassword,
  getIdToken,
  onAuthStateChanged,
  reload,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  User,
} from "firebase/auth";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AppState, PanResponder, Platform, View } from "react-native";

import { Genero } from "../constants/genero";
import {
  confirmarEntradaNativa,
  ErroEntradaNativa,
  gravarEntradaNativaAtivada,
  lerEntradaNativaAtivada,
} from "../services/entradaNativa";
import { obterAuth } from "../services/firebase";
import {
  carregarPerfil,
  atualizarNotificacoes as gravarNotificacoes,
  NovoPerfil,
  Perfil,
  PreferenciasNotificacao,
  registrarLoginNoPerfil,
} from "../services/perfil";
import { normalizarEmail, normalizarNome } from "../utils/validacoes";

const SEGUNDO = 1000;

function lerSegundos(valor: string | undefined, padrao: number) {
  const numero = Number.parseInt(valor ?? "", 10);

  return Number.isNaN(numero) || numero < 0 ? padrao : numero;
}

export const LIMITE_INATIVIDADE_MS =
  lerSegundos(process.env.EXPO_PUBLIC_LIMITE_INATIVIDADE_SEGUNDOS, 300) *
  SEGUNDO;

const SEGUNDOS_LIMITE_SEGUNDO_PLANO =
  lerSegundos(process.env.EXPO_PUBLIC_LIMITE_SEGUNDO_PLANO_SEGUNDOS, 300) ||
  300;
const LIMITE_SEGUNDO_PLANO_MS = SEGUNDOS_LIMITE_SEGUNDO_PLANO * SEGUNDO;

export const EXIGIR_EMAIL_VERIFICADO =
  process.env.EXPO_PUBLIC_EXIGIR_EMAIL_VERIFICADO !== "false";

const AVISO_ANTES_MS = Math.min(15 * SEGUNDO, LIMITE_INATIVIDADE_MS / 3);

const INTERVALO_VERIFICACAO_MS = 1000;
const INTERVALO_GRAVACAO_MS = 5000;
const FOLGA_APOS_PAUSA_MS = 1500;
const CHAVE_SESSAO = "@roleta/sessao";
const CHAVE_PERMISSOES = "@roleta/permissoes/";

export type MotivoEncerramento = "inatividade" | "segundo-plano";

export type InfoSessao = {
  id: string;
  iniciadaEm: number;
};

export type DadosCadastro = {
  nome: string;
  email: string;
  senha: string;
  genero: Genero;
  notificarEmail: boolean;
  notificarPush: boolean;
};

type SessaoLocal = {
  uid: string;
  sessaoId: string;
  iniciadaEm: number;
  ultimaAtividade: number;
  saiuEm: number | null;
};

type SessaoContexto = {
  carregando: boolean;
  usuario: User | null;
  perfil: Perfil | null;
  sessao: InfoSessao | null;
  emailVerificado: boolean;
  emailOk: boolean;
  permissoesConcluidas: boolean;
  avisoExpiracao: boolean;
  motivoEncerramento: MotivoEncerramento | null;
  contaBloqueada: User | null;
  entradaNativaDisponivel: boolean;
  entrar: (email: string, senha: string) => Promise<void>;
  desbloquearComEntradaNativa: () => Promise<void>;
  cadastrar: (dados: DadosCadastro) => Promise<void>;
  sair: () => Promise<void>;
  verificarEmail: () => Promise<boolean>;
  reenviarVerificacao: () => Promise<void>;
  recuperarSenha: (email: string) => Promise<void>;
  concluirPermissoes: () => Promise<void>;
  atualizarNotificacoes: (
    parcial: Partial<PreferenciasNotificacao>,
  ) => Promise<void>;
  continuarConectado: () => void;
  registrarAtividade: () => void;
  tempoRestanteMs: () => number;
  limparMotivo: () => void;
  definirEntradaNativa: (ativada: boolean) => Promise<void>;
  executarSemExpirar: <T>(acao: () => Promise<T>) => Promise<T>;
};

const Contexto = createContext<SessaoContexto | null>(null);

function gerarIdSessao() {
  return Math.random().toString(36).slice(2, 10).toUpperCase();
}

async function lerSessaoLocal(): Promise<SessaoLocal | null> {
  try {
    const bruto = await AsyncStorage.getItem(CHAVE_SESSAO);

    if (!bruto) {
      return null;
    }

    const dados = JSON.parse(bruto) as Partial<SessaoLocal>;

    if (
      typeof dados.uid === "string" &&
      typeof dados.sessaoId === "string" &&
      typeof dados.iniciadaEm === "number" &&
      typeof dados.ultimaAtividade === "number"
    ) {
      return {
        uid: dados.uid,
        sessaoId: dados.sessaoId,
        iniciadaEm: dados.iniciadaEm,
        ultimaAtividade: dados.ultimaAtividade,
        saiuEm: typeof dados.saiuEm === "number" ? dados.saiuEm : null,
      };
    }

    return null;
  } catch {
    return null;
  }
}

async function gravarSessaoLocal(sessao: SessaoLocal) {
  try {
    await AsyncStorage.setItem(CHAVE_SESSAO, JSON.stringify(sessao));
  } catch (erro) {
    console.warn("Não foi possível gravar a sessão local:", erro);
  }
}

async function limparSessaoLocal() {
  try {
    await AsyncStorage.removeItem(CHAVE_SESSAO);
  } catch (erro) {
    console.warn("Não foi possível limpar a sessão local:", erro);
  }
}

async function lerPermissoesConcluidas(uid: string) {
  try {
    return (await AsyncStorage.getItem(CHAVE_PERMISSOES + uid)) === "sim";
  } catch {
    return false;
  }
}

async function gravarPermissoesConcluidas(uid: string) {
  try {
    await AsyncStorage.setItem(CHAVE_PERMISSOES + uid, "sim");
  } catch (erro) {
    console.warn("Não foi possível gravar as permissões:", erro);
  }
}

export function SessaoProvider({ children }: { children: ReactNode }) {
  const [carregando, setCarregando] = useState(true);
  const [usuario, setUsuario] = useState<User | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [sessao, setSessao] = useState<InfoSessao | null>(null);
  const [emailVerificado, setEmailVerificado] = useState(false);
  const [permissoesConcluidas, setPermissoesConcluidas] = useState(false);
  const [avisoExpiracao, setAvisoExpiracao] = useState(false);
  const [motivoEncerramento, setMotivoEncerramento] =
    useState<MotivoEncerramento | null>(null);
  const [contaBloqueada, setContaBloqueada] = useState<User | null>(null);
  const [entradaNativaDisponivel, setEntradaNativaDisponivel] = useState(false);

  const ultimaAtividade = useRef(Date.now());
  const ultimaGravacao = useRef(0);
  const sessaoLocal = useRef<SessaoLocal | null>(null);
  const novoLogin = useRef(false);
  const entradaPendente = useRef<Promise<void> | null>(null);
  const uidEntradaRecusada = useRef<string | null>(null);
  const uidSessaoAtiva = useRef<string | null>(null);
  const contaBloqueadaRef = useRef<User | null>(null);
  const promptNativo = useRef(false);
  const segundoPlanoDurantePrompt = useRef(false);
  const dadosPendentes = useRef<NovoPerfil | null>(null);
  const encerrando = useRef(false);
  const pausas = useRef(0);
  const saiuEm = useRef<number | null>(null);
  const emailVerificadoRef = useRef(false);

  const emailOk = !EXIGIR_EMAIL_VERIFICADO || emailVerificado;

  const limparEstado = useCallback(() => {
    sessaoLocal.current = null;
    uidSessaoAtiva.current = null;
    contaBloqueadaRef.current = null;
    saiuEm.current = null;
    emailVerificadoRef.current = false;

    setUsuario(null);
    setPerfil(null);
    setSessao(null);
    setEmailVerificado(false);
    setPermissoesConcluidas(false);
    setAvisoExpiracao(false);
    setContaBloqueada(null);
    setEntradaNativaDisponivel(false);
  }, []);

  const estabelecerSessao = useCallback(
    async (
      usuarioAtual: User,
      eraNovoLogin: boolean,
      aindaAtivo: () => boolean = () => true,
    ) => {
      if (
        uidSessaoAtiva.current === usuarioAtual.uid &&
        sessaoLocal.current?.uid === usuarioAtual.uid
      ) {
        setCarregando(false);
        return;
      }

      const agora = Date.now();
      const anterior = sessaoLocal.current;
      const sessaoAtual: SessaoLocal = {
        uid: usuarioAtual.uid,
        sessaoId:
          anterior?.uid === usuarioAtual.uid
            ? anterior.sessaoId
            : gerarIdSessao(),
        iniciadaEm:
          anterior?.uid === usuarioAtual.uid ? anterior.iniciadaEm : agora,
        ultimaAtividade: agora,
        saiuEm: null,
      };

      uidSessaoAtiva.current = usuarioAtual.uid;
      sessaoLocal.current = sessaoAtual;
      contaBloqueadaRef.current = null;
      novoLogin.current = false;
      saiuEm.current = null;
      ultimaAtividade.current = agora;
      ultimaGravacao.current = agora;
      emailVerificadoRef.current = usuarioAtual.emailVerified;

      await gravarSessaoLocal(sessaoAtual);

      const concluidas = await lerPermissoesConcluidas(usuarioAtual.uid);

      if (!aindaAtivo()) {
        return;
      }

      setMotivoEncerramento(null);
      setContaBloqueada(null);
      setEntradaNativaDisponivel(false);
      setSessao({
        id: sessaoAtual.sessaoId,
        iniciadaEm: sessaoAtual.iniciadaEm,
      });
      setEmailVerificado(usuarioAtual.emailVerified);
      setPermissoesConcluidas(concluidas);
      setUsuario(usuarioAtual);

      try {
        if (eraNovoLogin) {
          const novo: NovoPerfil = dadosPendentes.current ?? {
            nome:
              usuarioAtual.displayName ??
              usuarioAtual.email?.split("@")[0] ??
              "Pessoa",
            genero: "nao-informar",
            notificacoes: { email: false, push: false },
          };

          dadosPendentes.current = null;

          setPerfil(
            await registrarLoginNoPerfil(
              usuarioAtual.uid,
              usuarioAtual.email ?? "",
              novo,
            ),
          );
        } else {
          setPerfil(await carregarPerfil(usuarioAtual.uid));
        }
      } catch (erro) {
        console.warn("Não foi possível carregar o perfil:", erro);
      }

      if (aindaAtivo()) {
        setCarregando(false);
      }
    },
    [],
  );

  const bloquearPorSegundoPlano = useCallback(async (usuarioAtual: User) => {
    if (obterAuth().currentUser?.uid !== usuarioAtual.uid) {
      return;
    }

    const local = sessaoLocal.current;

    uidSessaoAtiva.current = null;
    sessaoLocal.current = null;
    saiuEm.current = local?.saiuEm ?? Date.now();
    emailVerificadoRef.current = false;
    contaBloqueadaRef.current = usuarioAtual;

    setMotivoEncerramento("segundo-plano");
    setUsuario(null);
    setPerfil(null);
    setSessao(null);
    setEmailVerificado(false);
    setPermissoesConcluidas(false);
    setAvisoExpiracao(false);
    setContaBloqueada(usuarioAtual);
    setEntradaNativaDisponivel(false);
    setCarregando(false);

    if (local?.uid === usuarioAtual.uid && local.saiuEm !== null) {
      await gravarSessaoLocal(local);
    }

    try {
      setEntradaNativaDisponivel(
        await lerEntradaNativaAtivada(usuarioAtual.uid),
      );
    } catch (erro) {
      console.warn(
        "Não foi possível verificar a preferência de entrada nativa:",
        erro,
      );
      setEntradaNativaDisponivel(false);
    }
  }, []);

  const encerrar = useCallback(
    async (motivo: MotivoEncerramento | null) => {
      if (encerrando.current) {
        return;
      }

      encerrando.current = true;

      try {
        setMotivoEncerramento(motivo);

        await limparSessaoLocal();

        limparEstado();

        await signOut(obterAuth());
      } catch (erro) {
        console.warn("Falha ao encerrar a sessão:", erro);
      } finally {
        encerrando.current = false;
      }
    },
    [limparEstado],
  );

  useEffect(() => {
    let ativo = true;

    const cancelar = onAuthStateChanged(obterAuth(), async (usuarioAtual) => {
      if (!ativo) {
        return;
      }

      const loginPendente = usuarioAtual ? entradaPendente.current : null;

      if (loginPendente) {
        await loginPendente;
      }

      if (!ativo) {
        return;
      }

      if (
        usuarioAtual &&
        obterAuth().currentUser?.uid !== usuarioAtual.uid
      ) {
        return;
      }

      if (!usuarioAtual) {
        uidEntradaRecusada.current = null;
        limparEstado();
        setCarregando(false);
        return;
      }

      if (uidEntradaRecusada.current === usuarioAtual.uid) {
        return;
      }

      const agora = Date.now();

      const eraNovoLogin = novoLogin.current;

      novoLogin.current = false;

      let local: SessaoLocal | null;

      if (eraNovoLogin) {
        local = {
          uid: usuarioAtual.uid,
          sessaoId: gerarIdSessao(),
          iniciadaEm: agora,
          ultimaAtividade: agora,
          saiuEm: null,
        };
      } else {
        local = await lerSessaoLocal();

        let motivo: MotivoEncerramento | null = null;

        let expirada = local === null || local.uid !== usuarioAtual.uid;

        if (!expirada && local) {
          if (
            LIMITE_SEGUNDO_PLANO_MS > 0 &&
            local.saiuEm !== null &&
            agora - local.saiuEm >= LIMITE_SEGUNDO_PLANO_MS &&
            (!EXIGIR_EMAIL_VERIFICADO || usuarioAtual.emailVerified)
          ) {
            motivo = "segundo-plano";
            expirada = true;
          } else if (agora - local.ultimaAtividade >= LIMITE_INATIVIDADE_MS) {
            motivo = "inatividade";
            expirada = true;
          }
        }

        if (expirada || !local) {
          if (!ativo) {
            return;
          }

          if (motivo === "segundo-plano" && local) {
            sessaoLocal.current = local;
            await bloquearPorSegundoPlano(usuarioAtual);
            return;
          }

          setMotivoEncerramento(motivo);

          await limparSessaoLocal();

          await signOut(obterAuth());

          return;
        }
      }

      if (local) {
        sessaoLocal.current = local;
      }

      await estabelecerSessao(usuarioAtual, eraNovoLogin, () => ativo);
    });

    return () => {
      ativo = false;
      cancelar();
    };
  }, [bloquearPorSegundoPlano, estabelecerSessao, limparEstado]);

  const registrarAtividade = useCallback(() => {
    ultimaAtividade.current = Date.now();

    setAvisoExpiracao(false);
  }, []);

  useEffect(() => {
    if (!usuario) {
      return undefined;
    }

    const intervalo = setInterval(() => {
      const agora = Date.now();

      const ocioso = agora - ultimaAtividade.current;

      if (ocioso >= LIMITE_INATIVIDADE_MS) {
        encerrar("inatividade");
        return;
      }

      setAvisoExpiracao(ocioso >= LIMITE_INATIVIDADE_MS - AVISO_ANTES_MS);

      if (
        sessaoLocal.current &&
        agora - ultimaGravacao.current >= INTERVALO_GRAVACAO_MS
      ) {
        ultimaGravacao.current = agora;

        gravarSessaoLocal({
          ...sessaoLocal.current,
          ultimaAtividade: ultimaAtividade.current,
        });
      }
    }, INTERVALO_VERIFICACAO_MS);

    return () => clearInterval(intervalo);
  }, [usuario, encerrar]);

  useEffect(() => {
    const assinatura = AppState.addEventListener("change", (estado) => {
      if (promptNativo.current) {
        if (estado === "background") {
          segundoPlanoDurantePrompt.current = true;

          if (usuario) {
            void encerrar(null);
          }
        }

        return;
      }

      if (!usuario) {
        return;
      }

      if (estado === "background") {
        if (pausas.current > 0) {
          return;
        }

        if (EXIGIR_EMAIL_VERIFICADO && !emailVerificadoRef.current) {
          return;
        }

        saiuEm.current = Date.now();

        if (sessaoLocal.current) {
          gravarSessaoLocal({
            ...sessaoLocal.current,
            ultimaAtividade: ultimaAtividade.current,
            saiuEm: saiuEm.current,
          });
        }

        return;
      }

      if (estado === "active") {
        const saida = saiuEm.current;

        saiuEm.current = null;

        const agora = Date.now();

        if (
          LIMITE_SEGUNDO_PLANO_MS > 0 &&
          saida !== null &&
          agora - saida >= LIMITE_SEGUNDO_PLANO_MS
        ) {
          void bloquearPorSegundoPlano(usuario);
          return;
        }

        if (agora - ultimaAtividade.current >= LIMITE_INATIVIDADE_MS) {
          encerrar("inatividade");
          return;
        }

        if (sessaoLocal.current) {
          gravarSessaoLocal({
            ...sessaoLocal.current,
            ultimaAtividade: ultimaAtividade.current,
            saiuEm: null,
          });
        }
      }
    });

    return () => assinatura.remove();
  }, [usuario, bloquearPorSegundoPlano, encerrar]);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof document === "undefined") {
      return undefined;
    }

    const eventos = ["keydown", "pointerdown", "wheel", "touchstart"];

    eventos.forEach((evento) =>
      document.addEventListener(evento, registrarAtividade, {
        passive: true,
        capture: true,
      }),
    );

    return () => {
      eventos.forEach((evento) =>
        document.removeEventListener(evento, registrarAtividade, {
          capture: true,
        }),
      );
    };
  }, [registrarAtividade]);

  const painelDeAtividade = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponderCapture: () => {
          registrarAtividade();

          return false;
        },
        onMoveShouldSetPanResponderCapture: () => {
          registrarAtividade();

          return false;
        },
      }),
    [registrarAtividade],
  );

  const entrar = useCallback(async (email: string, senha: string) => {
    let liberarEntrada: (() => void) | undefined;
    const aguardandoEntrada = new Promise<void>((resolve) => {
      liberarEntrada = resolve;
    });
    const uidBloqueado = contaBloqueadaRef.current?.uid ?? null;

    entradaPendente.current = aguardandoEntrada;
    novoLogin.current = false;
    uidEntradaRecusada.current = null;

    try {
      const credencial = await signInWithEmailAndPassword(
        obterAuth(),
        normalizarEmail(email),
        senha,
      );
      if (AppState.currentState !== "active") {
        throw new ErroEntradaNativa(
          "Login cancelado porque o aplicativo saiu do primeiro plano.",
        );
      }

      const desbloqueioComSenha =
        uidBloqueado !== null && credencial.user.uid === uidBloqueado;

      if (
        !desbloqueioComSenha &&
        (await lerEntradaNativaAtivada(credencial.user.uid))
      ) {
        promptNativo.current = true;
        segundoPlanoDurantePrompt.current = false;

        try {
          await confirmarEntradaNativa("Confirmar entrada");
        } finally {
          promptNativo.current = false;
        }

        if (segundoPlanoDurantePrompt.current) {
          throw new ErroEntradaNativa(
            "Entrada cancelada porque o aplicativo foi para segundo plano.",
          );
        }
      }

      if (
        AppState.currentState !== "active" ||
        obterAuth().currentUser?.uid !== credencial.user.uid
      ) {
        throw new ErroEntradaNativa(
          "Login cancelado porque a sessão foi interrompida.",
        );
      }

      novoLogin.current = true;
      await estabelecerSessao(credencial.user, true);
    } catch (erro) {
      novoLogin.current = false;

      const usuarioAutenticado = obterAuth().currentUser;

      if (
        usuarioAutenticado &&
        usuarioAutenticado.uid !== uidBloqueado
      ) {
        uidEntradaRecusada.current = usuarioAutenticado.uid;

        try {
          await signOut(obterAuth());
        } catch (falhaAoEncerrar) {
          console.warn(
            "Não foi possível encerrar o login sem confirmação nativa:",
            falhaAoEncerrar,
          );
        }
      }

      throw erro;
    } finally {
      entradaPendente.current = null;
      liberarEntrada?.();
    }
  }, [estabelecerSessao]);

  const desbloquearComEntradaNativa = useCallback(async () => {
    const usuarioAtual = obterAuth().currentUser;

    if (
      !contaBloqueadaRef.current ||
      !usuarioAtual ||
      usuarioAtual.uid !== contaBloqueadaRef.current.uid
    ) {
      throw new ErroEntradaNativa(
        "Não há uma sessão Firebase bloqueada para desbloquear.",
      );
    }

    if (!(await lerEntradaNativaAtivada(usuarioAtual.uid))) {
      throw new ErroEntradaNativa(
        "A entrada biométrica não está ativada para esta conta.",
      );
    }

    promptNativo.current = true;
    segundoPlanoDurantePrompt.current = false;

    try {
      await confirmarEntradaNativa("Desbloquear sua conta");
    } finally {
      promptNativo.current = false;
    }

    if (
      segundoPlanoDurantePrompt.current ||
      AppState.currentState !== "active" ||
      obterAuth().currentUser?.uid !== usuarioAtual.uid
    ) {
      throw new ErroEntradaNativa(
        "Desbloqueio cancelado. Confirme novamente sem sair do aplicativo.",
      );
    }

    await getIdToken(usuarioAtual, true);

    if (
      AppState.currentState !== "active" ||
      obterAuth().currentUser?.uid !== usuarioAtual.uid
    ) {
      throw new ErroEntradaNativa(
        "A sessão foi interrompida ou expirou. Entre com seu e-mail e senha.",
      );
    }

    await estabelecerSessao(usuarioAtual, true);
  }, [estabelecerSessao]);

  const definirEntradaNativa = useCallback(
    async (ativada: boolean) => {
      const atual = obterAuth().currentUser;

      if (!usuario || !atual || atual.uid !== usuario.uid) {
        throw new ErroEntradaNativa(
          "Entre novamente para alterar a entrada nativa.",
        );
      }

      if (ativada) {
        promptNativo.current = true;
        segundoPlanoDurantePrompt.current = false;

        try {
          await confirmarEntradaNativa("Ativar entrada nativa");
        } finally {
          promptNativo.current = false;
        }

        if (
          segundoPlanoDurantePrompt.current ||
          obterAuth().currentUser?.uid !== atual.uid
        ) {
          throw new ErroEntradaNativa(
            "Ativação cancelada. Confirme novamente sem sair do aplicativo.",
          );
        }
      }

      if (obterAuth().currentUser?.uid !== atual.uid) {
        throw new ErroEntradaNativa(
          "A sessão foi encerrada antes de salvar a preferência.",
        );
      }

      await gravarEntradaNativaAtivada(atual.uid, ativada);
      registrarAtividade();
    },
    [registrarAtividade, usuario],
  );

  const cadastrar = useCallback(async (dados: DadosCadastro) => {
    novoLogin.current = true;

    dadosPendentes.current = {
      nome: normalizarNome(dados.nome),
      genero: dados.genero,
      notificacoes: { email: dados.notificarEmail, push: dados.notificarPush },
    };

    setMotivoEncerramento(null);

    try {
      const credencial = await createUserWithEmailAndPassword(
        obterAuth(),
        normalizarEmail(dados.email),
        dados.senha,
      );

      try {
        await updateProfile(credencial.user, {
          displayName: normalizarNome(dados.nome),
        });
      } catch (erro) {
        console.warn("Não foi possível gravar o nome no cadastro:", erro);
      }

      try {
        await sendEmailVerification(credencial.user);
      } catch (erro) {
        console.warn("Não foi possível enviar o e-mail de confirmação:", erro);
      }
    } catch (erro) {
      novoLogin.current = false;
      dadosPendentes.current = null;

      throw erro;
    }
  }, []);

  const sair = useCallback(() => encerrar(null), [encerrar]);

  const verificarEmail = useCallback(async () => {
    const atual = obterAuth().currentUser;

    if (!atual) {
      return false;
    }

    await reload(atual);

    emailVerificadoRef.current = atual.emailVerified;

    setEmailVerificado(atual.emailVerified);

    return atual.emailVerified;
  }, []);

  const reenviarVerificacao = useCallback(async () => {
    const atual = obterAuth().currentUser;

    if (!atual) {
      return;
    }

    await sendEmailVerification(atual);
  }, []);

  const recuperarSenha = useCallback(async (email: string) => {
    await sendPasswordResetEmail(obterAuth(), normalizarEmail(email));
  }, []);

  const concluirPermissoes = useCallback(async () => {
    const atual = obterAuth().currentUser;

    if (atual) {
      await gravarPermissoesConcluidas(atual.uid);
    }

    setPermissoesConcluidas(true);
  }, []);

  const atualizarNotificacoes = useCallback(
    async (parcial: Partial<PreferenciasNotificacao>) => {
      const atual = obterAuth().currentUser;

      if (!atual) {
        return;
      }

      const anteriores = perfil?.notificacoes ?? { email: false, push: false };

      const novas: PreferenciasNotificacao = { ...anteriores, ...parcial };

      await gravarNotificacoes(atual.uid, novas);

      setPerfil((anterior) =>
        anterior ? { ...anterior, notificacoes: novas } : anterior,
      );
    },
    [perfil],
  );

  const continuarConectado = useCallback(() => {
    registrarAtividade();
  }, [registrarAtividade]);

  const tempoRestanteMs = useCallback(
    () =>
      Math.max(
        0,
        LIMITE_INATIVIDADE_MS - (Date.now() - ultimaAtividade.current),
      ),
    [],
  );

  const limparMotivo = useCallback(() => setMotivoEncerramento(null), []);

  const executarSemExpirar = useCallback(
    async <T,>(acao: () => Promise<T>): Promise<T> => {
      pausas.current += 1;

      try {
        return await acao();
      } finally {
        setTimeout(() => {
          pausas.current = Math.max(0, pausas.current - 1);
        }, FOLGA_APOS_PAUSA_MS);
      }
    },
    [],
  );

  const valor = useMemo<SessaoContexto>(
    () => ({
      carregando,
      usuario,
      perfil,
      sessao,
      emailVerificado,
      emailOk,
      permissoesConcluidas,
      avisoExpiracao,
      motivoEncerramento,
      contaBloqueada,
      entradaNativaDisponivel,
      entrar,
      desbloquearComEntradaNativa,
      cadastrar,
      sair,
      verificarEmail,
      reenviarVerificacao,
      recuperarSenha,
      concluirPermissoes,
      atualizarNotificacoes,
      continuarConectado,
      registrarAtividade,
      tempoRestanteMs,
      limparMotivo,
      definirEntradaNativa,
      executarSemExpirar,
    }),
    [
      carregando,
      usuario,
      perfil,
      sessao,
      emailVerificado,
      emailOk,
      permissoesConcluidas,
      avisoExpiracao,
      motivoEncerramento,
      contaBloqueada,
      entradaNativaDisponivel,
      entrar,
      desbloquearComEntradaNativa,
      cadastrar,
      sair,
      verificarEmail,
      reenviarVerificacao,
      recuperarSenha,
      concluirPermissoes,
      atualizarNotificacoes,
      continuarConectado,
      registrarAtividade,
      tempoRestanteMs,
      limparMotivo,
      definirEntradaNativa,
      executarSemExpirar,
    ],
  );

  return (
    <Contexto.Provider value={valor}>
      <View style={{ flex: 1 }} {...painelDeAtividade.panHandlers}>
        {children}
      </View>
    </Contexto.Provider>
  );
}

export function useSessao() {
  const contexto = useContext(Contexto);

  if (!contexto) {
    throw new Error("useSessao precisa ser usado dentro de SessaoProvider.");
  }

  return contexto;
}

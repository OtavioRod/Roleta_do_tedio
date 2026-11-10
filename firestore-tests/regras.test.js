const { test, before, after, beforeEach } = require("node:test");
const fs = require("node:fs");
const path = require("node:path");

const {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} = require("@firebase/rules-unit-testing");

const {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} = require("firebase/firestore");

let ambiente;

before(async () => {
  ambiente = await initializeTestEnvironment({
    projectId: "demo-roleta",
    firestore: {
      rules: fs.readFileSync(
        path.join(__dirname, "..", "firestore.rules"),
        "utf8",
      ),
      host: "127.0.0.1",
      port: 8080,
    },
  });
});

after(async () => {
  await ambiente.cleanup();
});

beforeEach(async () => {
  await ambiente.clearFirestore();
});

const bd = (uid) =>
  ambiente.authenticatedContext(uid, { email: `${uid}@teste.com` }).firestore();

async function semRegras(fn) {
  await ambiente.withSecurityRulesDisabled(async (contexto) => {
    await fn(contexto.firestore());
  });
}

const salaBase = (extra = {}) => ({
  codigo: "ABC123",
  tipo: "amigos",
  donoUid: "alice",
  donoNome: "Alice",
  membrosUids: ["alice", "bob"],
  limite: 10,
  estado: "aguardando",
  rodada: 1,
  resultado: null,
  ...extra,
});

const resultado = (tentativa = 1) => ({
  atividadeId: "cafe",
  atividadeNome: "Tomar um café",
  semFiltro: false,
  tentativa,
});

test("perfil: a própria pessoa cria e ninguém mais lê", async () => {
  await assertSucceeds(
    setDoc(doc(bd("alice"), "users/alice"), {
      nome: "Alice",
      email: "alice@teste.com",
      genero: "feminino",
      notificacoes: { email: false, push: true },
      aceitouTermosEm: serverTimestamp(),
      criadoEm: serverTimestamp(),
      ultimoLoginEm: serverTimestamp(),
    }),
  );

  await assertFails(getDocs(collection(bd("bob"), "users")));
});

test("amizade: só o outro lado aceita o pedido", async () => {
  await assertSucceeds(
    setDoc(doc(bd("alice"), "amizades/alice_bob"), {
      membros: ["alice", "bob"],
      nomes: { alice: "Alice", bob: "Bob" },
      solicitante: "alice",
      estado: "pendente",
      criadoEm: serverTimestamp(),
    }),
  );

  await assertFails(
    updateDoc(doc(bd("alice"), "amizades/alice_bob"), { estado: "aceita" }),
  );

  await assertSucceeds(
    updateDoc(doc(bd("bob"), "amizades/alice_bob"), { estado: "aceita" }),
  );

  await assertFails(
    updateDoc(doc(bd("mallory"), "amizades/alice_bob"), { estado: "aceita" }),
  );
});

test("convite: exige amizade aceita e sala em que a pessoa é membro", async () => {
  await semRegras(async (admin) => {
    await setDoc(
      doc(admin, "salas/ABC123"),
      salaBase({ membrosUids: ["alice"] }),
    );
    await setDoc(doc(admin, "amizades/alice_bob"), {
      membros: ["alice", "bob"],
      nomes: { alice: "Alice", bob: "Bob" },
      solicitante: "alice",
      estado: "aceita",
    });
  });

  const convite = (de, para) => ({
    de,
    deNome: de,
    para,
    salaCodigo: "ABC123",
    tipo: "amigos",
    estado: "pendente",
    criadoEm: serverTimestamp(),
  });

  await assertSucceeds(
    setDoc(doc(bd("alice"), "convites/ABC123_bob"), convite("alice", "bob")),
  );

  await assertFails(
    setDoc(
      doc(bd("alice"), "convites/ABC123_carol"),
      convite("alice", "carol"),
    ),
  );

  await assertFails(
    setDoc(doc(bd("bob"), "convites/ABC123_alice"), convite("bob", "alice")),
  );
});

test("sala: entrar respeita o limite e a lista só mostra as minhas salas", async () => {
  await semRegras(async (admin) => {
    await setDoc(
      doc(admin, "salas/CASAL1"),
      salaBase({ codigo: "CASAL1", tipo: "casal", limite: 2 }),
    );
    await setDoc(
      doc(admin, "salas/GRUPO1"),
      salaBase({ codigo: "GRUPO1", membrosUids: ["alice"] }),
    );
  });

  await assertFails(
    updateDoc(doc(bd("carol"), "salas/CASAL1"), {
      membrosUids: arrayUnion("carol"),
    }),
  );

  await assertSucceeds(
    updateDoc(doc(bd("bob"), "salas/GRUPO1"), {
      membrosUids: arrayUnion("bob"),
    }),
  );

  await assertSucceeds(
    getDocs(
      query(
        collection(bd("alice"), "salas"),
        where("membrosUids", "array-contains", "alice"),
      ),
    ),
  );

  await assertFails(getDocs(collection(bd("alice"), "salas")));
});

test("resultado: um membro grava uma vez; quem não é membro não grava", async () => {
  await semRegras(async (admin) => {
    await setDoc(
      doc(admin, "salas/ABC123"),
      salaBase({ estado: "respondendo" }),
    );
  });

  const gravar = (uid) =>
    updateDoc(doc(bd(uid), "salas/ABC123"), {
      estado: "resultado",
      tentativa: 1,
      resultado: resultado(1),
    });

  await assertFails(gravar("mallory"));
  await assertSucceeds(gravar("bob"));
  await assertFails(gravar("bob"));
});

test("progresso: de 0 a 4 e só na rodada atual", async () => {
  await semRegras(async (admin) => {
    await setDoc(
      doc(admin, "salas/ABC123"),
      salaBase({ estado: "respondendo" }),
    );
    await setDoc(doc(admin, "salas/ABC123/membros/bob"), {
      nome: "Bob",
      respostas: null,
      rodada: 0,
    });
  });

  const membro = doc(bd("bob"), "salas/ABC123/membros/bob");

  await assertSucceeds(updateDoc(membro, { progresso: 2, progressoRodada: 1 }));
  await assertFails(updateDoc(membro, { progresso: 5, progressoRodada: 1 }));
  await assertFails(updateDoc(membro, { progresso: 2, progressoRodada: 9 }));
});

test("votação: o voto precisa ser da tentativa atual", async () => {
  await semRegras(async (admin) => {
    await setDoc(
      doc(admin, "salas/ABC123"),
      salaBase({ estado: "resultado", tentativa: 1, resultado: resultado(1) }),
    );
    await setDoc(doc(admin, "salas/ABC123/membros/bob"), {
      nome: "Bob",
      respostas: null,
      rodada: 1,
    });
  });

  const membro = doc(bd("bob"), "salas/ABC123/membros/bob");

  await assertSucceeds(
    updateDoc(membro, { voto: { tentativa: 1, valor: "topo" } }),
  );
  await assertFails(
    updateDoc(membro, { voto: { tentativa: 2, valor: "topo" } }),
  );
  await assertFails(
    updateDoc(membro, { voto: { tentativa: 1, valor: "talvez" } }),
  );
});

test("giro de novo e confirmação seguem a sequência", async () => {
  await semRegras(async (admin) => {
    await setDoc(
      doc(admin, "salas/ABC123"),
      salaBase({
        estado: "resultado",
        tentativa: 1,
        vetadas: [],
        resultado: resultado(1),
      }),
    );
  });

  const sala = doc(bd("bob"), "salas/ABC123");

  await assertFails(
    updateDoc(sala, {
      tentativa: 5,
      vetadas: ["cafe"],
      resultado: resultado(5),
    }),
  );

  await assertSucceeds(
    updateDoc(sala, {
      tentativa: 2,
      vetadas: ["cafe"],
      resultado: resultado(2),
    }),
  );

  await assertSucceeds(
    updateDoc(sala, {
      confirmada: true,
      ultimaAtividadeId: "cafe",
      historico: [
        { rodada: 1, atividadeId: "cafe", atividadeNome: "Tomar um café" },
      ],
    }),
  );

  await assertFails(
    updateDoc(sala, {
      tentativa: 3,
      vetadas: ["cafe", "cinema"],
      resultado: resultado(3),
    }),
  );
});

test("dono: passa o comando ao sair e remove participantes; outros não podem", async () => {
  await semRegras(async (admin) => {
    await setDoc(
      doc(admin, "salas/ABC123"),
      salaBase({ membrosUids: ["alice", "bob", "carol"] }),
    );
  });

  await assertFails(
    updateDoc(doc(bd("bob"), "salas/ABC123"), {
      donoUid: "bob",
      donoNome: "Bob",
    }),
  );

  await assertFails(
    updateDoc(doc(bd("bob"), "salas/ABC123"), {
      membrosUids: arrayRemove("carol"),
    }),
  );

  await assertSucceeds(
    updateDoc(doc(bd("alice"), "salas/ABC123"), {
      membrosUids: arrayRemove("carol"),
    }),
  );

  await assertSucceeds(
    updateDoc(doc(bd("alice"), "salas/ABC123"), {
      donoUid: "bob",
      donoNome: "Bob",
      membrosUids: arrayRemove("alice"),
    }),
  );
});

test("presença: só vale o horário do servidor, e só o próprio registro", async () => {
  await semRegras(async (admin) => {
    await setDoc(doc(admin, "salas/ABC123"), salaBase());
    await setDoc(doc(admin, "salas/ABC123/membros/bob"), {
      nome: "Bob",
      respostas: null,
      rodada: 0,
    });
  });

  await assertSucceeds(
    updateDoc(doc(bd("bob"), "salas/ABC123/membros/bob"), {
      visto: serverTimestamp(),
    }),
  );

  await assertFails(
    updateDoc(doc(bd("bob"), "salas/ABC123/membros/bob"), { visto: 123 }),
  );

  await assertFails(
    updateDoc(doc(bd("alice"), "salas/ABC123/membros/bob"), {
      visto: serverTimestamp(),
    }),
  );
});

test("push: cada pessoa registra só os próprios aparelhos", async () => {
  const aparelho = {
    token: "ExponentPushToken[abc123]",
    plataforma: "android",
    atualizadoEm: serverTimestamp(),
  };

  await assertSucceeds(
    setDoc(doc(bd("alice"), "users/alice/dispositivos/a1"), aparelho),
  );
  await assertFails(
    setDoc(doc(bd("bob"), "users/alice/dispositivos/a2"), aparelho),
  );
  await assertFails(
    setDoc(doc(bd("alice"), "users/alice/dispositivos/a3"), {
      ...aparelho,
      plataforma: "web",
    }),
  );
});

# Plano de testes — Roleta do Tédio

Este documento mapeia cada tipo de teste para o que existe no projeto, o que já foi executado e o que depende de você (contas, aparelhos, ambiente de teste).

**Legenda:** ✅ escrito e executado | 📝 escrito, ainda não executado | 📋 roteiro manual

| # | Tipo | Situação | Onde |
|---|---|---|---|
| 1 | Unitários | ✅ | `tests/unit/`, `src/utils/validacoes.test.ts` |
| 2 | Integração | ✅ parcial / 📝 | `backend/tests/api.test.js` (rotas + banco/Overpass simulados), `firestore-tests/` (regras com emulador) |
| 3 | Ponta a ponta (E2E) | 📝 | `e2e/fluxo-local.spec.ts`, `e2e/sala-online.spec.ts` |
| 4 | API | ✅ | `backend/tests/api.test.js` |
| 5 | Regressão | ✅ / 📝 | testes marcados com `[regressão]` + CI em `.github/workflows/testes.yml` |
| 6 | Aceitação (UAT) | 📋 | seção 5 deste documento |
| 7 | Carga | 📝 | `testes/carga/k6-backend.js` (`PERFIL=carga`) |
| 8 | Estresse | 📝 | `testes/carga/k6-backend.js` (`PERFIL=estresse` e `pico`) |
| 9 | Escalabilidade | 📋 | seção 6 (análise de custo e limites) |
| 10 | Segurança | ✅ parcial / 📝 / 📋 | testes de entrada na API, regras do Firestore, CI com gitleaks e `npm audit`, roteiro de DAST/pentest na seção 7 |
| 11 | Usabilidade | 📋 | seção 8 |
| 12 | Acessibilidade | 📝 / 📋 | `e2e/acessibilidade.spec.ts` (axe) + roteiro manual na seção 9 |

## 1. O que foi executado neste ambiente

| Suíte | Resultado |
|---|---|
| Unitários (`tests/unit/*.test.ts`) | **30 testes, todos passaram** |
| Unitários existentes (`validacoes.test.ts`) | **18 testes, todos passaram** |
| API do backend (`backend/tests/api.test.js`) | **23 passaram, 2 pendentes (`todo`)** |
| Equivalência app × servidor (algoritmo de decisão) | **20.000 combinações aleatórias, 0 divergências** |

**Teste de mutação** (quebrei o código de propósito para ver se os testes percebem):
- Empate de votos passando a confirmar → 1 teste falhou.
- Ignorar a lista de atividades vetadas → 2 testes falharam.
- Voltar ao `Promise.any` do bug da busca → **4 testes falharam** (os de regressão).

**Limites desta execução:**
- O backend rodou com um substituto mínimo de `express`, `cors` e `dotenv`, porque as dependências dele não estavam instaladas aqui. Rode `npm test` na pasta `backend` com as suas dependências reais.
- Os testes de regras do Firestore, o E2E, o axe e o k6 **não foram executados** (exigem emulador, navegador, contas de teste e rede).

## 2. Como rodar

```bash
# Unitários (Node 22 recomendado)
npm --prefix tests install && npm --prefix tests test

# API do backend
npm --prefix backend install && npm --prefix backend test

# Regras do Firestore (precisa de Java 21 e firebase-tools)
npm install -g firebase-tools
npm --prefix firestore-tests install && npm --prefix firestore-tests test

# E2E e acessibilidade (app web em pé: npx expo start --web)
cd e2e && npm install && npm run instalar-navegadores
E2E_EMAIL=... E2E_SENHA=... E2E_EMAIL_2=... E2E_SENHA_2=... npm test

# Carga (precisa do k6 instalado)
k6 run -e PERFIL=carga -e URL=https://SEU-BACKEND-DE-TESTE testes/carga/k6-backend.js
```

As contas de E2E devem ser **de teste**, com e-mail já verificado e de preferência num projeto Firebase separado do de produção.

## 3. Regressão: cada bug corrigido tem um teste

| Bug | Teste que o protege |
|---|---|
| Busca dizia "nenhuma opção" porque um servidor Overpass regional respondia vazio primeiro | `api.test.js`: espelho vazio não vence quem tem resultado |
| Resposta vazia com aviso de erro era tratada como sucesso | `api.test.js`: aviso de erro conta como falha |
| Resultado vazio ficava 10 min no cache | `api.test.js`: não guarda no cache resultado vazio |
| Servidor usado como proxy aberto (filtros e raio livres) | `api.test.js`: 12 entradas inválidas são recusadas com 400 |
| Resultado diferente em cada aparelho | `recomendacao.test.ts`: mesma sala, rodada e tentativa dão a mesma atividade |
| Convites e entrada em salas dependem de regras do Firestore | `firestore-tests`: convite exige amizade aceita e sala em que a pessoa é membro |
| Sala estourava o limite com entradas simultâneas | `firestore-tests`: entrar respeita o limite |
| Voto de rodada antiga contava | `recomendacao.test.ts` e `firestore-tests` |

Regra de ouro daqui para frente: **todo bug novo ganha um teste que falha antes da correção**. O workflow `.github/workflows/testes.yml` roda tudo a cada push.

## 4. Pendências conhecidas nos testes

- `it.todo` em `api.test.js`: `GET /sessoes` ainda é público e `POST /sessoes` não tem limite de requisições por IP. Os `todo` viram testes de verdade quando você corrigir.
- A tela principal (`index.tsx`, ~3.000 linhas) não tem teste unitário. A lógica de negócio dela já está coberta por `recomendacao.ts`; o resto só se testa por E2E.
- Componentes React Native não têm testes de renderização. Se quiser, o passo seguinte é `jest-expo` + React Native Testing Library.

## 5. Aceitação do usuário (UAT)

Cada cenário deve ser executado por pessoas reais, em aparelhos reais, e marcado como aprovado ou reprovado.

**C1 — Criar conta e entrar**
- *Dado* que a pessoa nunca usou o app, *quando* cria a conta e confirma o e-mail, *então* entra e vê a tela inicial.
- Aceite: erros de senha e e-mail aparecem em português e dizem o que corrigir.

**C2 — Decidir sozinho ou em casal, no mesmo aparelho**
- *Dado* dois participantes, *quando* respondem às perguntas, *então* a roleta escolhe algo que cabe no menor orçamento e no menor tempo.
- Aceite: a tela mostra "Por que a roleta escolheu isso?" citando quem limitou.

**C3 — Sala online do começo ao fim**
- *Dado* duas pessoas em aparelhos diferentes, *quando* uma cria a sala e a outra entra, *então* as duas veem a rodada começar, respondem, veem a roleta parar na **mesma** atividade e votam.
- Aceite: ninguém precisa recarregar a tela; o resultado é igual nos dois aparelhos.

**C4 — Chamar um amigo**
- *Dado* que as duas pessoas são amigas, *quando* uma toca em "Chamar", *então* a outra vê o convite com som e entra com um toque.
- Aceite: com o app fechado, chega uma notificação push (**testar em aparelho físico**).

**C5 — Entrar pelo link ou QR code**
- *Dado* um link `/sala/CODIGO`, *quando* a pessoa ainda não está logada, *então* faz login e cai direto na sala.
- Aceite: funciona pelo navegador e pela câmera lendo o QR code.

**C6 — Veto**
- *Dado* três pessoas, *quando* duas recusam, *então* a roleta gira de novo sem a atividade recusada.

**C7 — Alguém não responde**
- *Dado* uma rodada parada, *quando* o dono toca em "Continuar sem quem falta" (ou o prazo acaba), *então* a roleta decide com quem respondeu.

**C8 — Dono sai**
- *Dado* uma sala com 3 pessoas, *quando* o dono sai, *então* o comando passa para outra pessoa, que é avisada.

**C9 — Voltar depois de fechar o app**
- *Dado* uma sala em andamento, *quando* a pessoa reabre o app, *então* encontra a sala em "Minhas salas ativas".

**C10 — Som e vibração**
- *Dado* que a pessoa desliga os sons no perfil, *então* nenhum som toca, e a vibração segue a própria opção.

## 6. Carga, estresse e escalabilidade

### Como usar o k6
- `carga`: 20 usuários simultâneos por 5 minutos. Metas: menos de 1% de erros; p95 abaixo de 300 ms na raiz e abaixo de 1,5 s em `/locais` (com cache).
- `estresse`: sobe de 50 até 300 usuários para achar o ponto de quebra e ver **como** o sistema falha (erros claros, sem travar tudo).
- `pico`: salto de 5 para 150 em 10 segundos.
- `resistencia`: 30 minutos constantes, para achar vazamento de memória e lentidão progressiva.

**Cuidados**
- Rode contra um backend de **teste**.
- `/locais` consulta servidores públicos do Overpass. Por padrão o teste repete as mesmas coordenadas (resposta do cache) para não sobrecarregar esses servidores. Não use `LOCAIS_FRIO=1` com muitos usuários.
- `/sessoes` só grava com `ESCREVER=1`.

### Pontos de atenção (análise, não medição)
1. **Presença gera escritas no Firestore.** Cada pessoa online grava a cada 25 s: **144 escritas por hora por pessoa**. Com a cota gratuita diária de escritas do Firestore (hoje 20 mil; confirme na página de preços), isso dá cerca de **140 horas-pessoa por dia**. Cada escrita também aciona uma execução da função do servidor (que sai logo, mas conta). Se o uso crescer, aumentar o intervalo para 60 s (60 escritas por hora) reduz isso para menos da metade.
2. **O cache do backend é memória do processo.** No plano gratuito do Render ele some quando o servidor dorme ou reinicia, e a busca volta a depender do Overpass.
3. **Overpass é um serviço público de terceiros.** Ele limita uso. Em escala, o ideal é um cache compartilhado (por exemplo Redis) ou um servidor próprio.
4. **Tamanho das salas é limitado** (2 ou 10 pessoas), o que mantém o custo por sala previsível. O gargalo é o número de salas simultâneas, não o tamanho delas.
5. **Cloud Functions** escalam sozinhas até o limite `maxInstances: 10` configurado em `functions/index.js`. Ajuste conforme o orçamento.

## 7. Segurança

### Automático (SAST)
- **gitleaks** (no CI): procura segredos no código e **no histórico** do Git. Hoje ele vai apontar a `DATABASE_URL` que ficou no commit `1ce123a`; a correção é trocar a senha do banco.
- **npm audit** (no CI): vulnerabilidades em dependências do app e do backend.
- Sugestão extra: `semgrep --config auto` na raiz, e `eslint-plugin-security` no backend.

### Dinâmico (DAST)
Contra um backend de teste:
```bash
docker run --rm -t ghcr.io/zaproxy/zaproxy:stable zap-baseline.py -t https://SEU-BACKEND-DE-TESTE
```
(O ZAP baseline é passivo; o scan ativo só deve rodar em ambiente de teste.)

### Teste de invasão (roteiro)
- **Autorização no Firestore:** o `firestore-tests` já tenta, com usuários diferentes, ler, alterar e apagar o que não é deles. Adicione um teste a cada regra nova.
- **Backend sem autenticação:** hoje qualquer pessoa chama `/sessoes` e `/locais`. Itens abertos:
  - `GET /sessoes` lista tudo publicamente;
  - não há limite de requisições;
  - o CORS está aberto para qualquer origem.
- **Adivinhar salas:** o código tem 6 caracteres de um alfabeto de 31 (cerca de 887 milhões de combinações). Sem limite de tentativas, é difícil, mas não impossível.
- **Já está bem:** recuperação de senha responde igual para e-mails existentes e inexistentes; o HTML do mapa escapa o conteúdo; as consultas SQL usam parâmetros (há teste para isso).
- **Segredos:** troque a credencial do Postgres que ficou no histórico do Git (veja o relatório de análise).

## 8. Usabilidade

Faça com **5 pessoas** que nunca viram o app, sem ajuda. Meça sucesso (sim/não), tempo e dúvidas.

Tarefas:
1. Criar uma conta e entrar.
2. Decidir o que fazer com um(a) amigo(a), no mesmo aparelho.
3. Criar uma sala online e chamar alguém.
4. Entrar numa sala usando só um link.
5. Recusar uma sugestão do grupo e achar outra.

Meta: pelo menos 4 de 5 pessoas completam cada tarefa sem ajuda. Ao final, aplique o questionário SUS (meta: pontuação acima de 68).

Hipóteses para observar:
- As telas de transição avançam sozinhas em cerca de 3 s. Isso pode ser rápido demais para quem lê devagar.
- Alguém sabe o que significa "Modo discreto" sem ler a explicação?
- Quem recebe um convite entende que precisa de um toque para entrar?

## 9. Acessibilidade

### Automática
`e2e/acessibilidade.spec.ts` roda o axe com as regras WCAG 2.2 AA nas telas de login, início, salas e perfil, e confere idioma da página, navegação por teclado e movimento reduzido. Só falha em problemas `serious` e `critical`; o axe encontra em torno de um terço dos problemas, então ele **não substitui** o roteiro manual.

### Manual
- **Leitor de tela:** TalkBack (Android) e VoiceOver (iOS) em todo o fluxo da sala. Confira se o progresso dos outros e o resultado são anunciados.
- **Texto aumentado:** 200% no sistema e as escalas do próprio app, sem texto cortado.
- **Contraste:** tema claro e escuro, incluindo textos secundários e erros.
- **Teclado na web:** percorrer tudo só com Tab, Enter e Esc.
- **Movimento reduzido:** perguntas aparecem prontas e a roleta respeita a preferência.
- **Libras:** o widget VLibras funciona na web e no Android; não existe no iOS.

### Riscos a validar (hipóteses, não violações confirmadas)
- **WCAG 2.2.1 (tempo ajustável):** as telas de transição avançam sozinhas e a rodada tem prazo de 5 minutos. Quem precisa de mais tempo hoje não tem como pausar ou estender. Quem usa leitor de tela ou "reduzir movimento" já não sofre o avanço automático, mas o prazo da rodada vale para todos.
- **Cor como único sinal:** confira se "online / sem conexão" e a opção escolhida não dependem só de cor.

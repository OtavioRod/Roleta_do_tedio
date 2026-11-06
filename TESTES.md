Fala, pessoal, Petrick aqui !

Montei esse resumo para a gente entender exatamente como está a situação dos testes da Roleta do Tédio, o que já está rodando, o que falta fazer e onde precisamos tomar cuidado com custos e segurança.

Para ficar claro:

- [Pronto] significa que o código já está escrito e funcionando.
- [Pendente] significa que o teste está desenhado, mas ainda não rodamos no servidor real.
- [Manual] significa que é roteiro para testarmos na mão, abrindo o app.

---

Como estão os nossos testes hoje:

1. Testes Unitários: Pronto. Estão nas pastas tests/unit/ e no arquivo validacoes.test.ts.
2. Testes de Integração: Pronto parcial e Pendente. Estão em backend/tests/api.test.js (com banco e Overpass simulados) e na pasta firestore-tests/ (testando as regras no emulador).
3. Testes Ponta a Ponta (E2E): Pendente. Estao em e2e/fluxo-local.spec.ts e e2e/sala-online.spec.ts.
4. Testes de API: Pronto. Rodando em backend/tests/api.test.js.
5. Testes de Regressão: Pronto e Pendente. São os testes marcados com [regressao] no código, integrados ao nosso CI no GitHub Actions.
6. Testes de Aceitação (UAT): Manual. São os cenários reais com usuários que detalhei logo abaixo.
7. Testes de Carga e Estresse: Pendente. Estão em testes/carga/k6-backend.js usando perfis diferentes no k6.
8. Escalabilidade: Manual. Nossa análise de custos e limites de infraestrutura.
9. Segurança: Pronto parcial, Pendente e Manual. Validações de entrada na API, regras do Firestore, gitleaks e npm audit no CI, além do roteiro de pentest.
10. Usabilidade: Manual. Roteiro de testes com pessoas reais.
11. Acessibilidade: Pendente e Manual. Teste automático com a biblioteca axe e roteiro manual.

---

1. O que eu já rodei e passou de primeira

- Testes unitários gerais: 30 testes passados.
- Testes unitários de validação: 18 testes passados.
- API do backend: 23 testes passados e 2 marcados como pendentes (todo).
- Algoritmo de decisão (App x Servidor): Rodamos 20.000 combinações aleatórias e deu zero divergências. A roleta toma a mesma decisão nas duas pontas.

Para garantir que nossos testes são confiáveis, eu fiz um teste de mutação (quebrei o código de propósito):

- Mudei a regra de empate e 1 teste pegou o erro.
- Ingnorei os vetos de atividades e 2 testes pegaram o erro.
- Forcei o bug antigo da busca e 4 testes de regressão pegaram a falha na hora.

Atenção com as limitações de agora: O backend rodou aqui com um quebra-galho mínimo porque faltavam dependências na máquina de teste. Para rodar valendo, precisamos dar um 'npm test' na pasta real do backend. Além disso, testes que exigem banco de verdade, emuladores, navegador ou rede (Firestore, E2E, axe e k6) ficaram de fora dessa rodada.

---

2. Como rodar esses testes na sua máquina

Para os unitários (recomendo usar o Node 22):
npm --prefix tests install && npm --prefix tests test

Para testar a API do backend:
npm --prefix backend install && npm --prefix backend test

Para testar as regras do Firestore (precisa do Java 21 e firebase-tools instalado global):
npm install -g firebase-tools
npm --prefix firestore-tests install && npm --prefix firestore-tests test

Para rodar o E2E e a acessibilidade (com o app web rodando em npx expo start --web):
cd e2e && npm install && npm run instalar-navegadores
E2E_EMAIL=... E2E_SENHA=... E2E_EMAIL_2=... E2E_SENHA_2=... npm test

Para os testes de carga (precisa do k6 instalado no PC):
k6 run -e PERFIL=carga -e URL=https://SEU-BACKEND-DE-TESTE testes/carga/k6-backend.js

Dica importante: Só usem contas de teste no E2E, com e-mails já verificados e num projeto do Firebase separado do ambiente de produção.

---

3. Nosso escudo anti-bug (Testes de Regressão)

A nossa regra de ouro agora é: apareceu bug novo, a gente cria um teste que falha antes de corrigir para ele nunca mais voltar. Olha os que já travamos:

- Bug da busca lenta: O app dizia que não tinha opção porque um servidor Overpass regional respondia vazio primeiro. Agora o teste garante que resposta vazia não ganha de quem tem resultado.
- Bug do erro com cara de sucesso: Resposta vazia com aviso de erro era tratada como sucesso. Corrigido e testado como falha.
- Bug do cache de 10 min: O app guardava resultado vazio por 10 minutos na memória. Agora resposta vazia não entra no cache.
- Bug do servidor aberto: A API estava aberta para qualquer um usar de proxy livre. Criamos 12 entradas inválidas nos testes e a API barra todas com erro 400.
- Bug de aparelhos diferentes: Cada celular mostrava uma atividade na mesma sala. Agora, mesma sala e mesma rodada sempre dão o mesmo resultado.
- Regras do Firestore: Pessoas entrando em salas sem ser amigos ou salas estourando o limite de membros. Corrigido e testado via emulador.

---

4. O que ficou pendente para fazermos depois

- Temos dois 'it.todo' em api.test.js. A rota GET /sessoes ainda está pública demais e a POST /sessoes precisa de um limitador de requisições por IP (rate limit) urgente para ninguém derrubar o servidor.
- A nossa tela principal (index.tsx) passou de 3.000 linhas e não tem teste unitário. A lógica de negócio está salva no arquivo recomendacao.ts, mas o visual dela hoje só dá para garantir via teste E2E ou testando na mão.
- Precisamos criar os testes de renderização dos componentes do React Native usando jest-expo e React Native Testing Library.

---

5. Roteiro de Aceitação (UAT) - Para testarmos na mão

Precisamos colocar o app na mão de pessoas reais, em aparelhos físicos, e validar esses 10 pontos:

C1 - Criar conta: Usuário cria conta, valida o e-mail e entra. Erros de e-mail ou senha precisam aparecer em português claro.
C2 - Jogar em dupla no mesmo aparelho: Dois participantes respondem ao quiz e a roleta escolhe algo que cabe no menor orçamento e tempo de ambos, explicando na tela o motivo da escolha.
C3 - Sala online em tempo real: Duas pessoas em celulares separados jogam juntas. A rodada começa, os dois respondem e a roleta para no exato mesmo resultado para ambos, sem ninguém precisar dar F5 na tela.
C4 - Chamar um amigo: Usuários amigos se convidam. Quem recebe precisa ouvir um som e ver a notificação push mesmo se estiver com o app fechado.
C5 - Link ou QR code: Clicar no link da sala ou ler o código com a câmera do celular faz o login automático se precisar e joga a pessoa direto na sala certa.
C6 - Botão de Veto: Se o grupo recusar uma atividade, a roleta precisa girar de novo excluindo essa opção do sorteio.
C7 - Usuário fantasma: Se alguém sumir e não responder, o dono da sala pode clicar em "Continuar sem quem falta" ou esperar o tempo acabar para a roleta decidir com quem sobrou.
C8 - Dono da sala saiu: Se o líder sair, o controle da sala precisa passar automaticamente para outra pessoa, avisando quem ficou.
C9 - Fechar o app sem querer: Se o usuário fechar o app no meio do jogo, quando reabrir, precisa encontrar a sala salva em "Minhas salas ativas".
C10 - Som e vibração: Desativar os sons no perfil do usuário precisa mutar o jogo de verdade, mantendo a vibração independente.

---

6. Carga, estresse e custos (Onde o bicho pode pegar)

Simulações que precisamos acompanhar com o k6:

- Carga: 20 pessoas batendo no servidor por 5 minutos (Meta: menos de 1% de erro).
- Estresse: Subir de 50 para 300 pessoas simultâneas para descobrir onde o sistema abre o bico.
- Pico: Jogar 150 usuários de uma vez só em 10 segundos para ver se o servidor aguenta o tranco.

Atenção com o nosso bolso:

- O Firestore cobra por escrita. Cada pessoa online avisa o banco a cada 25 segundos. Isso dá 144 escritas por hora por pessoa. Na cota gratuita diária do Firebase (20 mil escritas), isso nos dá apenas 140 horas de uso por dia no total do app inteiro. Se o app viralizar, o custo estoura. Uma saída é mudar esse tempo para 60 segundos se o uso crescer.
- Como estamos usando o plano gratuito do Render, o cache do backend fica na memória. Se o servidor entrar em repouso ou reiniciar, o cache limpa e a gente volta a estressar o serviço público do Overpass, que tem limites rígidos de requisições.

---

7. Segurança (Blindando o nosso código)

O que roda automático no CI:

- gitleaks: Procura chaves expostas. Ele já achou uma DATABASE_URL antiga exposta no commit 1ce123a. Precisamos trocar a senha desse banco o quanto antes.
- npm audit: Varre nossas dependências atrás de pacotes perigosos.

Pontos vulneráveis que precisamos corrigir:

- Qualquer pessoa acessa /sessoes e /locais sem login. A rota GET /sessoes lista dados publicamente, não temos limite de acessos por IP e o CORS está totalmente escancarado para qualquer site.
- Os códigos das salas têm apenas 6 caracteres. Como não há bloqueio por erros consecutivos, alguém mal-intencionado pode tentar adivinhar as salas ativas via força bruta (scripts).

---

8. Teste de Usabilidade

Precisamos pegar 5 pessoas que nunca viram o app e pedir para cumprirem tarefas básicas sem a nossa ajuda. A meta é que pelo menos 4 completem tudo sozinhas.
Fiquem de olho se as telas de transição (que passam sozinhas em 3 segundos) não estão rápidas demais para quem lê mais devagar, e se o termo "Modo discreto" faz sentido para os usuários de primeira viagem.

---

9. Acessibilidade

O nosso teste automático (axe) roda no CI nas telas principais, mas não resolve tudo. Precisamos testar na mão:

- O leitor de tela (TalkBack e VoiceOver) está anunciando o resultado da roleta por voz?
- Se aumentarmos a fonte do celular em 200%, o texto quebra ou some da tela?
- Risco de conformidade (WCAG 2.2.1): A rodada fecha em 5 minutos cravados e as transições passam sozinhas. Quem tem limitações de leitura ou motoras não tem como pausar ou estender esse tempo hoje. Precisamos pensar em uma forma de dar mais tempo para o usuário se ele precisar.

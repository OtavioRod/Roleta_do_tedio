# Histórico do Projeto — Roleta do Tédio

## 1. Sobre o projeto

A Roleta do Tédio é um aplicativo desenvolvido em React Native com Expo para ajudar o usuário a decidir o que fazer de acordo com suas respostas, como modalidade, humor, tempo, dinheiro e disposição.

O aplicativo pode indicar atividades como comer fora, ir ao cinema, tomar café, passear, ir a eventos, jogar ou assistir a um filme em casa.

## 2. Estrutura do projeto

```text
Roleta_do_tedio/
│
├── backend/
│   ├── package.json
│   ├── package-lock.json
│   ├── server.js
│   ├── db.js
│   └── .env
│
├── src/
│   ├── app/
│   │   ├── index.tsx
│   │   ├── explore.tsx
│   │   └── _layout.tsx
│   │
│   ├── components/
│   │   ├── ParticipanteItem.tsx
│   │   ├── MapaLeaflet.tsx
│   │   ├── MapaLeaflet.web.tsx
│   │   ├── ResultadoLocais.tsx
│   │   ├── ResultadoFilmes.tsx
│   │   ├── ResultadoEventos.tsx
│   │   ├── ResultadoReceitas.tsx
│   │   └── ResultadoJogos.tsx
│   │
│   ├── data/
│   │   ├── atividades.ts
│   │   └── jogos.ts
│   │
│   └── services/
│       ├── overpass.ts
│       ├── openMeteo.ts
│       ├── receitas.ts
│       ├── filmes.ts
│       ├── eventos.ts
│       └── backend.ts
│
├── HISTORICO.md
├── package.json
└── .gitignore

src/app/

Contém as telas e o fluxo principal do aplicativo.

index.tsx — controla o fluxo da roleta, perguntas, escolhas e resultado final.
_layout.tsx — configura a navegação do Expo.
explore.tsx — tela padrão do projeto Expo, mantida na estrutura.
src/components/

Contém componentes reutilizáveis responsáveis pela apresentação dos resultados.

ParticipanteItem.tsx — apresenta participantes.
MapaLeaflet.tsx — mapa utilizado no aplicativo.
MapaLeaflet.web.tsx — versão do mapa específica para Web.
ResultadoLocais.tsx — mostra locais encontrados.
ResultadoFilmes.tsx — mostra filmes.
ResultadoEventos.tsx — mostra eventos.
ResultadoReceitas.tsx — mostra receitas.
ResultadoJogos.tsx — mostra jogos.
src/data/

Contém dados que pertencem ao próprio aplicativo.

atividades.ts — lista de atividades e informações usadas pela roleta.
jogos.ts — lista de jogos disponíveis.
src/services/

Contém as integrações com APIs e com o backend.

overpass.ts — busca locais próximos usando OpenStreetMap/Overpass.
openMeteo.ts — busca informações de clima.
receitas.ts — busca receitas.
filmes.ts — busca informações de filmes.
eventos.ts — busca eventos.
backend.ts — comunica o aplicativo com o backend e salva/busca sessões.
backend/

Contém o servidor responsável pela comunicação com o banco de dados.

server.js — cria a API, recebe requisições e disponibiliza as rotas.
db.js — configura a conexão com PostgreSQL.
package.json — dependências e comando para iniciar o backend.
.env — contém a conexão com o banco. Não deve ser enviado ao GitHub.

Como executar o projeto
Frontend

Na pasta principal:

npm install

Depois:

npx expo start

Para abrir no navegador, usar a opção Web do Expo.

Backend

Abrir outro terminal e entrar na pasta:

cd backend

Instalar as dependências:

npm install

Iniciar:

npm start

O backend será iniciado na porta definida pela variável PORT ou, localmente, na porta 3000.

Para verificar:

http://localhost:3000

Para testar o banco:

http://localhost:3000/teste-banco

Para consultar as sessões:

http://localhost:3000/sessoes



```

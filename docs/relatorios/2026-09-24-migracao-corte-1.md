# Relatório de Sessão

## Metadata da Sessão

| Campo | Valor |
| --- | --- |
| **Título** | Primeira migração e validação do corte 1 do backend contra o PostgreSQL real |
| **Data** | 2026-09-24 20:57:15 -03 |
| **Autor** | Carlos Antunes `<carlosantunes.dev@gmail.com>` |
| **LLM Utilizada** | Claude Code |
| **Modelo** | Claude Sonnet 5 (`claude-sonnet-5`) |
| **Reasoning Effort** | Alto (`/effort high`, definido no início da sessão) |
| **Branch de Trabalho** | `feature/migracao-corte-1` (a partir de `origin/develop`) |

---

## 1. Resumo Executivo

Com autorização explícita do usuário para subir o banco local, gerar e aplicar a
primeira migração e rodar `npm run dev`, o corte 1 (`auth`, `users`, `apis`,
`tasks` com tags) foi validado de ponta a ponta contra o PostgreSQL 17 real, pela
API (`curl`) e pelo front de login do Codex (MCP de navegador).

O único desvio encontrado foi de **ferramenta**, não das consultas: o RC do
Prisma 8 não migra `Numeric @default(0)`. Todas as consultas do corte 1
(transações, `include` N:M, `count` da paginação, limpeza da cadeia de refresh
tokens) se comportaram como o esperado. Nenhum código de produção do backend
precisou mudar.

---

## 2. Detalhamento das Alterações Realizadas

### Migração e contrato

- `backend/migrations/app/20260924T2350_corte_1_inicial`: 64 operações, 12 tabelas,
  gerada com `prisma migration plan` (offline) e aplicada com `prisma db migrate`.
- **Desvio 1: `Numeric @default(0)` não migra.**
  - `migration plan` falhou com `pg/numeric@1 database JSON value must be a decimal
    string`, porque `contract.json` emitia `"value": 0`.
  - Com `@default("0")`, o plano passou, mas `db migrate` foi revertido: a
    verificação pós-migração leu o default do banco como função
    (`'0'::numeric(10,2)`) e o contrato esperava um literal. Nenhuma tabela ficou.
  - Solução: `Finance.value` passou a
    `@default(dbgenerated("'0'::numeric(10,2)"))`, mesma semântica de banco. É a
    única mudança no contrato, necessária para a migração; `contract.json` e
    `contract.d.ts` foram reemitidos.
- `backend/src/prisma/contract.test.ts`: impede colunas `numeric` com default
  literal no `contract.json`.

### Front e documentação

- `frontend/src/proxy.conf.json`: `/tasks/**` e `/apis/**` adicionados.
- `docs/plano-corte-1-backend.md`: migração registrada como feita, com o fluxo real
  do CLI (`contract emit`, `migration plan`, `db migrate`) e o limite do `numeric`.

### Resultados da validação de ponta a ponta (API)

Executada com `npm run dev` (porta 8080) e banco `postgres17`. Comportamento
observado, todos conforme o contrato HTTP do plano:

- **register:** 201 com cookie `miuly_refresh` (`HttpOnly`, `SameSite=Strict`,
  `Path=/auth`); e-mail e username normalizados; 409 para e-mail e para username
  duplicados. **Transação:** com username duplicado, o `User` já inserido foi
  desfeito (1 usuário, 1 perfil, sem órfão).
- **login:** 401 com mensagem única; 200 com sessão e token novos.
- **refresh:** 200 e cookie rotacionado; reapresentar o token antigo em menos de
  30 s deu 409; com o sucessor envelhecido além de 30 s, 401 e **todas** as sessões
  do usuário marcadas `reuse`; token mais recente também recusado depois disso.
- **logout:** 200, cookie apagado, sessão `logout`, idempotente (também sem cookie);
  refresh depois do logout dá 401.
- **`/auth/me`, `/users/me`:** dados corretos; sem token, 401.
- **`PATCH /users/me` e perfil:** ok; `urlPhoto` `http://` rejeitada com 400 e
  `issues`.
- **troca de senha:** senha atual errada 401; correta 200 e todas as sessões
  `password`; senha velha recusada e nova aceita.
- **`/apis`:** CRUD completo; título duplicado 409; mesmo `urlBase`/`slugUrl` com
  outro título aceito; `endTime` anterior ao `startTime` salvo, 400; filtro
  `status` e paginação com `totalItems` corretos (**`count` ok**); 404 depois do
  `DELETE`.
- **`/tasks` com tags:**
  - "Casa"/"casa" viram uma tag só; `tasks_tags` com os vínculos certos e `high`
    gravado como `urgent`;
  - **`include` N:M ok** em `GET`, listagem e `PATCH`: `tags` substitui o conjunto,
    omitir mantém e `[]` remove;
  - listagem em ordem crescente de `scheduledAt`; filtros `done`, `priority` e
    `from`/`to` ok;
  - outro perfil recebe 404 em `GET`, `PATCH` e `DELETE` e lista vazia; mesma tag em
    outro perfil é aceita;
  - `DELETE` remove os vínculos e mantém as tags.
- **Limpeza da cadeia de refresh tokens (FK `previous_token_id`):** no login,
  sessões revogadas há mais de 7 dias (cadeia longa) e sessões com token expirado há
  mais de 7 dias foram apagadas sem violar a FK (10 para 5 sessões, 15 para 5
  tokens; depois 5 para 4).

### Validação pelo front (MCP de navegador, `lazy-mcp-validation`)

`ng serve` na porta 4200 com o proxy; contexto isolado do navegador; DOM e rede,
sem captura de tela.

- `/login` com senha errada: `role="alert"` com "E-mail ou senha inválidos"; `POST
  /auth/login` 401.
- Login válido: `POST /auth/login` 200, redirecionamento para `/` com "Sessão ativa
  para Nome Novo" e botão "Sair".
- Recarregar a página: `POST /auth/refresh` 200 e sessão restaurada; `localStorage`
  e `sessionStorage` vazios e `document.cookie` vazio (cookie `HttpOnly`).
- "Sair": `POST /auth/logout` 200, vai para `/login`; recarregar mostra só
  "Entrar" e "Criar conta".

### Commits Criados

- `27171da` — `feat(prisma): adiciona primeira migração do corte 1`
- `7e694ad` — `test(prisma): impede default literal em colunas numeric`
- `f3d7a0a` — `feat(frontend): adiciona /tasks e /apis ao proxy de desenvolvimento`
- `6ea8fb7` — `docs(backend): registra migração aplicada e limite do default numeric`

### Validações Executadas

- `npm run check` (backend): exit 0.
- `npm test`: 33 arquivos e 228 testes aprovados (o novo é `contract.test.ts`).
- `npx prettier --check` nos arquivos novos: aprovado.
- **Banco:** `docker compose up -d database`, `prisma db migrate` e `npm run dev`
  executados com autorização do usuário; o banco local `miuly` (porta 5436) ficou
  com a migração aplicada e com dados de teste (usuários `e2e@example.com` e
  `outro@example.com` e suas tarefas, tags e sessões). Em alguns testes, as datas
  de `refresh_tokens`, `sessions.revoked_at` e `refresh_tokens.expires_at` foram
  alteradas por SQL para simular o tempo.
- Não foi executado `ng test` do front nem `npm run check` do front.

---

## 3. Observações, Riscos e Próximos Passos

- **`JWT_SECRET` ausente no ambiente:** apesar de a tarefa dizer que estava em
  `backend/.env`, `npm run dev` falhou com `JWT_SECRET` `undefined`. O `.env` não
  pôde ser lido pela sessão (leitura negada), então a causa não foi confirmada
  (chave ausente, com outro nome ou vazia). A validação usou um segredo descartável
  passado só no ambiente do processo; o `.env` não foi alterado. **Ação:** conferir
  `backend/.env`.
- **409 em criação concorrente de tag nova:** 1 de 8 `POST /tasks` simultâneos com a
  mesma tag nova respondeu 409 (a transação foi revertida, sem tarefa órfã; ficaram
  as 7 tarefas dos requests com 201). É o comportamento documentado no plano. Uma
  repetição automática no servidor evitaria o 409, mas muda o contrato; fica como
  decisão do usuário.
- **`updatedAt` pode ser anterior a `createdAt` em ~1 ms** na criação (`createdAt`
  vem do `now()` do banco e `updatedAt` do relógio da aplicação). Cosmético.
- **Limite de tentativas de login** continua obrigatório antes de deploy público.
- **Trabalho paralelo preservado, sem autoria desta sessão:** `.angular/` e o
  relatório `2026-09-24-corte-1-backend-modulos.md`, ambos não rastreados.
- **Próximos passos:** conferir o `.env`; decidir sobre a repetição de tags
  concorrentes; seguir para o próximo corte (finanças ou calendário).

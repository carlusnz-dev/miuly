# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Governança compartilhada

As regras de atuação valem para todos os agentes (Claude Code, Codex e Antigravity/Gemini)
e ficam em um único lugar — leia e obedeça:

@AGENTS.md

Pontos que mais impactam o trabalho do Claude:

- Implementar código de produção só com pedido explícito e escopo claro
  ([ADR 0001](docs/adr/0001-uso-de-llm-para-codificacao.md)). Revisões formais são somente leitura.
- **Migrações e qualquer comando que leia ou altere o banco exigem autorização separada**
  — inclusive `npm run dev`, que conecta ao PostgreSQL na inicialização.
- Nunca commitar em `main`/`develop`; branches `feature/<slug>` ou `fix/<slug>` a partir de
  `develop`; commits no formato exato `tipo(modulo): descrição`, em português.
- O repositório costuma ter trabalho não commitado do usuário ou de outro agente: rode
  `git status` antes de editar e não toque no que não pertence à tarefa.
- Mudança de comportamento, contrato, arquitetura ou segurança atualiza o documento
  correspondente em `docs/` no mesmo commit.

## Comandos (executar em `backend/`)

```bash
npm install
npm run check          # tsc -p tsconfig.app.json --noEmit
npm test               # vitest run — testes unitários (*.test.ts ao lado do código)
npm run fmt            # prettier --write . (aspas simples, 80 colunas, LF)
npm run contract:emit  # recompila src/prisma/contract.prisma -> contract.json + contract.d.ts
npm run dev            # tsx watch em src/server.ts (porta 8080; conecta ao banco)
docker compose up -d database   # na raiz: PostgreSQL 17 em localhost:5436 (user/db: miuly)
```

Testes usam **Vitest**, com arquivos `*.test.ts` ao lado do código e fakes em
`src/test/`. Repositórios são testados com um `db` falso; nenhum teste acessa o banco.

## Stack e particularidades

- Node + Express 5 + TypeScript 7, ESM (`"type": "module"`), executado com `tsx`.
  `moduleResolution: bundler` → imports relativos sem extensão.
- `tsconfig` estrito com `verbatimModuleSyntax` (use `import type`),
  `exactOptionalPropertyTypes` e `noUncheckedIndexedAccess`. Não leia `process.env`
  direto: use `env` de `src/core/env.ts`, validado por Zod na inicialização.
- `tsc --noEmit` no `tsconfig.json` raiz (composite) pode aprovar código com erro por
  causa do `tsconfig.tsbuildinfo`; valide sempre com `npm run check`. Mesmo o `check`
  pode repetir diagnósticos antigos guardados em `dist/*.tsbuildinfo` depois de mudar
  o tsconfig; se o resultado não fizer sentido, apague esses arquivos (ignorados pelo
  Git) e rode de novo.
- `lib` inclui `esnext.temporal`: o codec `timestamptz` do Prisma usa `Temporal.Instant`.
  Converta com `src/prisma/instant.ts`; colunas `VarChar(n)` exigem `varchar(valor, n)`
  de `src/prisma/varchar.ts`.
- **Prisma ORM 8 RC**, que difere bastante do Prisma 5/6 conhecido: não há `schema.prisma`
  nem `PrismaClient`. O contrato é `backend/src/prisma/contract.prisma`, configurado em
  `backend/prisma.config.ts`; o cliente é `db` em `backend/src/prisma/db.ts`
  (`postgres<Contract>(...)`, consultas via `db.orm.public.<Model>`). Consulte
  `backend/prisma-8.md` e a documentação atual (context7) antes de escrever código Prisma.
- Contrato alterado ⇒ rodar `contract:emit` e versionar `contract.json`/`contract.d.ts`
  junto. Antes de criar migrações, leia `docs/data-model-review.md` (decisões pendentes,
  p. ex. se `Bank` é conta ou instituição).
- Zod 4 valida dados desconhecidos na borda HTTP.

## Arquitetura

Dependências apontam para dentro: domínio e casos de uso não importam Express, Prisma,
Google ou Angular; adaptadores traduzem HTTP, banco e APIs externas. Tokens OAuth nunca
entram nas entidades centrais. A SPA Angular (`frontend/`) ainda não existe.

Composição atual:

- `src/server.ts` — processo: cria o app, conecta ao banco (`core/db.ts`) e escuta.
- `src/app.ts` — fábrica `app({ database, auth, enableLogging, debugMode })`: monta
  `/auth` e, atrás do `requireAuth`, `/users`, `/tasks` e `/apis`, antes do
  `errorHandler` global.
- `src/core/error.ts` + `error.middleware.ts` — hierarquia `ApiError`
  (`BadRequestError`, `NotFoundError`, `UnauthorizedError`, `ConflictError`) convertida em
  `{ ok: false, message }`. Erros de domínio não dependem de `Request`/`Response`.
- `src/core/base/` — classes abstratas mínimas (`BaseContract`, `BaseRepository`,
  `BaseService`, `BaseController`, `BaseRoutes`). Cada uma guarda privada só sua
  dependência direta (recebida no construtor) e a expõe por getter protegido.
  **Não** é CRUD genérico.

Padrão de módulo (`src/modules/<modulo>/`, descrito em `docs/architecture.md`):

```text
contract.ts   schemas Zod, DTOs e tipos públicos (sem tipos do ORM)
repository.ts porta de persistência + adaptador Prisma
service.ts    interface <Modulo>Service + classe <Modulo>ServiceImpl (extends BaseService)
controller.ts HTTP <-> service (handlers como arrow function)
routes.ts     registro das rotas no router
index.ts      composition root: único lugar que instancia implementações concretas;
              exporta só tipos (interface do service, portas) e a fábrica do módulo
```

Fluxo: `routes -> controller -> service -> repository (porta) <- adaptador Prisma`.
Entidades persistidas e respostas HTTP são tipos distintos; datas HTTP em ISO 8601.
Controllers declaram handlers com `handler`/`paginatedHandler` de
`src/core/http/handler.ts` (validação Zod de params/query/body, `present` para DTO e
envelope `{ ok, message, data }`); rotas protegidas usam `auth: true` e recebem o
`AuthContext` (`userId`, `profileId`). Todo repository de dados do perfil filtra por
`profileId`. Módulos do corte 1: `auth`, `users`, `tasks` (com tags) e `apis`; o plano
e o contrato HTTP estão em `docs/plano-corte-1-backend.md`.

Domínios previstos (`specs/README.md`): identity, tasks, finance, calendar, audit,
notifications. Requisitos e critérios em `docs/requirements.md`; especificações
verificáveis em `specs/`. Dinheiro é sempre decimal + código ISO 4217, nunca `float`.

## Skills e agentes

- `.claude/skills/` é **cópia** de `.agents/skills/` (fonte usada pelo Codex). Ao alterar
  uma skill, altere as duas e mantenha-as idênticas (`diff -r .agents/skills .claude/skills`).
- Skills do projeto: `role-dev`, `debug-code`, `pr-review`, `security-review`,
  `documentation-requirements`, `lazy-mcp-validation` (UX via MCP de navegador:
  DOM → JavaScript → captura de tela, nessa ordem).
- Agentes especializados do Codex ficam em `.codex/agents/` (revisor e guardião de
  integridade).
- Relatórios de sessão ficam em `docs/relatorios/AAAA-MM-DD-<slug>.md`, no formato de
  `docs/relatorios/template.md`; modelo de ADR em `docs/adr/template.md`. Gere relatórios
  com `/relatorio [slug]`.

## Integração com o Antigravity (`agy-bridge`)

- Varreduras pesadas de código, revisões adversárias de segurança/arquitetura e
  diagnósticos complexos podem ser delegados ao Antigravity via MCP `agy-bridge`.
- O workspace do Antigravity está descrito em `.agents/README.md` e `GEMINI.md`;
  suas regras ficam em `.agents/rules/`.

## Papéis e delegação via Orca

- O Claude é a LLM principal (arquitetura, código complexo, validação, debug, revisão e
  merge de PRs). O Codex implementa como dev sênior fullstack e o Gemini (Antigravity)
  documenta, cada um num worktree do Orca criado por tarefa em
  `~/orca/workspaces/miuly/<slug>`. Detalhes em `docs/organizacao-agentes.md`.
- Tarefas que geram commits são delegadas criando o worktree com o agente
  (`orca-ide worktree create --agent codex --prompt ...`; para o Gemini,
  `terminal create --command agy` e depois `wait`/`send`; skill `orca-cli`), com
  briefing autossuficiente no formato do documento acima. Consultas somente leitura
  ao Gemini vão pelo `agy-bridge`.
- Os agentes não fazem `git fetch`/`push` (SSH sem chave; o `agy` trava no `fetch`).
  O Claude atualiza as refs e publica por HTTPS com `gh auth git-credential`.
- Não edite os worktrees dos outros agentes; revise o resultado deles antes de PR ou merge.

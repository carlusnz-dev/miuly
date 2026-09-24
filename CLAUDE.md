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
  causa do `tsconfig.tsbuildinfo`; valide sempre com `npm run check`.
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
- `src/app.ts` — fábrica `app({ enableLogging, debugMode })`; rotas são registradas antes
  do `errorHandler` global.
- `src/core/error.ts` + `error.middleware.ts` — hierarquia `ApiError`
  (`BadRequestError`, `NotFoundError`, `UnauthorizedError`) convertida em
  `{ ok: false, message }`. Erros de domínio não dependem de `Request`/`Response`.
- `src/core/base/` — classes abstratas mínimas (`BaseContract`, `BaseRepository`,
  `BaseService`, `BaseController`, `BaseRoutes`). Cada uma guarda privada só sua
  dependência direta (recebida no construtor) e a expõe por getter protegido.
  **Não** é CRUD genérico.

Padrão de módulo (`src/modules/<modulo>/`, descrito em `docs/architecture.md`):

```text
contract.ts   schemas Zod, DTOs e tipos públicos (sem tipos do ORM)
repository.ts porta de persistência + adaptador Prisma
service.ts    um único service por módulo, métodos só para comportamento real
controller.ts HTTP <-> service (handlers como arrow function)
routes.ts     registro das rotas no router
index.ts      composition root: único lugar que instancia implementações concretas
```

Fluxo: `routes -> controller -> service -> repository (porta) <- adaptador Prisma`.
Entidades persistidas e respostas HTTP são tipos distintos; datas HTTP em ISO 8601.
Controllers declaram handlers com `handler`/`paginatedHandler` de
`src/core/http/handler.ts` (validação Zod de params/query/body, `present` para DTO e
envelope `{ ok, message, data }`). `modules/users` é o módulo de referência;
`modules/auth` está vazio.

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
  `docs/relatorios/template.md` (mantido pelo Codex). Gere com `/relatorio [slug]`.

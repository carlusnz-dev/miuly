# Inicio backend mvp
--- Cabeçalho ---
Autor: Claude Code
Data: 2026-07-04
Módulos: Backend
Atividade: Inicio backend mvp

# Corpo

## Contexto

Carlos definiu o prazo do MVP (16/jul/2026) e ainda não tinha começado o back-end.
Pediu um "norte" de como estruturar um projeto Express (framework "lite", como
Flask) do zero: por onde começar (`app.ts`, porta, rotas) e como organizar os
diretórios, considerando que o Model já está resolvido via Prisma.

## Tópicos abordados

1. Estado atual real do backend: `package.json`, `schema.prisma` (models `User`,
   `Finaces`, `Types`, `Bank`, `Task`), migration `20260702010441_init` já aplicada,
   Prisma Client já gerado em `src/generated/prisma`, e `src/lib/prisma.ts` já
   instanciando o client via `@prisma/adapter-pg`. `src/app.ts` está vazio.
2. Ordem correta de bootstrap num framework "lite": servidor mínimo (`app.ts` com
   `express()`, middlewares globais, `app.listen`) **antes** de rotas de domínio —
   e só depois construir o restante de baixo para cima (repository → service →
   controller → route).
3. Por que a pasta `views/` do plano original não se aplica: numa API REST
   consumida pelo Next.js, quem renderiza é o front-end; o backend não deveria ter
   camada de view.
4. Papel do Prisma na arquitetura: `schema.prisma` + migration = a camada de Model.
   O repository não define o modelo, só consome `prisma.<entidade>.<método>()`.
5. Bug encontrado no `package.json`: script `dev` aponta para `./scr/app.ts` (typo,
   deveria ser `./src/app.ts`).
6. Dependência entre módulos do MVP: `Bank`/`Task` já têm `user_id` obrigatório
   (ADR-0002), então Auth (RF006) precisa existir antes dos outros três módulos
   funcionarem ponta a ponta.

## Decisões e recomendações

- **Recomendação (a validar por Carlos):** seguir ordem de implementação
  Auth → Financeiro → To-do → Google Calendar, já que os dois módulos de domínio
  dependem de `user_id` de um usuário autenticado.
- **Recomendação:** estrutura de pastas `src/{config, routes, controllers,
  services, repositories, middleware}` — sem `models/` (isso já é o
  `schema.prisma`) e sem `views/`.
- **Ação direta (não é decisão de arquitetura):** corrigir o typo `scr` → `src`
  no script `dev` do `package.json` antes de rodar `npm run dev`.

## Aprendizados

- Num framework minimalista (Express/Flask), o "boilerplate" que frameworks
  full-stack (Rails, Django, NestJS) escondem — bootstrap do servidor, middlewares,
  roteamento manual — precisa ser montado à mão; é isso que o deixa mais didático
  para entender o que cada peça faz.
- Clean Architecture em Express na prática: **Controller** só traduz
  HTTP (`req`/`res`) para chamada de função; **Service** contém a regra de
  negócio e validações; **Repository** é a única camada que fala com o Prisma.
- Prisma como ORM substitui a camada de "Model" tradicional: o schema é a fonte
  de verdade do formato dos dados, e toda mudança nele segue o ciclo
  `editar schema.prisma` → `npx prisma migrate dev --name X` → client
  regenerado automaticamente.

## Links e materiais

- Bootstrap mínimo de servidor e roteamento no Express: [Express — Basic routing](https://expressjs.com/en/starter/basic-routing.html)
- Clean Architecture (Controller/Service/Repository): [The Clean Architecture — Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- Ciclo `schema.prisma` → migration → client: [Prisma Migrate — Getting started](https://www.prisma.io/docs/orm/prisma-migrate/getting-started)

## Próximos passos

- Corrigir o typo `scr` → `src` em `backend/package.json`.
- Escrever o `app.ts` mínimo (express + middlewares + `app.listen`) e validar
  subindo o servidor localmente.
- Criar a estrutura de pastas `routes/controllers/services/repositories/middleware`
  dentro de `backend/src/`.
- Começar a camada de Auth (RF006) escrevendo repository → service → controller →
  route, na ordem discutida.
- Levar a seção "Aprendizados" acima para o Obsidian.

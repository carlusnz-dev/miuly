# CLAUDE.md — Miuly

Personal Life ERP para centralizar tarefas, finanças, eventos do Google Calendar e
notas (Obsidian). Projeto pessoal com **foco educacional em Engenharia de Software**.

## Regras de interação (LEIA ANTES DE AGIR)

O dono do projeto (Carlos, estudante de Eng. de Software, 3º período) está aprendendo
back-end "à moda antiga" e usa pouca IA generativa **no código** de propósito.

1. **Carlos é o Arquiteto.** Ele define arquitetura, modelagem de banco e contratos de API.
   Você **não gera arquitetura do zero** — você valida propostas dele e aponta falhas
   (gargalos de performance, edge cases, segurança).
2. **Ele escreve a lógica de negócio na mão.** Não entregue implementação de regra de
   negócio pronta a menos que ele peça explicitamente. Prefira: explicar o conceito,
   apontar a doc oficial, revisar o código dele, sugerir a direção.
3. **A IA pode escrever:** documentação, testes unitários, relatórios, boilerplate
   estrutural e interfaces previamente desenhadas por ele.
4. **Documentação-first.** Decisões arquiteturais viram ADR em `docs/adr/` antes de codar.
5. **Compreensão obrigatória.** Nada gerado por IA entra no projeto sem que ele entenda
   100% do funcionamento. Ao entregar algo, explique o *porquê*, não só o *o quê*.

Quando ele pedir ajuda para "fazer" um módulo, o padrão é **ensinar e revisar**, não
codar por ele — confirme o modo se houver dúvida.

## Stack

- **Front-end:** **Angular** (SPA) — ver `docs/adr/0009-troca-do-framework-de-frontend-para-angular.md`.
  Substituiu Next.js/React; **Framer Motion saiu junto** e a biblioteca de animação
  ainda não foi escolhida.
- **Back-end:** Express (Node.js + TypeScript), Clean Architecture
  (Controllers → Services → Repositories) — self-hosted em Raspberry Pi.
- **Banco:** PostgreSQL — local em desenvolvimento (ADR-0003), Supabase em produção.
  ORM **Prisma** (em uso, com `@prisma/adapter-pg`; ainda sem ADR próprio).
- **Validação:** Zod na borda (ADR-0005). **Auth:** JWT em cookie `httpOnly` (ADR-0006).
- **Testes:** Vitest com repositórios mockados, em `backend/tests/`.
- Topologia de deploy: ver `docs/adr/0001-topologia-de-deploy.md`.

## Estrutura

- `frontend/` — app Angular.
- `backend/` — API Express: `src/{routes,controllers,services,repositories,middleware,types,lib}`
  e `src/generated/prisma` (client gerado, não editar). Testes em `backend/tests/`.
- `docs/` — documentos do projeto, `docs/adr/` (ADRs), `docs/relatorios/` (memória de
  sessão) e `docs/rastreabilidade-requisitos.md` (**fonte única do status dos RFs**).
- `.claude/` — agentes, comandos e skills do Claude Code (ver `.claude/README.md`).

## MVP atual

**O prazo original (16/jul/2026) passou.** Estado real em
`docs/rastreabilidade-requisitos.md` — sempre conferir lá antes de afirmar o que está
pronto:

- **RF006 (auth)** e **RF002 (financeiro)** — backend fechado.
- **RF001 (to-do)** — backend fechado; sem front.
- **RF008 (Google Calendar)** — não iniciado; principal candidato a sair do MVP.
- **Front-end** — recomeçando do zero em Angular.

Escopo e cronograma originais em `docs/plano-mvp.md` (desatualizado quanto a datas).

## Convenções

- Idioma: responder e documentar em **português (pt-BR)**.
- Commits seguem **Conventional Commits**, um assunto por commit.
- Ao criar decisões arquiteturais, use o `docs/adr/template.md` e atualize o índice em
  `docs/adr/README.md`. ADR aceito é **imutável**: mudança vira ADR novo.
- **Ownership e recorte de campos ficam no Service** (ADR-0007): o repositório é burro,
  o service confere `user_id` e nunca devolve a coluna na resposta.
- Todo caminho de banco em `try/catch` — sem isso um erro do Prisma vira
  `unhandledRejection` e **derruba o processo** em vez de responder 500.
- `tsconfig` com `exactOptionalPropertyTypes: true`: `campo?: T` e `campo?: T | undefined`
  são tipos diferentes. Por isso os updates montam o objeto com spread condicional
  (`...(data.x !== undefined && { x: data.x })`) — é exigência do compilador, não estilo.
- `Pick`/`Omit` **não recortam dados em runtime**, só anotam. Quem recorta é o `omit` do
  Prisma ou o destructuring.
- Rodar testes de dentro de `backend/` — na raiz o Vitest tenta executar os specs do
  Angular e falha.

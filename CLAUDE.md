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

- **Front-end:** Next.js (React) + Framer Motion — deploy na Vercel.
- **Back-end:** Express (Node.js + TypeScript), Clean Architecture
  (Controllers → Services → Repositories) — self-hosted em Raspberry Pi.
- **Banco:** PostgreSQL via Supabase, ORM Prisma (ou Drizzle — decisão pendente de ADR).
- Topologia de deploy: ver `docs/adr/0001-topologia-de-deploy.md`.

## Estrutura

- `frontend/` — app Next.js.
- `backend/` — API Express (`src/{models,routes,middleware,config}`).
- `docs/` — documentos do projeto (colados do Obsidian) e `docs/adr/` (ADRs).
- `.gemini/` — configs e regras do Antigravity.

## MVP atual (prazo 16/jul/2026)

Três módulos ponta a ponta: **Financeiro (RF002)**, **To-do List (RF001)** e
**Google Calendar (RF008)**, sobre uma base de **autenticação (RF006)**. Escopo e
cronograma completos em `docs/plano_mvp.md`. Demais requisitos estão no backlog.

## Convenções

- Idioma: responder e documentar em **português (pt-BR)**.
- Commits e docs seguem o estilo já presente no repositório.
- Ao criar decisões arquiteturais, use o `docs/adr/template.md` e atualize o índice em
  `docs/adr/README.md`.

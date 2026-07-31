# Miuly

Miuly é um Personal Life ERP desenvolvido para centralizar e gerenciar aspectos da vida pessoal, integrando calendário, finanças e gerenciamento de conhecimento.

## Arquitetura e Stack

Este projeto segue uma arquitetura baseada em back-end separado do front-end. Essa decisão permite a execução de tarefas em background e a leitura de arquivos do sistema local (Cofre do Obsidian).

- **Front-end:** Angular (SPA)
- **Back-end:** Express.js (Node.js + TypeScript)
- **Banco de Dados:** PostgreSQL (local em desenvolvimento, Supabase em produção) via Prisma

O front-end começou como Next.js (React) e migrou para Angular antes de qualquer tela ser escrita — motivos e consequências em [ADR-0009](docs/adr/0009-troca-do-framework-de-frontend-para-angular.md).

## Metodologia de Desenvolvimento

Este projeto possui um foco educacional em Engenharia de Software. As práticas adotadas incluem:

- **Design First:** Modelagem de banco de dados e definição de contratos de API são feitos antes da codificação.
- **Clean Architecture:** O Back-end utiliza separação de responsabilidades (Controllers, Services, Repositories).
- **Decisões registradas:** Toda escolha cara de reverter vira um ADR em [`docs/adr/`](docs/adr/README.md).
- **Uso Consciente de IA:** A Inteligência Artificial atua estritamente como revisora de código (Code Review) e validadora de arquitetura, nunca como solucionadora principal. Todo código escrito passa por revisão humana para fixação de aprendizado.

## Estrutura do Repositório

```
backend/     API Express + Prisma
  src/
    routes/         definição das rotas e authMiddleware
    controllers/    validação de entrada com Zod e status HTTP
    services/       regra de negócio, ownership e recorte de campos
    repositories/   acesso ao banco via Prisma
    middleware/     autenticação por JWT em cookie httpOnly
    types/          schemas Zod e tipos de contrato
    lib/            Prisma client e logger
  tests/            testes unitários (Vitest, repositórios mockados)
  prisma/           schema e migrations

frontend/    aplicação Angular

docs/        documentação do projeto
  adr/               Architecture Decision Records
  relatorios/        memória das sessões de trabalho
  rastreabilidade-requisitos.md   status real de cada requisito

.claude/     agentes, comandos e skills do Claude Code
```

## Estado do projeto

O back-end tem autenticação, finanças, contas bancárias, categorias e tarefas
funcionando ponta a ponta; o front-end está começando. O status detalhado de cada
requisito, com os gaps conhecidos, fica em
[`docs/rastreabilidade-requisitos.md`](docs/rastreabilidade-requisitos.md) — essa é a
fonte da verdade, não o cronograma.

## Rodando o back-end

```bash
cd backend
npm install
npx prisma migrate dev    # aplica as migrations
npm run dev               # sobe em http://localhost:8000
npm test                  # roda os testes (não precisa de banco)
```

Requer um `.env` com a `DATABASE_URL` do Postgres e o `JWT_SECRET`.

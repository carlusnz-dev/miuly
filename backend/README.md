# Miuly — Backend

API HTTP do Miuly. Concentra a composição da aplicação, integrações externas e
adaptadores de persistência, preservando as regras de negócio fora dos detalhes
de Express e Prisma.

## Tecnologias

- Express 5 e TypeScript;
- Zod para validação de entrada e metadados;
- Prisma ORM 8 RC com PostgreSQL;
- `tsx` para execução local.

## Estrutura atual

```text
src/
├── app.ts                 # composição e rotas HTTP provisórias
├── server.ts              # processo HTTP
├── core/                  # erros e logging compartilhados
└── prisma/                # contrato, artefatos gerados e cliente do banco
```

Novos domínios devem separar contratos de aplicação, regras de negócio e
adaptadores. Evite importar Express ou Prisma no núcleo de domínio.

## Configuração

Copie `.env.example` para `.env` e informe `DATABASE_URL`. Não versione segredos
ou tokens OAuth. O PostgreSQL deve ser versão 15 ou superior.

## Comandos

```bash
npm install
npm run dev
npm run check
npm run fmt
npm run contract:emit
```

`contract:emit` recompila `src/prisma/contract.prisma` e atualiza os arquivos
gerados `contract.json` e `contract.d.ts`; ambos devem acompanhar uma alteração
válida do contrato.

## Situação da validação

Em 2026-09-21, `npm run contract:emit` e `npm run check` foram executados com
sucesso. O contrato emitido inclui identidade, tarefas, finanças, eventos do
Google Calendar e auditoria. Alterações futuras no contrato devem regenerar os
artefatos e revisar o diff. Detalhes e decisões pendentes estão em
[docs/data-model-review.md](../docs/data-model-review.md).

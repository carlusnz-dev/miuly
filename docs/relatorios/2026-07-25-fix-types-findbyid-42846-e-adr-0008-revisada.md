# Relatório de sessão — 2026-07-25 — Fix do `findById` do Types (42846) e revisão da ADR-0008

--- Cabeçalho ---
Autor: Carlos e Claude
Data: 2026-07-25
Módulos: Backend, Types, Prisma/Migrations
Atividade: Diagnóstico e correção do erro Postgres 42846 no `GET /type/:id`, revisão da ADR-0008 (`applies_to` de enum-array para `String[]`), migration e reset do banco de dev

# Corpo

## Contexto

Carlos concluiu o CRUD (parcial) do módulo **Types** e, ao testar o `GET /type/1`
(`findById`), o servidor **caiu** com um erro do Prisma. A sessão foi de depuração
sistemática: rastrear o caminho da requisição camada a camada, achar a causa-raiz,
decidir a correção (via ADR) e validar ponta a ponta com `curl`.

## O erro

```
DriverAdapterError: cannot cast type "AppliesTo" to text[]
  originalCode: '42846'  (Postgres — cannot cast)
  clientVersion: '7.8.0'
```

O processo Node **morreu** (rejeição não tratada), em vez de responder um 500.

## Diagnóstico (causa-raiz)

1. **O código estava correto.** Rota → `authMiddleware` → controller (`Number(req.params.id)`,
   `Number(req.userId)`) → service (ownership + recorte ADR-0007) → repository
   (`prisma.types.findFirst({ where: { id, user_id } })`). Nada errado no fluxo.
2. **A causa era de modelagem + infraestrutura.** A coluna `applies_to` era um **array de
   enum nativo** do Postgres (`"AppliesTo"[]`). Ao **ler** a linha via driver adapter
   `@prisma/adapter-pg`, o engine serializa a coluna gerando o cast `applies_to::text[]`.
   O Postgres converte um enum **escalar** para `text`, mas **não existe cast de `enum[]`
   para `text[]`** → erro 42846.
3. **Detalhe revelador:** a tabela `Types` tinha **0 linhas** e mesmo assim estourou — o
   Postgres valida o cast no **planejamento** do `SELECT`, antes de olhar qualquer linha.
4. É o **mesmo 42846** que já mordera na migration de 23/07 (lado da escrita). Enum-array
   nativo cobra o preço nos dois lados: escrita e leitura.

### Nota de método
Delegou-se a leitura do módulo ao agy-bridge (Gemini) para poupar contexto — bom para
**extrair trechos**, mas o modelo cravou **3 causas falsas** (config global do Prisma:
`PrismaPg`, `provider`, `datasource.url`). Foram descartadas por um teste simples:
*"config global quebrada derrubaria User e Bank também — e eles funcionam"*. Lição:
diagnóstico de IA delegada é hipótese, não veredito; validar contra o que já se sabe.

## Decisão (ADR-0008 revisada)

`applies_to` deixa de ser `AppliesTo[]` (enum nativo) e passa a **`String[]`**. A garantia
do domínio (`FINANCES`/`TASK`, lista não vazia) fica **100% no Zod**, na borda — onde já
estava sendo aplicada de fato.

- O `enum AppliesTo` **continua declarado** no `schema.prisma` como **fonte única dos
  valores** para o `z.enum(AppliesTo)` — o contrato de entrada (`types.type.ts`) **não
  muda** e continua compilando.
- Tudo o mais da ADR-0008 permanece: `Types` por usuário, `onDelete: Cascade`,
  `@@unique([user_id, name])`, FKs `Restrict` com verificação de uso no service.
- Isto reverte, na prática, a alternativa "manter `String[]` validando só no Zod" que fora
  **rejeitada** em 23/07 — a rejeição não previra o atrito enum-array + driver adapter,
  que inverteu o custo-benefício. ADR-0008 promovida de **Proposto** a **Aceito (revisado)**.

## Execução

1. **ADR-0008** — status atualizado e seção *Revisão (2026-07-25)* adicionada com motivo,
   decisão revisada e consequências.
2. **schema.prisma** — `applies_to AppliesTo[]` → `applies_to String[]`.
3. **Migration** — `npx prisma migrate dev --create-only` para **inspecionar** o SQL antes
   de aplicar. Prisma optou por **DROP + ADD** da coluna (warning de data loss; inócuo com
   tabela vazia), o que **contorna o cast** — não precisou de `ALTER ... USING`.
   Migration: `20260725073025_applies_to_enum_array_to_string`.
4. **Drift / reset** — o `migrate` acusou drift herdado da migration `20260723042703`
   **editada após aplicada** (o problema de shadow database de 23/07). Com autorização
   explícita do Carlos (o Prisma tem guard-rail próprio contra IA rodando `reset`),
   `prisma migrate reset` limpou o histórico. Custo: 9 usuários + 4 bancos de **teste**
   perdidos (banco de dev, `localhost:5432`).
5. **Verificação** — script `tsx` semeou usuário + type e releu via `findFirst`
   (leitura OK, sem 42846); JWT assinado à mão para o teste HTTP.

## Resultado (validado por `curl`)

```
GET http://localhost:8000/type/1   (Cookie: SESSIONID=<jwt>)
→ HTTP/1.1 200 OK
{"ok":true,"data":{"id":1,"name":"Alimentação","applies_to":["FINANCES","TASK"],
                   "created_at":"...","updated_at":"..."}}
```

Log do servidor: `Tipo foi encontrado!` — sem crash. Recorte da ADR-0007 confirmado
(`user_id` ausente na resposta).

## Aprendizados (para o Obsidian)

- **Postgres 42846 morde nos dois lados** — escrita (migration, `USING`) e leitura
  (serialização do driver adapter). Array de enum nativo é caro.
- **Não existe cast `enum[]` → `text[]`** no Postgres; só o escalar `enum` → `text`.
- **Cast é validado no plano do SELECT** — estoura mesmo com a tabela vazia.
- **Prisma resolve troca de tipo incompatível com DROP + ADD da coluna** (perde dados)
  quando não há cast automático — daí o warning de data loss.
- **`await` no banco sem `try/catch` derruba o processo** (unhandled rejection) — a origem
  do "servidor caiu" em vez de um 500 limpo.
- **Diagnóstico de IA delegada ≠ verdade** — validar contra o comportamento conhecido do
  resto do sistema.
- **`prisma migrate reset` tem guard-rail anti-IA** — exige consentimento textual explícito
  do usuário via variável de ambiente.

## Links e materiais

- [Prisma — Driver adapters](https://www.prisma.io/docs/orm/overview/databases/database-drivers)
- [Prisma — Scalar lists / arrays](https://www.prisma.io/docs/orm/prisma-client/special-fields-and-types/working-with-scalar-lists-arrays)
- [Prisma — migrate reset & shadow database](https://www.prisma.io/docs/orm/prisma-migrate/workflows/development-and-production)
- [prisma-engines#4453 — cast de texto sobre colunas de enum](https://github.com/prisma/prisma-engines/pull/4453)
- [Node.js — event: `unhandledRejection`](https://nodejs.org/api/process.html#event-unhandledrejection)

## Próximos passos / Pendências

1. **Robustez (prioritário):** envolver o caminho do banco em `try/catch` no
   service/repository do Types, retornando `{ ok:false, reason:'error' }` (500 limpo) em
   vez de derrubar o processo.
2. **CRUD de Types** — completar `create`/`update`/`delete`; delete de tipo em uso deve
   checar vínculos (`Restrict`) e retornar conflito.
3. **Finances** — `createFinancesService`/`updateFinanceService` validar `type_id`
   (existe + pertence ao usuário + contém `FINANCES` no `applies_to`).
4. **bank.controller.ts:86** — erro pré-existente TS2554 (falta argumento).
5. **Banco de dev vazio** após o reset — re-registrar usuários de teste conforme necessário.
</content>
</invoke>

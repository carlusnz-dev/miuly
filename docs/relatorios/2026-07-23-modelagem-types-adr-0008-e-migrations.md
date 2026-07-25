# Relatório de sessão — 2026-07-23 — Modelagem do Types, ADR-0008 e migrations

--- Cabeçalho ---
Autor: Carlos e Claude
Data: 2026-07-23
Módulos: Backend, Types, Finances (dependência), Prisma/Migrations
Atividade: Entendimento do model Types/`applies_to`, decisões de modelagem (ADR-0008), migration com cast de enum e início do CRUD de Types

# Corpo

## Contexto

Carlos quer terminar o CRUD de **Finances**, mas travou numa dúvida: "como funciona
o modelo Task e o que é a coluna `applies_to`?". A sessão revelou que o
`applies_to` pertence ao model **Types** (tabela de categorias compartilhada por
Finances e Task), não ao Task — e que o CRUD de Types é pré-requisito do de
Finances, pois `createFinancesService` hoje não valida o `type_id` recebido.

## Tópicos abordados

1. **Papel do model `Task`** — to-do list (RF001): `name`, `priority`, `due_date`,
   `sync` (flag de Google Calendar) e `type_id` apontando para `Types`.
2. **Papel do model `Types` e do `applies_to`** — discriminador de domínio: define
   se a categoria vale para FINANCES, TASK ou ambos. Sem ele, uma finança poderia
   receber categoria de tarefa (bug silencioso).
3. **Lacuna no Finances** — `createFinancesService` valida usuário e banco, mas não
   o tipo (nem existência, nem domínio).
4. **Revisão do schema alterado por Carlos** — 3 conflitos encontrados: `@unique`
   global no `name` contradizia tipos por usuário; `onDelete: Restrict` em
   `Types.user` impediria deleção de conta; enum único mudava a semântica original.
5. **Migration com mudança de tipo de coluna** — dois erros de Postgres na prática
   (42804 e 42846) e como resolvê-los.
6. **Início do CRUD de Types** — contrato Zod (`types.type.ts`) escrito por Carlos
   e revisado em duas rodadas.

## Decisões (do Carlos — registradas no ADR-0008, status Proposto)

- `Types` é **por usuário** (`user_id`, categorias customizadas), com
  `onDelete: Cascade` seguindo o padrão dos demais models.
- `applies_to` é **array de enum** (`AppliesTo[]`), sem default — domínio sempre
  explícito; lista não vazia garantida no Zod.
- Unicidade composta `@@unique([user_id, name])`.
- Deleção de tipo em uso: FKs `Restrict` permanecem; o service verifica registros
  vinculados e informa o conflito ao usuário.
- ADR criado: `docs/adr/0008-modelagem-de-types-por-usuario.md` (+ índice
  atualizado). Migration aplicada e client regenerado — falta promover o ADR a
  **Aceito**.

## Recomendações da IA (a validar/aplicar por Carlos)

- Rejeitar duplicatas em `applies_to` na borda (Zod `.refine()` com `Set`) em vez
  de normalizar no service.
- Derivar `updateTypeSchema` de `createTypeSchema.partial()` para evitar
  divergência silenciosa entre create e update.

## Aprendizados (para o Obsidian)

- **`ALTER COLUMN ... TYPE` precisa de `USING`** quando não há cast implícito — a
  cláusula é uma *expressão* executada por linha, não só um cast.
- **HINT do Postgres é sintático, não semântico** — o hint sugeriu
  `applies_to::"AppliesTo"[]`, mas escalar → array **não é cast, é construção**:
  `USING ARRAY["applies_to"]`.
- **Shadow database do Prisma** — `migrate dev` reaplica todo o histórico num banco
  temporário; migration editada precisa funcionar a partir do estado em que foi
  criada, não do estado atual do banco. Recuperação de falha: editar o SQL +
  `migrate resolve --rolled-back`.
- **Campo de lista no Prisma é opcional no create** (vira `[]`) — a regra "não
  vazio" é 100% do Zod. Reforça a lição: tipo ≠ regra em runtime.
- **`z.enum(X)` valida um valor único** — enum não tem `.min()`; para lista é
  `z.enum(X).array().min(1)`.
- **Compound unique no Prisma** gera input próprio (`user_id_name`) utilizável em
  `findUnique`.
- **Derivar schemas Zod** (`.partial()`) evita a classe de bug do update parcial do
  Bank (commit `beb3818`).

## Links e materiais

- [Postgres — ALTER TABLE (cláusula USING)](https://www.postgresql.org/docs/current/sql-altertable.html)
- [Postgres — Array constructors](https://www.postgresql.org/docs/current/sql-expressions.html#SQL-SYNTAX-ARRAY-CONSTRUCTORS)
- [Prisma — Shadow database](https://www.prisma.io/docs/orm/prisma-migrate/understanding-prisma-migrate/shadow-database)
- [Prisma — Working with scalar lists/arrays](https://www.prisma.io/docs/orm/prisma-client/special-fields-and-types/working-with-scalar-lists-arrays)
- [Prisma — unique constraints compostas](https://www.prisma.io/docs/orm/reference/prisma-schema-reference#unique-1)
- [Zod — Arrays](https://zod.dev/api?id=arrays)

## Próximos passos / Pendências

1. **types.type.ts** — decidir duplicatas em `applies_to` (`.refine()`) e aplicar
   (ou não) a derivação `createTypeSchema.partial()`.
2. **CRUD de Types** — `types.repository.ts` → `types.service.ts` (ownership
   ADR-0007, P2002 amigável, delete de tipo em uso → conflito) →
   `types.controller.ts` + rota atrás do `auth.middleware`.
3. **Finances** — validar `type_id` no create/update: existe, pertence ao usuário,
   contém `FINANCES` no `applies_to`. Depois, mesma validação no futuro CRUD de
   Task (com `TASK`).
4. **finances.type.ts** — `updateFinanceSchema` duplicado e sem `.partial()`
   (update hoje exige todos os campos).
5. **bank.controller.ts:86** — erro pré-existente TS2554 (falta um argumento)
   detectado no `tsc --noEmit`.
6. **ADR-0008** — promover de Proposto para Aceito quando Carlos validar.

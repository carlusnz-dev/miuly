# ADR-0002: Modelagem inicial de Finanças, Tarefas e Contas (schema Prisma do MVP)

- **Status:** Aceito
- **Data:** 2026-07-01
- **Decisores:** Carlos (Arquiteto)

## Contexto

O MVP (prazo 16/jul/2026) precisa dos models de domínio para os módulos Financeiro
(RF002) e To-do List (RF001), sobre a base de autenticação (RF006). O `schema.prisma`
inicial tinha lacunas e riscos identificados em revisão:

1. **Isolamento de dado entre usuários.** `Bank` e `Task` não tinham `user_id` — sem
   essa FK, não havia como escopar "minhas tarefas"/"minhas contas" por usuário, e
   contas ficavam efetivamente compartilháveis entre qualquer usuário.
2. **Categorização de Finanças e Tarefas.** Ambas as entidades precisam de uma
   categoria/tipo (ex.: "Alimentação", "Lazer" para finanças; algo equivalente para
   tarefas), e a ideia de manter dois catálogos duplicados (um por entidade) foi
   descartada em favor de um catálogo único reaproveitado pelos dois.
3. **Chave da tabela de categorias (`Types`).** A versão inicial usava `name` como
   chave primária (chave natural). Isso obrigaria toda `Finaces`/`Task` a guardar o
   nome inteiro da categoria como FK, e renomear uma categoria exigiria atualizar
   todas as linhas que a referenciam.
4. **Comportamento ao apagar uma categoria em uso.** Faltava decidir explicitamente
   o que acontece com transações/tarefas quando a categoria delas é removida.

## Decisão

- **`Bank` e `Task` passam a ter `user_id`**, com relação `onDelete: Cascade` para
  `User` — apagar um usuário apaga suas contas e tarefas junto.
- **Um único model `Types` serve tanto `Finaces` quanto `Task`** (catálogo
  compartilhado), com:
  - `id Int @id @default(autoincrement())` como chave primária numérica (não mais
    o `name`).
  - `name String @unique` — o nome continua único, mas deixa de ser a chave usada
    nas FKs.
  - `applies_to String[]` — marca em quais entidades aquele tipo é válido (ex.:
    `["Finaces"]`, `["Task"]`, ou ambos), permitindo um catálogo comum sem tabelas
    duplicadas.
- **`Finaces.type_name`/`Finaces.type_id` e a nova `Task.type_id` referenciam o
  `id` de `Types`**, não mais o `name`.
- **`onDelete: Restrict`** na relação de `type` em ambos os models: apagar uma
  categoria que ainda esteja referenciada por alguma `Finaces` ou `Task` falha,
  em vez de resetar silenciosamente para um valor padrão.
- **`Task.priority` passa de `String` livre para `enum Priority { LOW MEDIUM HIGH
  URGENT }`**, com `@default(MEDIUM)` — mesmo padrão já usado em `Role`.
- **`Finaces` ganha campo `value Decimal @default(0) @db.Decimal(10, 2)`** — a
  versão inicial não tinha nenhum campo de valor monetário.
- **Todo model ganha `updated_at DateTime @updatedAt`**, mantido automaticamente
  pelo Prisma a cada alteração.

## Alternativas consideradas

- **Catálogo de tipos separado por entidade (`FinacesType` e `TaskType`).** Mais
  simples de entender isoladamente, mas duplica estrutura e qualquer categoria que
  fizesse sentido nos dois contextos (ex.: uma tag genérica) precisaria existir
  duas vezes. Rejeitada em favor do catálogo único com `applies_to`.
- **Manter `name` como chave primária de `Types`.** Evita uma coluna extra (`id`),
  mas amarra a FK ao texto da categoria — renomear uma categoria propagaria a
  mudança para toda `Finaces`/`Task` que a referencia. Rejeitada.
- **`onDelete: SetDefault` na relação de `type`.** Exigiria fixar um `id` numérico
  "mágico" como valor padrão em `type_id`, dependente de um registro de seed
  sempre existir. Trocado por `Restrict`, que bloqueia a exclusão em vez de
  mascarar a perda da categoria original.
- **`applies_to` como `enum` em vez de `String[]`.** Mais seguro (Postgres valida
  os valores possíveis), mas foi deixado como **decisão em aberto** — ver
  Follow-ups.

## Consequências

- **Positivas:**
  - Dados de `Bank`/`Task` agora são isolados por usuário, com exclusão em
    cascata coerente com o dono dos dados.
  - Um único catálogo de categorias evita duplicação entre Finanças e Tarefas.
  - Renomear uma categoria não exige mais migrar dados de `Finaces`/`Task`.
  - `Finaces` agora representa de fato uma transação (tem valor monetário).
- **Negativas / trade-offs:**
  - `applies_to String[]` não tem validação no banco — nada impede grafias
    inconsistentes (`"Task"` vs `"task"`) até que isso seja convertido pra enum.
  - `Restrict` na exclusão de `Types` significa que uma categoria em uso não pode
    ser apagada sem antes mover ou apagar as transações/tarefas que a usam — é
    uma escolha deliberada de segurança sobre conveniência.
- **Follow-ups:**
  - Decidir se `applies_to` vira `enum TypeScope { TASK FINACES }` em vez de
    `String[]` livre.
  - `Bank.balance` continua armazenado (não recalculado a partir da soma das
    transações) — decisão ainda em aberto, pode virar um ADR próprio se mantida.
  - Corrigir o nome `Finaces`/`finaces` (typo de "Finanças") no schema antes que
    o nome se espalhe por controllers/services.
  - ADR pendente (já registrado no ADR-0001) sobre a escolha formal do ORM
    (Prisma vs. Drizzle) — na prática já resolvido pelo uso do Prisma no projeto,
    mas ainda sem ADR dedicado.

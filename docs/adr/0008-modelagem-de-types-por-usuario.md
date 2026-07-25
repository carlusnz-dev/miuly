# ADR-0008: Modelagem de Types por usuário com `applies_to` como array de enum

- **Status:** Aceito (revisado em 2026-07-25 — ver [Revisão](#revisão-2026-07-25--applies_to-volta-a-string))
- **Data:** 2026-07-23
- **Decisores:** Carlos (Arquiteto)

## Contexto

O model `Types` é a tabela de categorias compartilhada pelos módulos **Financeiro
(RF002)** e **To-do List (RF001)**: `Finances.type_id` e `Task.type_id` apontam para
ela com `onDelete: Restrict`. A modelagem original (ADR-0002 / schema anterior) tinha
dois problemas identificados em revisão:

1. `Types` era **global** (sem `user_id`): qualquer categoria criada valia para todos
   os usuários, e o `name @unique` global fazia um usuário bloquear o nome do outro.
2. `applies_to` era `String[]` **livre**: nada impedia valores inválidos como
   `["BANANA"]` — o discriminador de domínio (a categoria vale para finanças, tarefas
   ou ambos?) não tinha proteção no banco.

A decisão destrava o CRUD de `Types`, pré-requisito para concluir o CRUD de Finances
(que precisa validar o `type_id` recebido).

## Decisão

`Types` passa a ser **por usuário**, com `applies_to` tipado como **array de enum**:

- `user_id Int` + relação com `User` usando `onDelete: Cascade` — deletar a conta
  apaga os tipos junto, seguindo o padrão de `Bank`, `Finances` e `Task`.
- `applies_to AppliesTo[]`, com `enum AppliesTo { FINANCES, TASK }` — um mesmo tipo
  pode valer para os dois módulos. **Sem default**: o cliente informa o domínio
  explicitamente (obrigatório também na validação Zod, incluindo lista não vazia).
- Unicidade composta `@@unique([user_id, name])` — cada usuário não repete nome de
  tipo, mas usuários diferentes podem ter tipos homônimos.
- Deleção de um tipo **em uso**: as FKs `Restrict` em `Finances`/`Task` permanecem; a
  camada de service verifica se existem registros vinculados e informa o conflito ao
  usuário (em vez de estourar erro genérico do banco).

## Alternativas consideradas

- **`Types` global (como estava)** — simples, categorias padronizadas; mas impede
  customização por usuário e o `@unique` global gera conflito de nomes entre contas.
  Rejeitada: o produto quer categorias personalizadas.
- **`applies_to` como enum único (`AppliesTo`)** — mais simples de consultar; mas um
  tipo "Saúde" válido para finanças **e** tarefas exigiria dois registros, e a
  unicidade precisaria virar `[user_id, name, applies_to]`. Rejeitada.
- **`applies_to AppliesTo[]` (escolhida)** — mantém a semântica original (um tipo,
  vários domínios) com proteção do enum no banco; consultas usam o filtro `has` do
  Prisma para listas escalares.
- **Manter `String[]` validando só no Zod** — flexível, sem migration em mudanças;
  mas o banco continua aceitando lixo se algo passar por fora da API. Rejeitada.

## Consequências

- **Positivas:** categorias customizadas por usuário; valores inválidos de domínio
  rejeitados pelo próprio Postgres; deleção de conta não fica bloqueada por tipos;
  contrato de criação explícito (sem default silencioso).
- **Negativas / trade-offs:** novo domínio em `AppliesTo` exige migration (enum é
  rígido); tipos deixam de ser compartilháveis entre usuários (cada um cadastra os
  seus); consultas por domínio usam filtro de array (`has`), menos trivial que
  igualdade simples.
- **Follow-ups:**
  - Migration do schema (feita por Carlos).
  - CRUD de `Types` (route → controller/Zod → service → repository), com ownership
    conforme [ADR-0007](0007-ownership-e-recorte-de-campos-na-camada-de-service.md).
  - `createFinancesService`/`updateFinanceService` passam a validar que o `type_id`
    existe, pertence ao usuário e contém `FINANCES` no `applies_to`.
  - Mesma validação valerá para o futuro CRUD de `Task` (com `TASK`).

## Revisão (2026-07-25): `applies_to` volta a `String[]`

### Motivo

Ao testar `GET /type/:id`, o `findFirst` do Prisma estourou na **leitura** com
`DriverAdapterError: cannot cast type "AppliesTo" to text[]` (Postgres **42846**) —
o mesmo código de erro que já aparecera na migration original. Causa-raiz: usamos o
driver adapter `@prisma/adapter-pg`, e ao **serializar** uma coluna de **array de enum
nativo** (`"AppliesTo"[]`) o engine gera o cast `applies_to::text[]`. O Postgres sabe
converter um enum **escalar** para `text`, mas **não existe cast de `enum[]` para
`text[]`** — o cast não se propaga para o tipo array. Ou seja: o array de enum nativo
cobra o preço do 42846 nos **dois** lados, escrita (migration) e leitura (adapter).

### Decisão revisada

`applies_to` passa de `AppliesTo[]` (enum nativo do Postgres) para **`String[]`**. A
garantia do domínio (`FINANCES`/`TASK`, lista não vazia) fica **100% na borda, no Zod** —
onde, de fato, já estava sendo aplicada. Isso é coerente com o princípio que já
adotamos: *tipo do banco ≠ regra em runtime*; a borda valida, o banco armazena.

- O `enum AppliesTo` **permanece declarado no `schema.prisma`** como **fonte única dos
  valores de domínio**: o Zod continua importando-o (`z.enum(AppliesTo)`), então o
  contrato de entrada não muda. O que muda é apenas que ele deixa de ser o **tipo da
  coluna** — não há mais tipo enum nativo em uso no banco.
- Tudo o mais da decisão original permanece: `Types` por usuário, `onDelete: Cascade`,
  `@@unique([user_id, name])`, FKs `Restrict` em `Finances`/`Task` com verificação de
  uso no service.

### Consequências da revisão

- **Positivas:** elimina a classe inteira do 42846 (leitura e migrations futuras);
  esquema mais simples; domínio validado onde é efetivamente barrado (Zod).
- **Negativas / trade-offs:** o Postgres deixa de rejeitar valores fora do domínio —
  se algo gravar por fora da API, o banco aceita. Aceitável porque toda escrita passa
  pelo Zod. Reverte, na prática, a alternativa "manter `String[]` validando só no Zod"
  que fora rejeitada em 2026-07-23 — a rejeição não previra o atrito enum-array +
  driver adapter, que inverteu o custo-benefício.
- **Migration:** `enum[] → text[]` também não tem cast direto; o `ALTER` precisa de
  `USING ARRAY(SELECT unnest("applies_to")::text)` (converte elemento a elemento, onde
  `enum → text` escalar é válido, e reagrupa em `text[]`).

# Plano do corte 2 do backend: finanças (`banks` e `finances`)

Este documento guia o segundo corte funcional da API: contas (`Bank`) e
lançamentos (`Finance`), com transferências entre contas. Ele segue o padrão do
[plano do corte 1](plano-corte-1-backend.md) e serve de contrato HTTP para o
front-end.

- **Requisitos:** RF-005, RF-006, RF-007 e RNF-002 em
  [requirements.md](requirements.md).
- **Modelo de dados:** [data-model-review.md](data-model-review.md).
- **Padrão de módulo:** [architecture.md](architecture.md), com
  `backend/src/modules/apis/` como referência de CRUD paginado por perfil.
- **Quem implementa:** Codex (backend, etapas 2 a 5) e Claude (contrato, revisão e
  validação), conforme [organizacao-agentes.md](organizacao-agentes.md).

---

## 1. Decisões tomadas

Decididas pelo Carlos em 2026-09-26:

| Tema | Decisão |
| --- | --- |
| O que é `Bank` | Uma **conta concreta** do usuário (ex.: "Nubank corrente", "Carteira"), com nome único por perfil. Não há modelo separado de instituição. |
| Saldo | `Bank.balance` é o **saldo inicial** da conta. O saldo atual é **calculado na leitura** e nunca é gravado. |
| Lançamento pendente | `paidAt` vazio é um lançamento **previsto**: aparece na listagem, mas **não entra no saldo** até ser pago. |
| Moeda | A moeda (ISO 4217) pertence à **conta**. O lançamento usa a moeda da conta, e só há transferência entre contas da mesma moeda. |
| Transferência | **Uma linha** em `Finance` com `type = transfer`, conta de origem (`bankId`) e conta de destino (`destinationBankId`). Não gera entrada nem saída duplicada nas estatísticas. |

Propostas deste plano, a confirmar na revisão:

- **Excluir uma conta com lançamentos** (incluindo como destino de transferência)
  responde **409**. A exclusão é restritiva, não em cascata, para nenhum histórico
  sumir por engano.
- **Categoria:** o lançamento recebe o **nome** da tag, como em `tasks`, e reaproveita
  a tag do perfil pelo slug. A resolução de tags sai do repository de `tasks` para
  um componente compartilhado, com a mesma repetição única em caso de criação
  concorrente.

## 2. Mudanças de contrato (exigem autorização)

Nada abaixo foi aplicado. A mudança do contrato Prisma precisa de autorização
explícita. A migração e qualquer comando de banco precisam de **outra**
autorização, separada.

1. `Bank`:
   - novo `currency VarChar(3) @default("BRL")`;
   - `balance` continua `Numeric(10, 2)` e passa a significar saldo inicial.
     Por causa do limite do Prisma 8 RC com defaults numéricos (ver plano do
     corte 1), não é preciso default: o valor é obrigatório na criação.
2. `Finance`:
   - novo `destinationBankId Int? @map("destination_bank_id")`, com relação
     nomeada para `Bank` (origem e destino). Precisa de um índice
     `@@index([destinationBankId, paidAt])` para o cálculo do saldo;
   - `currency` continua no lançamento, mas é **gravado pelo servidor** com a moeda
     da conta de origem. A API não recebe moeda no lançamento;
   - `value` continua `Numeric(10, 2)` e é sempre **positivo**. O `type` define o
     efeito no saldo.
3. `npm run contract:emit` e versionar `contract.json` e `contract.d.ts`.
4. Com autorização de banco: `prisma migration plan` e `prisma db migrate`.

A regra de que a transferência tem destino, e só ela, fica na aplicação (schema Zod
e service): origem diferente do destino, as duas contas no mesmo perfil e na mesma
moeda. Um `CHECK` no banco pode vir depois, se o contrato do Prisma 8 permitir.

## 3. Contrato HTTP (para o front-end)

### Convenções

As mesmas do corte 1: rotas atrás do `requireAuth` (Bearer), envelope
`{ ok, message, data }`, datas em ISO 8601 e paginação `page`/`pageSize` com
`totalItems`. Recursos de outro perfil respondem **404**.

**Dinheiro trafega como string decimal**, nunca como número JSON: `"1234.50"`.
O valor de um lançamento aceita `^\d{1,8}(\.\d{1,2})?$` (limite de
`Numeric(10, 2)`) e precisa ser maior que zero. O saldo inicial da conta aceita
também o sinal negativo (`^-?\d{1,8}(\.\d{1,2})?$`), por exemplo para cheque
especial. Moeda é código ISO 4217 de 3 letras maiúsculas.

### `banks` (Bearer)

| Rota | Body | Resposta |
| --- | --- | --- |
| `POST /banks` | `{ name, balance, currency? }` | 201, `BankResponse`. 409 se o nome já existe no perfil. `currency` padrão `BRL`. |
| `GET /banks` | — | Lista paginada de `BankResponse`, em ordem de nome. |
| `GET /banks/:id` | — | `BankResponse`. |
| `PATCH /banks/:id` | `{ name?, balance? }` | `BankResponse`. A moeda **não** muda depois de criada: responde 400 se vier no body. |
| `DELETE /banks/:id` | — | 200. **409** se houver lançamentos na conta (origem ou destino). |

`BankResponse`:
`{ id, name, currency, initialBalance, currentBalance, createdAt, updatedAt }`.

`currentBalance` = `initialBalance` + entradas pagas − saídas pagas − transferências
pagas que saem + transferências pagas que entram. Só contam lançamentos com
`paidAt` preenchido.

### `finances` (Bearer)

| Rota | Body / query | Resposta |
| --- | --- | --- |
| `POST /finances` | `{ name, type, value, bankId, destinationBankId?, tag?, paidAt?, url?, peoples? }` | 201, `FinanceResponse`. |
| `GET /finances` | `?bankId&type&tag&paid&from&to&page&pageSize` | Lista paginada, em ordem de `paidAt` decrescente e pendentes por último. |
| `GET /finances/:id` | — | `FinanceResponse`. |
| `PATCH /finances/:id` | qualquer campo do `POST` | `FinanceResponse`. Trocar o `type` revalida a regra do destino. |
| `DELETE /finances/:id` | — | 200. |

Regras de validação:

- `type = transfer` exige `destinationBankId`, diferente de `bankId`, da mesma moeda
  e do mesmo perfil. Nos outros tipos, `destinationBankId` é rejeitado (400).
- Conta de origem ou de destino de outro perfil responde **404**, como se não
  existisse.
- `tag` é o nome da categoria (`null` remove); é reaproveitada pelo slug.
- O filtro `bankId` inclui transferências em que a conta é origem **ou** destino.
- `paid=true` filtra os pagos, `paid=false` os previstos. `from`/`to` filtram
  `paidAt`.

`FinanceResponse`:
`{ id, name, type, value, currency, bankId, destinationBankId, tag, paidAt, url, peoples, createdAt, updatedAt }`,
com `tag` no formato `{ id, name, slugUrl } | null`.

## 4. Como vai ficar o código

Dois módulos novos em `backend/src/modules/`, no padrão atual
(`contract.ts`, `repository.ts`, `service.ts`, `controller.ts`, `routes.ts` e
`index.ts`), montados em `app.ts` atrás do `requireAuth`:

- `banks`: CRUD da conta. O saldo atual é calculado no repository com `aggregate`
  (somas por tipo), filtrado por `profileId`.
- `finances`: CRUD do lançamento. O service valida as regras de transferência
  usando uma porta de leitura de contas (`BankLookup`), que `banks` satisfaz. Assim
  `finances` não importa o repository concreto de `banks`.
- **Dinheiro no domínio:** um tipo `Money`/decimal em string, sem `float`. As somas
  do saldo ficam no banco (SQL `numeric`), não em JavaScript. Antes da etapa 2,
  confirmar o tipo que o codec `pg/numeric@1` do Prisma 8 entrega em tempo de
  execução (provavelmente string) e documentar a conversão em `src/prisma/`, como
  já existe para `instant.ts` e `varchar.ts`.

## 5. Ordem de implementação

1. **Contrato** (Claude, com autorização): mudanças da seção 2, `contract:emit` e
   testes de contrato. Depois, com autorização de banco, a migração.
2. **Tags compartilhadas** (Codex): extrair a resolução de tags de `tasks` sem mudar
   o comportamento; os testes de `tasks` continuam passando.
3. **`banks`** (Codex): contrato Zod, repository, service, controller, rotas e
   testes, incluindo o cálculo do saldo.
4. **`finances`** (Codex): idem, com as regras de transferência e o 409 na exclusão
   de conta usada.
5. **Validação** (Claude, com autorização de banco): ponta a ponta contra o
   PostgreSQL, conferindo saldos com pendentes, transferências nas duas pontas e
   o isolamento por perfil.

## 6. Fora deste corte

- conversão de moedas e contas multimoeda;
- lançamentos recorrentes ou parcelados;
- orçamentos, metas e relatórios agregados por período ou categoria;
- importação de extratos e integração com bancos (Open Finance);
- registro em `AuditLog`.

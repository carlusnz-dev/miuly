# ADR-0007: Ownership e recorte de campos na camada de Service

- **Status:** Proposto
- **Data:** 2026-07-16
- **Decisores:** Carlos (Arquiteto)

## Contexto

Os módulos do back-end seguem Clean Architecture (routes → controllers → services →
repositories). Ao revisar o módulo Bank, apareceram duas inconsistências entre os
módulos já escritos:

1. **Ownership.** `updateBank` e `deleteBank` filtram por `user_id` no `where` da query
   (garantia no repository), enquanto `updateBankService` e `deleteBankService` também
   comparam `foundBank.user_id` com o usuário autenticado (garantia no service).
   Já `findBankByIdService` não valida posse alguma — qualquer usuário autenticado lê
   o banco de outro (IDOR). Em Finances, o repository filtra por `user_id`; o service
   não valida nada.
2. **Recorte de campos.** Os services anotam o retorno com `Pick<BankModel, ...>`, mas
   `Pick` é um tipo do TypeScript e não existe em runtime — o objeto do Prisma é
   devolvido inteiro e serializado pelo `res.json()`. `createBankService` recorta de
   fato (desestrutura e remonta o objeto); `updateBankService` e `findBankByIdService`
   confiam apenas na anotação e vazam `user_id`, `created_at` e `updated_at`.

Decidir agora importa porque os módulos **Types** e **Task** ainda não existem, e
Finances está pela metade. Fixar o padrão antes evita escrever três módulos
inconsistentes e ter que uniformizá-los depois.

## Decisão

**A garantia de ownership e o recorte de campos ficam na camada de Service.**

- O **Repository** permanece burro: executa a query e devolve a linha completa, sem
  `select` restritivo e sem filtro de posse no `where`.
- O **Service** carrega as duas responsabilidades: busca o registro, compara o dono com
  o usuário autenticado e, ao retornar, desestrutura o objeto e remonta apenas os campos
  que devem sair — recorte real em runtime, não só na anotação de tipo.
- Quando o recurso pertence a outro usuário, o Service retorna `unauthorized`
  (HTTP 401), distinto de `not_found` (HTTP 404).

## Alternativas consideradas

- **Opção A — garantia no Service (escolhida).** O repository devolve tudo; o service
  valida posse e recorta.
  - *Prós:* os dados completos do registro continuam disponíveis para regra de negócio
    futura, sem precisar de um segundo método de repositório; permite distinguir
    "não existe" de "não é seu" e responder com status diferentes.
  - *Contras:* o recorte depende de disciplina — todo service novo precisa lembrar de
    desestruturar, e o TypeScript não acusa o esquecimento (tipagem estrutural: objeto
    com campos a mais satisfaz um tipo que pede menos); a query traz colunas que serão
    descartadas.
  - *Por que venceu:* o acesso ao registro completo dentro do service foi considerado
    mais valioso para as regras de negócio ainda por escrever (Finances e Task) do que
    a proteção por construção oferecida pela Opção B, e a distinção entre `not_found` e
    `unauthorized` foi considerada desejável para o uso pessoal do sistema.

- **Opção B — garantia no Repository.** O repository filtra por `user_id` no `where` e
  usa `select` para trazer só os campos expostos.
  - *Prós:* vazar campo ou dado de outro usuário se torna impossível por construção, não
    por disciplina; o tipo inferido do Prisma passa a refletir o shape real, então o
    compilador acusa retornos indevidos; menos dados trafegam do banco.
  - *Contras:* `not_found` e `unauthorized` colapsam num único `null` — não há como
    distinguir; um service que precise de um campo não selecionado exigiria um segundo
    método de repositório.

## Consequências

- **Positivas:**
  - Padrão único para Bank, Finances, User, Types e Task — os módulos ainda não escritos
    já nascem consistentes.
  - Services têm acesso ao registro completo para regras de negócio futuras.
  - Respostas de erro distinguem recurso inexistente de recurso alheio.

- **Negativas / trade-offs:**
  - **Dívida técnica assumida — enumeration de IDs.** Responder 401 para recurso alheio
    e 404 para inexistente revela quais IDs existem no sistema: um atacante autenticado
    pode iterar IDs e mapear os registros existentes. Aceito conscientemente por ser um
    projeto pessoal de usuário único. **Revisar se o Miuly for comercializado ou aberto
    a múltiplos usuários não confiáveis** — a mitigação é responder 404 nos dois casos.
  - O recorte de campos passa a depender de revisão de código: nenhuma ferramenta acusa
    um service que esqueça de desestruturar antes de retornar.
  - Queries trazem colunas descartadas em seguida (custo irrelevante na escala atual).

- **Follow-ups:**
  - Corrigir `findBankByIdService`: receber `userId`, validar posse e recortar os campos.
  - Corrigir `updateBankService`: recortar os campos do retorno em runtime.
  - Aplicar o padrão em Finances (`createFinancesService` não valida se o `bank_id`
    pertence ao usuário; update/delete/findById ainda não estão expostos).
  - Auditar `user.service.ts` — o model `User` tem coluna `password`, e o mesmo descuido
    de confiar no `Pick` vazaria o hash da senha.
  - Aplicar o padrão em Types e Task ao escrevê-los.
  - Avaliar se a validação de posse repetida no `where` do repository
    (`updateBank`, `deleteBank`) deve ser removida por redundância ou mantida como
    defesa em profundidade.

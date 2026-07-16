# Auth repository service
--- Cabeçalho ---
Autor: Claude Code
Data: 2026-07-04
Módulos: Backend
Atividade: Auth repository service

# Corpo

## Contexto

Continuação da sessão de início do backend (ver
`2026-07-04-inicio-backend-mvp.md`). Carlos já tinha decidido a ordem de
implementação (repository → service → controller → router) e avançou para
escrever de fato o módulo de Auth/User: primeiro fechou decisões pendentes sobre
senha/hash/validação, depois escreveu o `user.repository.ts` e o
`user.service.ts` e pediu revisão de cada um.

## Tópicos abordados

1. Fechamento das decisões em aberto sobre autenticação: senha armazenada como
   hash (bcrypt), hash gerado no Service (Repository só persiste), resposta de
   API nunca expõe o hash, middleware de JWT para rotas protegidas (detalhes
   ainda a pesquisar), validação de regra de negócio dividida entre backend
   (Service) e constraints do Postgres (unique, not null etc.).
2. Carlos aplicou no banco: campo de senha hasheada no model `User` e correção
   do typo `Finace`/`Finaces` → `Finance` no `schema.prisma`.
3. Registro dessas decisões no **ADR-0004** (`docs/adr/0004-estrategia-de-autenticacao.md`).
4. Dúvida sobre estilo de repository: função pura vs. classe com injeção de
   dependência. Decisão de Carlos: função pura por enquanto, já que os testes
   vão bater direto no banco (sem mock) nesta fase do projeto.
5. Revisão do `user.repository.ts` (`createUser`): import do tipo
   `UserCreateInput` do Prisma confirmado como correto; apontados ajustes de
   convenção (nome de função em camelCase, não PascalCase) e um `return await`
   redundante sem `try/catch` ao redor.
6. Revisão do `user.service.ts` (`createUserService`) — Carlos suspeitou de um
   erro no `return null` do bloco `if (existingUser)`. Achados levantados:
   - Vazamento do hash da senha na resposta de sucesso (contraria o ADR-0004:
     o objeto `User` completo do Prisma, com `password` hasheada, é devolvido
     sem sanitização).
   - Service chamando `prisma.user.findFirst` diretamente, pulando o
     Repository — quebra a regra de que só o Repository fala com o Prisma.
   - Bug de lógica na checagem de duplicidade: `where: { email, username }` é
     uma condição AND, mas o objetivo é detectar duplicidade em **qualquer um**
     dos dois campos (que são `@unique` separadamente) — precisaria ser
     `OR: [{ email }, { username }]`. Do jeito que está, a maioria dos
     duplicados só é pega pela constraint do Postgres, caindo no `catch`
     genérico.
   - Retorno inconsistente entre os caminhos da função (`undefined`, `null`,
     objeto `User`, `string` de erro) — confirma a suspeita original do Carlos
     e explica por que o controller não conseguiria mapear isso pra status
     HTTP de forma confiável.
   - `bcrypt.hashSync` bloqueia o event loop do Node inteiro durante o cálculo
     do hash; a versão assíncrona (`bcrypt.hash`) evita isso.

## Decisões e recomendações

- **Decisão de Carlos (ADR-0004):** hash de senha com bcrypt, gerado no
  Service; resposta de API nunca expõe o hash; validação de RN dividida entre
  Service e constraints do Postgres; JWT para rotas protegidas (a especificar
  em sessão futura).
- **Decisão de Carlos:** repository como função pura (sem classe), dado que os
  testes vão bater direto no banco nesta fase.
- **Recomendação (a aplicar por Carlos):** no `user.repository.ts`, renomear
  `CreateUser` → `createUser` (convenção camelCase) e remover o `return await`
  redundante.
- **Recomendação (a aplicar por Carlos) — pendente no final da sessão:**
  corrigir os 4 achados do `user.service.ts` listados acima, na seguinte
  ordem sugerida de prioridade:
  1. Sanitizar o retorno de sucesso pra nunca incluir a senha/hash.
  2. Mover a checagem de duplicidade pro Repository (nova função, ex.
     `findByEmailOrUsername`), tirando o `prisma.user.findFirst` do Service.
  3. Corrigir a condição de duplicidade de AND para OR.
  4. Definir um formato de retorno único e previsível para os três desfechos
     (sucesso / conflito / erro) — duas direções discutidas: objeto com flag
     discriminada (`{ ok: true, user } | { ok: false, reason }`) ou erros
     customizados (`class ConflictError extends Error`) capturados no
     `try/catch` do controller.
  5. Trocar `bcrypt.hashSync` por `bcrypt.hash` (assíncrono).
  - Pergunta em aberto feita a Carlos, ainda sem resposta: qual das duas
    abordagens do item 4 (retorno com flag vs. erros customizados) parece mais
    natural pra ele dado o que já viu de Express.

## Aprendizados

- Um retorno de função com formatos diferentes por caminho (`undefined` /
  `null` / objeto / `string`) impede o controller de mapear a resposta pra
  status HTTP de forma segura — o contrato de retorno de um Service precisa
  ser único e prevvalidado.
- `hashSync` do bcrypt bloqueia o event loop inteiro do Node durante o
  cálculo — em um servidor que atende múltiplas requisições concorrentes,
  isso trava todo mundo, não só quem está se cadastrando; a versão assíncrona
  evita esse bloqueio.
- Um `where` com múltiplos campos no Prisma (`{ email, username }`) é uma
  condição **AND**, não OR — pra checar duplicidade em campos `@unique`
  independentes, é preciso usar `OR: [...]` explicitamente.
- Repository como função pura já ganha "singleton" de graça pelo cache de
  módulos do Node — uma classe só compensa quando se quer injeção de
  dependência de verdade (ex.: trocar a implementação em testes com mock).
- Reforço da regra de camadas: se o Service acessa o Prisma diretamente, a
  camada de Repository deixa de ser a única porta de entrada pro banco, o que
  quebra a garantia de Clean Architecture que o projeto vem seguindo.

## Links e materiais

- Contrato de retorno único (o que a sessão seguinte formalizou como union
  discriminada): [TypeScript Handbook — Discriminated unions](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions)
- `hashSync` bloqueando o event loop: [Node.js — Don't Block the Event Loop](https://nodejs.org/en/learn/asynchronous-work/dont-block-the-event-loop)
- `where` com múltiplos campos é AND, uso de `OR`/`AND`/`NOT`: [Prisma — Filtering and sorting (combining operators)](https://www.prisma.io/docs/orm/prisma-client/queries/filtering-and-sorting#filter-on-and-or-not-conditions)
- Repository como função pura e cache de módulos do Node: [Node.js — Modules: caching](https://nodejs.org/api/modules.html#caching)
- Separação de camadas (Service não deve acessar o Prisma diretamente): [The Clean Architecture — Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)

## Próximos passos

- Corrigir o `user.repository.ts`: renomear `CreateUser` → `createUser`,
  remover `return await` redundante.
- Corrigir o `user.service.ts` conforme os 5 pontos listados em "Decisões e
  recomendações", incluindo mover a checagem de duplicidade pro repository e
  decidir o formato de retorno único (flag discriminada vs. erros
  customizados).
- Responder, no início da próxima sessão, qual abordagem de sinalização de
  erro (flag vs. exceptions customizadas) prefere usar antes de reescrever o
  `user.service.ts`.
- Seguir para o Controller e Router do módulo de Auth, depois que o Service
  estiver corrigido.
- Pesquisar a estratégia de JWT (expiração, refresh, algoritmo) — follow-up
  registrado no ADR-0004.
- Levar a seção "Aprendizados" acima para o Obsidian.

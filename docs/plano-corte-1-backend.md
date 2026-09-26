# Plano do corte 1 do backend: `auth`, `users`, `tasks` e `apis`

Este documento guia a implementação do primeiro corte funcional da API e serve de
contrato HTTP para o front-end, que o Codex começa pela autenticação em paralelo.
Os contratos de cada módulo (schemas Zod, entidades e DTOs) **já existem** em
`backend/src/modules/<modulo>/contract.ts`, com testes. O que falta são
repositórios, services, controllers, rotas e a infraestrutura de autenticação.

- **Decisão de autenticação:** [ADR 0002](adr/0002-autenticacao-access-refresh-token.md).
- **Padrão de módulo:** [architecture.md](architecture.md), com
  `backend/src/modules/users/` como referência.
- **Quem implementa:** Claude (backend) e Codex (front-end), conforme
  [organizacao-agentes.md](organizacao-agentes.md).

---

## 1. Estado atual

| Módulo | Contrato (`contract.ts`) | Repository / service / controller / rotas |
| --- | --- | --- |
| `auth` | Pronto | **Implementado** (etapas 2 e 4), validado contra o PostgreSQL real |
| `users` | Pronto | **Implementado** (etapa 5); `GET /users/:id` removido |
| `tasks` | Pronto, com tags | **Implementado** (etapa 6) |
| `apis` | Pronto | **Implementado** (etapa 7) |

Base compartilhada nova: `core/http/schemas.ts`, com `uuidParamsSchema`,
`isoInstantSchema`, `peoplesSchema`, `hasAnyField` e `endNotBeforeStart`.

## 2. Pré-requisitos que dependem de autorização

Mudanças de contrato de dados, banco ou dependências só acontecem com
autorização explícita do Carlos. O item 1 já está feito; os itens 3 a 5 ainda
dependem de autorização.

1. **Contrato Prisma: feito** (autorizado em 2026-09-24, com `contract:emit`):
   - `Session`: uma linha por login, com `userId`, `revokedAt`, `revokedReason`
     (`logout`, `password` ou `reuse`) e `createdAt`;
   - `RefreshToken`: uma linha por token emitido, com `sessionId`, `userId`,
     `previousTokenId` (**único**, aponta para o token que este substituiu),
     `tokenHash` (SHA-256, único), `expiresAt` e `createdAt`. A cadeia
     `previousTokenId` é a rotação: um token que já tem sucessor foi usado, e só o
     último da cadeia é o atual;
   - removidos `@@unique([profileId, title])` de `Task` e
     `@@unique([urlBase, slugUrl])` de `Api`. `Api` mantém o título único por
     perfil.
2. **Limpeza da cadeia:** apagar um token antigo exige antes anular o
   `previousTokenId` do sucessor, por causa da chave estrangeira. Sessões revogadas
   ou expiradas há mais de 7 dias são apagadas inteiras, com os tokens antes da
   sessão.
3. **Primeira migração: feita** (autorizada em 2026-09-24), em
   `backend/migrations/app/20260924T2350_corte_1_inicial`. Fluxo com o banco local
   em `docker compose up -d database`: `npx prisma contract emit`,
   `npx prisma migration plan --name <slug>` (offline) e `npx prisma db migrate`.
   O RC do Prisma 8 recusa `Numeric @default(0)` (o plano exige string decimal e a
   verificação pós-migração lê o default como função), então `Finance.value` usa
   `@default(dbgenerated("'0'::numeric(10,2)"))`; `contract.test.ts` impede a volta
   do literal em colunas `numeric`.
4. **Dependências novas:** `jose` (JWT, ESM e sem dependências nativas) e
   `cookie-parser` com `@types/cookie-parser`. O hash de senha usa `scrypt` de
   `node:crypto`, então não precisa de pacote. Só será preciso `cors` se o front não
   usar o proxy do Angular (seção 5).
5. **Variáveis de ambiente** em `core/env.ts` e `.env.example`: `JWT_SECRET`
   (obrigatória, com pelo menos 32 caracteres) e `CORS_ORIGIN` (opcional).

## 3. Contrato HTTP (para o front-end)

### Convenções

- Sucesso: `{ ok: true, message, data }`. Listas paginadas acrescentam
  `pagination: { page, pageSize, totalItems, totalPages }`.
- Erro: `{ ok: false, message, issues? }`, em que `issues` é uma lista de
  `{ path, message }` nos erros 400 de validação.
- Datas sempre em ISO 8601 com fuso (`2026-09-25T12:00:00.000Z`). Na entrada, o
  fuso é obrigatório: `2026-09-25T09:00:00-03:00` é aceito, mas
  `2026-09-25T09:00:00` é rejeitado.
- Rotas protegidas exigem `Authorization: Bearer <accessToken>`.
- Códigos:
  - 400: validação;
  - 401: sem token, token inválido ou expirado, ou credenciais erradas;
  - 404: recurso inexistente **ou de outro perfil**;
  - 409: conflito de unicidade (e-mail, username, título de API no perfil) ou
    refresh concorrente.

### `auth`

| Método e rota | Corpo | Resposta (`data`) | Observações |
| --- | --- | --- | --- |
| `POST /auth/register` | `{ name, email, username, password }` | `AuthSessionResponse` (201) | Cria `User` e `Profile` na mesma transação. 409 se o e-mail ou o username já estiverem em uso. Define o cookie. |
| `POST /auth/login` | `{ email, password }` | `AuthSessionResponse` | 401 com mensagem única "E-mail ou senha inválidos". Define o cookie. |
| `POST /auth/refresh` | — (cookie) | `AuthSessionResponse` | Rotaciona o cookie. 409 se o token foi renovado por outra aba há menos de 30 s (o front repete uma vez). 401 se o cookie estiver ausente, inválido, expirado ou reutilizado. |
| `POST /auth/logout` | — (cookie) | `null` | Revoga a sessão e apaga o cookie. Idempotente. O front descarta o access token. |
| `GET /auth/me` | — (Bearer) | `AuthUserResponse` | Dados do usuário para o front. |

```ts
interface AuthSessionResponse {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number; // segundos (900)
  user: AuthUserResponse;
}

interface AuthUserResponse {
  id: number;
  name: string;
  email: string;
  profile: { id: string; username: string; slugUrl: string; urlPhoto: string | null };
}
```

Regras de entrada:
- `email` é normalizado (sem espaços, minúsculo) e tem no máximo 100 caracteres;
- `username` é normalizado para minúsculas, aceita de 3 a 30 caracteres entre
  `a-z`, `0-9` e `_`, e vira também o `slugUrl` do perfil;
- `password` tem de 8 a 128 caracteres; no login, a política de senha não é aplicada.

### `users` (Bearer)

| Método e rota | Corpo | Resposta (`data`) |
| --- | --- | --- |
| `GET /users/me` | — | `UserResponse` |
| `PATCH /users/me` | `{ name }` | `UserResponse` |
| `PUT /users/me/password` | `{ currentPassword, newPassword }` | `null`. Responde 401 se a senha atual estiver errada e revoga todas as sessões, então o front volta ao login. |
| `GET /users/me/profile` | — | `ProfileResponse` |
| `PATCH /users/me/profile` | `{ username?, bio?, urlPhoto? }` | `ProfileResponse`. `null` limpa `bio` e `urlPhoto`; `urlPhoto` só aceita HTTPS; 409 se o username já estiver em uso. |

`GET /users/:id` sai deste corte: ele expõe o e-mail de qualquer usuário.

### `tasks` (Bearer)

| Método e rota | Entrada | Resposta (`data`) |
| --- | --- | --- |
| `GET /tasks` | query `page`, `pageSize`, `done`, `priority`, `from`, `to` | `TaskResponse[]` paginado, em ordem crescente de `scheduledAt` |
| `POST /tasks` | `{ title, scheduledAt, observations?, priority?, startTime?, endTime?, peoples?, tags? }` | `TaskResponse` (201) |
| `GET /tasks/:id` | — | `TaskResponse` |
| `PATCH /tasks/:id` | qualquer subconjunto, mais `done` e `tags` | `TaskResponse` |
| `DELETE /tasks/:id` | — | `null` |

- `priority` aceita `low`, `medium` (padrão), `high` ou `archived`.
- `from` é inclusivo e `to` é exclusivo, ambos sobre `scheduledAt`.
- `endTime` não pode ser anterior a `startTime`. Em um `PATCH` com só um dos dois,
  a comparação é feita com o valor já salvo.
- `tags` é uma lista de nomes (até 20, cada um com até 30 caracteres):
  - nomes novos viram tags do perfil, e nomes já existentes são reaproveitados
    pelo slug, então "Casa" e "casa" são a mesma tag;
  - no `PATCH`, enviar `tags` substitui o conjunto (`[]` remove todas), e omitir
    mantém as atuais;
  - a resposta traz `tags: { id, name, slugUrl }[]`;
  - se outra requisição criar a mesma tag ao mesmo tempo, o servidor repete a
    transação uma vez; se a segunda tentativa também falhar por unicidade,
    responde 409.
- `DELETE` remove a tarefa e seus vínculos; as tags continuam no perfil.

### `apis` (Bearer)

| Método e rota | Entrada | Resposta (`data`) |
| --- | --- | --- |
| `GET /apis` | query `page`, `pageSize`, `status` | `ApiConnectionResponse[]` paginado |
| `POST /apis` | `{ title, urlBase, slugUrl, description?, startTime?, endTime?, peoples? }` | `ApiConnectionResponse` (201) |
| `GET /apis/:id` | — | `ApiConnectionResponse` |
| `PATCH /apis/:id` | qualquer subconjunto, mais `status` | `ApiConnectionResponse` |
| `DELETE /apis/:id` | — | `null` |

- `urlBase` só aceita HTTPS, com até 100 caracteres.
- `slugUrl` aceita de 1 a 30 caracteres entre `a-z`, `0-9` e `-`.
- `status: false` desativa a conexão sem apagá-la.

Os tipos exatos de cada DTO estão nos `contract.ts`. Quando o front e este
documento divergirem, vale o `contract.ts`.

## 4. Como vai ficar o código

```text
backend/src/
├── core/
│   ├── env.ts                 + JWT_SECRET, CORS_ORIGIN
│   ├── error.ts               + ConflictError (409)
│   ├── http/
│   │   ├── handler.ts         + acesso ao AuthContext e cookies (ver abaixo)
│   │   └── schemas.ts         schemas compartilhados (pronto)
│   └── prisma/instant.ts      toDate(Instant) compartilhado (sai de users/repository)
└── modules/
    ├── auth/
    │   ├── contract.ts        pronto
    │   ├── password.ts        porta PasswordHasher + ScryptPasswordHasher
    │   ├── tokens.ts          porta TokenIssuer + JoseTokenIssuer (JWT e refresh)
    │   ├── middleware.ts      requireAuth: Bearer -> AuthContext ou 401
    │   ├── repository.ts      porta AuthRepository (usuário, perfil, sessões) + Prisma
    │   ├── service.ts         register, login, refresh, logout, me
    │   ├── controller.ts, routes.ts, index.ts
    ├── users/                 me, perfil e troca de senha (reusa PasswordHasher)
    ├── tasks/                 CRUD filtrado por profileId
    └── apis/                  CRUD filtrado por profileId
```

Fluxo de uma requisição protegida:

```text
requireAuth (Bearer -> AuthContext) -> handler (Zod) -> controller
  -> service(auth.profileId, input) -> repository (porta) <- adaptador Prisma
```

Duas extensões do `handler`, pequenas e testadas:

- **`auth` no `HandlerInput`:** o middleware grava o `AuthContext` em
  `res.locals.auth`, e o handler o repassa para `execute({ auth, params, body })`.
  Assim, service e controller nunca leem `req`.
- **Cookies como dado:** a config aceita
  `cookies?: (result) => CookieInstruction[]`, e o handler aplica
  `res.cookie`/`res.clearCookie`. O controller de `auth` declara o cookie sem
  manipular `Response`, e o teste verifica a instrução.

Ordem de composição no `app.ts`: `express.json()`, `cookieParser()`, logger,
`/health`, `/auth` (público, exceto `/auth/me`), depois `requireAuth` para
`/users`, `/tasks` e `/apis`, e por fim `notFoundHandler` e `errorHandler`.

## 5. Front-end (Codex)

O Codex pode começar pelas telas de cadastro, login e sessão com base na seção 3,
sem esperar o backend:

- em desenvolvimento, usar o **proxy do Angular** (`proxy.conf.json` apontando
  `/auth`, `/users`, `/tasks` e `/apis` para `http://localhost:8080`). Front e API
  ficam na mesma origem, o cookie `SameSite=Strict` funciona e não é preciso CORS;
- guardar o access token **só em memória**, em um service com signal. Não usar
  `localStorage` nem `sessionStorage`;
- enviar `withCredentials: true` nas chamadas a `/auth/*`;
- um interceptor anexa `Bearer`; ao receber 401, chama `POST /auth/refresh` uma
  única vez e repete a requisição. Se o refresh também der 401, vai para o login;
- manter **uma única chamada de refresh em andamento** por aba, compartilhando a
  mesma promise/observable entre as requisições que receberem 401;
- se `POST /auth/refresh` responder 409, outra aba acabou de renovar e o navegador
  já tem o cookie novo: repetir o refresh **uma vez**;
- ao abrir o app, chamar `POST /auth/refresh` para restaurar a sessão;
- depois de logout ou troca de senha, apagar o access token da memória e ir para
  o login: o token antigo continua válido no servidor até expirar;
- enquanto a API não existir, usar fakes que devolvam exatamente os envelopes da
  seção 3.

## 6. Exemplos bons e ruins

### Propriedade dos dados (RNF-005)

```ts
// Ruim: busca por id e confia no cliente; outro perfil lê a tarefa
const task = await db.orm.public.Task.where({ id }).first();

// Ruim: descobre e depois recusa com 403, revelando que o id existe
if (task.profileId !== auth.profileId) throw new ForbiddenError('...');

// Bom: o filtro de perfil faz parte da consulta; de outro perfil = inexistente
const task = await db.orm.public.Task.where({ id, profileId, status: true }).first();
if (!task) throw new NotFoundError('Tarefa não encontrada');
```

### Resposta HTTP

```ts
// Ruim: devolve a linha do banco (hashPassword, profileId, Temporal.Instant)
execute: ({ params }) => this.repository.findRow(params.id),
present: (row) => row,

// Bom: o repository devolve a entidade do contrato; o present gera o DTO
execute: ({ auth, params }) => this.service.findById(auth.profileId, params.id),
present: toTaskResponse,
```

### Validação

```ts
// Ruim: validação manual no controller, espalhada e sem mensagens padronizadas
if (!req.body.title || req.body.title.length > 50) { res.status(400)... }

// Bom: o schema no contract.ts; o handler converte ZodError em 400 com issues
create = handler({
  schemas: { body: createTaskBodySchema },
  status: 201,
  message: 'Tarefa criada',
  execute: ({ auth, body }) => this.service.create(auth.profileId, body),
  present: toTaskResponse,
});
```

### Service independente de HTTP

```ts
// Ruim: o service conhece Express e o formato da requisição
async create(req: Request) { const profileId = req.headers[...] }

// Bom: o service recebe dados já validados e o dono explícito
async create(profileId: string, input: CreateTaskInput): Promise<Task>
```

### Login e segredos

```ts
// Ruim: mensagens diferentes revelam quais e-mails estão cadastrados
if (!user) throw new NotFoundError('E-mail não cadastrado');
if (!ok) throw new UnauthorizedError('Senha incorreta');

// Bom: uma única resposta; o hash é verificado mesmo sem usuário (tempo parecido)
const ok = await this.hasher.verify(password, user?.hashPassword ?? DUMMY_HASH);
if (!user || !ok) throw new UnauthorizedError('E-mail ou senha inválidos');
```

```ts
// Ruim: grava o refresh token puro no banco ou o registra no log
await sessions.create({ token: refreshToken });
logger.info({ body: req.body });

// Bom: persiste só o hash; o log nunca recebe corpo, cookie ou Authorization
await sessions.create({ tokenHash: sha256(refreshToken), expiresAt });
```

### Datas e ambiente

```ts
// Ruim: Temporal.Instant vaza para fora do adaptador; segredo lido direto
scheduledAt: row.scheduledAt,
const secret = process.env.JWT_SECRET!;

// Bom: conversão no adaptador; segredo validado pelo env.ts
scheduledAt: toDate(row.scheduledAt),
const secret = env.JWT_SECRET;
```

### Unicidade

```ts
// Ruim: consultar antes de inserir (condição de corrida) ou deixar virar 500
if (await repo.existsByTitle(title)) throw ...;

// Bom: inserir e traduzir a violação de unicidade do banco em ConflictError (409)
// no adaptador, sem expor o nome da constraint
```

## 7. Ordem de implementação

Cada etapa termina com `npm run check` e `npm test` verdes e um commit próprio.

1. **Infraestrutura comum:**
   - `ConflictError`;
   - `toDate` compartilhado;
   - `JWT_SECRET` no `env.ts`;
   - extensões do `handler` (`auth` e cookies), com testes.
2. **Auth sem banco:**
   - `ScryptPasswordHasher` e `JoseTokenIssuer`;
   - `requireAuth`, com testes de token ausente, inválido, expirado e válido.
3. **Migração:** feita e aplicada no banco local (seção 2).
4. **Auth completo:**
   - repository;
   - service (cadastro transacional de usuário e perfil, login com limpeza
     oportunista de sessões, rotação encadeada por `previousTokenId`, 409 para
     refresh concorrente em até 30 s, detecção de reuso, logout);
   - controller e rotas;
   - testes com repository e hasher falsos.
5. **Users:**
   - `/users/me` e perfil;
   - troca de senha revogando as sessões;
   - remoção de `GET /users/:id`.
6. **Tasks:**
   - CRUD com filtro por perfil;
   - listagem paginada com filtros;
   - no `PATCH`, validar `startTime <= endTime` no service **depois** de combinar o
     corpo com o registro salvo. O schema só compara quando os dois campos vêm no
     mesmo corpo. O mesmo vale para `apis`.
7. **Apis:** CRUD com filtro por perfil e ativação por `status`.
8. **Fechamento:**
   - atualizar `architecture.md` e este plano;
   - teste de fumaça HTTP com `db` falso;
   - relatório da sessão;
   - PR para `develop`.

Testes mínimos por service (RNF-007): caminho feliz, recurso de outro perfil (404),
conflito (409), validação e falha de infraestrutura propagada como 500 genérico.

## 8. Como começar em outra sessão

1. Atualize a base e crie a branch da etapa:

   ```bash
   cd ~/Documentos/Projetos/miuly
   git switch develop && git pull
   git switch -c feature/auth-infra   # uma branch por etapa ou grupo de etapas
   ```

2. Se a etapa envolver banco (etapa 3), suba o PostgreSQL local com
   `docker compose up -d database` **e autorize explicitamente** o contrato e a
   migração na conversa.
3. Abra o Claude Code na raiz do repositório e cole, ajustando a etapa:

   ```text
   /role-dev
   Leia docs/organizacao-agentes.md, docs/plano-corte-1-backend.md e o relatório
   mais recente em docs/relatorios/. Implemente a etapa <N> do plano, seguindo o
   módulo users como referência. Autorizo: <dependências | contrato Prisma |
   migração | nada além de código e testes>. Ao final, rode check e test, gere o
   relatório com /relatorio e abra o PR para develop.
   ```

4. Para acompanhar o front, peça ao Claude que leia o terminal do Codex no Orca
   (`orca terminal read`) e confira se o cliente segue a seção 3.

## 9. Fora deste corte

- tags em tarefas (RF-009), finanças, calendário e auditoria;
- fluxo OAuth com o Google e armazenamento de tokens de terceiros (RF-003/RF-004);
- recuperação de senha por e-mail, verificação de e-mail e limite de tentativas
  de login. **O limite de tentativas deve entrar antes de qualquer deploy público.**

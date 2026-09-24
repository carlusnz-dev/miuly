# Arquitetura

## Objetivo

Permitir que finanças, tarefas, calendário e auditoria evoluam de forma
independente, mantendo regras de negócio testáveis e integrações substituíveis.

## Limites

```text
Angular SPA -> HTTP/Express -> casos de uso -> domínio
                                      |-> persistência/Prisma
                                      |-> Google Calendar/Gmail
                                      |-> auditoria e observabilidade
```

- **Domínio:** entidades, valores e invariantes sem dependências de frameworks.
- **Aplicação:** casos de uso e portas para persistência, relógio e provedores.
- **Adaptadores:** controllers Express, repositórios Prisma e clientes Google.
- **Composição:** configuração, injeção de dependências e ciclo do servidor.

## Estrutura padrão de módulo (planejada)

Cada módulo HTTP deve expor uma composição previsível, sem permitir que tipos do
ORM escapem para o contrato público:

```text
src/
  core/
    contracts/       tipos-base de entrada, saída e validação
    http/            tipos-base de controller e routes
    application/     tipo-base de service de módulo
    persistence/     tipo-base de repository
  modules/<modulo>/
    contract.ts      schemas, DTOs e tipos públicos do módulo
    repository.ts    porta de persistência e adaptador Prisma
    service.ts       regras e orquestração da aplicação
    controller.ts    tradução entre HTTP e service
    routes.ts        declaração e vinculação das rotas Express
    index.ts         composition root do módulo
```

A base em `core/` é composta por classes abstratas pequenas. Cada classe mantém
privada somente sua dependência direta, recebida obrigatoriamente pelo construtor,
e a disponibiliza à subclasse por um getter protegido. A base não implementa CRUD
genérico nem acopla todos os módulos ao Express ou ao Prisma.

```ts
abstract class BaseContract<TInput, TOutput> {
  abstract parse(input: unknown): TInput;
  abstract present(output: TOutput): unknown;
}

abstract class BaseRepository<TDatabase> {
  constructor(private readonly database: TDatabase) {}
  protected get db(): TDatabase;
}

abstract class BaseService<TRepository> {
  constructor(private readonly repositoryInstance: TRepository) {}
  protected get repository(): TRepository;
}

abstract class BaseController<TService> {
  constructor(private readonly serviceInstance: TService) {}
  protected get service(): TService;
}

abstract class BaseRoutes<TController, TRouter> {
  constructor(private readonly controllerInstance: TController) {}
  protected get controller(): TController;
  abstract register(router: TRouter): TRouter;
}
```

Essas classes descrevem papéis mínimos, não um CRUD universal. Cada módulo possui
uma classe de service, que concentra seus métodos de aplicação e recebe o
repository correspondente. Operações como `update`, `delete` e buscas específicas
somente existem quando houver comportamento real no módulo. Controllers recebem o
service do módulo; routes recebem controllers. Somente o `index.ts` instancia
implementações concretas.

### Service: contrato e implementação

O service segue o par `Service`/`ServiceImpl` do Java. Em `service.ts`, a
interface declara os métodos do módulo, e a classe concreta herda a base e
implementa essa interface:

```ts
export interface UserService {
  findMe(userId: number): Promise<User>;
}

export class UserServiceImpl
  extends BaseService<UserRepository>
  implements UserService { ... }
```

- o controller e os outros módulos dependem só da interface (`UserService`);
- o `index.ts` exporta apenas tipos (a interface e as portas) e a fábrica do
  módulo. `UserServiceImpl` e o adaptador Prisma nunca são exportados para fora
  do módulo;
- quando um módulo precisa de outro, declara a porta mínima de que precisa
  (por exemplo, `SessionRevoker` em `users`), e o módulo fornecedor a satisfaz
  pela sua interface pública. A composição acontece no `app.ts`.

```text
routes -> controller -> service -> repository (porta)
                                  ^
                                  |
                            adaptador Prisma
```

### Convenções de contrato

- schemas Zod validam dados desconhecidos na borda;
- DTOs usam tipos TypeScript nativos e não importam tipos internos do ORM;
- entidades persistidas e respostas HTTP são tipos distintos;
- datas HTTP usam ISO 8601; o adaptador converte os tipos retornados pelo banco;
- erros de domínio/aplicação não dependem de `Request` ou `Response`;
- handlers preservam `this` por arrow function ou binding explícito;
- a montagem do módulo registra as rotas antes do middleware global de erro.

### Camada HTTP compartilhada

`src/core/http/handler.ts` traduz HTTP para o service sem que controller, service
ou domínio tratem `Request`/`Response` diretamente:

```ts
findById = handler({
  schemas: { params: userIdParamsSchema }, // params, query e body opcionais
  message: 'Usuário encontrado',
  execute: ({ params }) => this.service.findById(params.id),
  present: toUserResponse, // entidade -> DTO
});
```

- `handler` valida a entrada com Zod, chama `execute`, aplica `present` e responde
  `{ ok: true, message, data }`; `data` pode ser objeto ou lista;
- `paginatedHandler` recebe de `execute` um `Page<T>` (`core/types/pagination.ts`),
  aplica `present` a cada item e acrescenta
  `pagination: { page, pageSize, totalItems, totalPages }`;
  `paginationQuerySchema` (`core/http/pagination.ts`) valida `page` (padrão 1) e
  `pageSize` (padrão 20, máximo 100);
- erros respondem `{ ok: false, message, issues? }`: `ApiError` usa seu status;
  `ZodError` vira 400 com `issues` (`path`, `message`); JSON malformado vira 400;
  rota inexistente vira 404; qualquer outro erro vira 500 com mensagem genérica e
  detalhes somente no log;
- os tipos dos envelopes ficam em `core/types/response.ts`.

Variáveis de ambiente são validadas por Zod em `src/core/env.ts` ao iniciar o
processo (`NODE_ENV`, `PORT`, `DATABASE_URL`); valores inválidos interrompem a
inicialização. O código lê `env`, nunca `process.env` diretamente. Mensagens de
validação do Zod usam o locale `pt` (`src/core/zod.ts`).

### Módulo `users`

Rotas do usuário autenticado: `GET`/`PATCH /users/me`, `PUT /users/me/password` e
`GET`/`PATCH /users/me/profile`. `GET /users/:id` foi removido, porque expunha o
e-mail de qualquer usuário. A troca de senha verifica a senha atual, grava o novo
hash e revoga todas as sessões pela porta `SessionRevoker`. O username alterado
também vira o `slugUrl`, e o conflito de unicidade responde 409. O adaptador
Prisma mapeia cada linha explicitamente (`toUser`, `toProfile`), então
`hashPassword` nunca sai dele. Instantes são convertidos por `prisma/instant.ts`,
e colunas `VarChar(n)` recebem a marca de tipo por `prisma/varchar.ts`.

### Módulo `auth`

Implementa o [ADR 0002](adr/0002-autenticacao-access-refresh-token.md):
`POST /auth/register`, `/login`, `/refresh` e `/logout` são públicos, e
`GET /auth/me` exige o access token. Peças:

- `tokens.ts`: `TokenService` (porta) e `JoseTokenService`, que emite e valida o
  JWT HS256 com algoritmo, emissor e audiência fixos, gera o refresh token opaco e
  calcula seu SHA-256;
- `middleware.ts`: `requireAuth`, que valida o `Bearer` e grava o `AuthContext`
  em `res.locals.auth`, lido pelas rotas declaradas com `auth: true` no `handler`;
- `service.ts`: `AuthService`/`AuthServiceImpl`, com cadastro transacional de
  usuário e perfil, login com mensagem única e hash de referência para e-mail
  inexistente, rotação encadeada por `previousTokenId`, 409 para renovação
  concorrente em até 30 s, revogação de todas as sessões em caso de reuso e
  limpeza das sessões revogadas há mais de 7 dias a cada login;
- `controller.ts`: declara o cookie `miuly_refresh` (`HttpOnly`,
  `SameSite=Strict`, `Path=/auth`, `Secure` em produção) como instrução para o
  `handler`, sem manipular `Response`.

O `app.ts` compõe os módulos: `authModule` devolve o router, o `requireAuth`, o
`PasswordHasher` e o revogador de sessões usado por `users`. O segredo vem de
`JWT_SECRET`, validado no `env.ts` com pelo menos 32 caracteres, e é repassado
pelo `server.ts`.

### Módulo `apis`

CRUD das conexões com APIs externas (`ApiConnectionService`), montado em `/apis`
atrás do `requireAuth`. Toda consulta filtra por `profileId` do token, então a
conexão de outro perfil responde 404. A listagem é paginada, em ordem decrescente
de criação, com filtro opcional por `status`. Título duplicado no perfil
responde 409. No `PATCH` com só um extremo do intervalo, o service compara com o
valor salvo. `DELETE` remove a linha; desativar é `PATCH { status: false }`.

### Corte 1: `auth`, `users`, `tasks` e `apis`

Os contratos dos quatro módulos estão definidos em `modules/<modulo>/contract.ts`,
com schemas compartilhados em `core/http/schemas.ts` (UUID, instante ISO 8601 com
fuso, lista de pessoas, "ao menos um campo" e intervalo de tempo). Os schemas de
identidade (e-mail, username e senha) pertencem a `users`, e `auth` os importa.
A autenticação segue o [ADR 0002](adr/0002-autenticacao-access-refresh-token.md).
A implementação e o contrato HTTP estão no
[plano do corte 1](plano-corte-1-backend.md).

Integrações externas devem ser idempotentes, observáveis e tolerantes a retry.
O identificador do provedor não substitui o identificador interno. Datas são
persistidas com fuso/offset quando representam um instante; eventos de dia
inteiro preservam sua semântica de data.

## Decisões pendentes

- armazenamento e rotação segura de tokens OAuth;
- política de sincronização incremental e resolução de conflitos;
- moeda base, contas compartilhadas e recorrência financeira;
- retenção, mascaramento e acesso aos registros de auditoria.

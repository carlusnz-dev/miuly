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

Recriado sobre as classes-base e o handler HTTP. Expõe `GET /users/:id`, que
valida `id` como inteiro positivo dentro de `int4`, responde 404 quando o usuário
não existe e nunca inclui `hashPassword`. O adaptador Prisma converte os
`Temporal.Instant` do codec `pg/timestamptz-temporal@1` para `Date`; o DTO os
apresenta em ISO 8601. Contrato, repository, service, controller, rota e o app
montado têm testes unitários com Vitest (`npm test`), usando um `db` falso.

Integrações externas devem ser idempotentes, observáveis e tolerantes a retry.
O identificador do provedor não substitui o identificador interno. Datas são
persistidas com fuso/offset quando representam um instante; eventos de dia
inteiro preservam sua semântica de data.

## Decisões pendentes

- estratégia de autenticação e propriedade dos dados;
- armazenamento e rotação segura de tokens OAuth;
- política de sincronização incremental e resolução de conflitos;
- moeda base, contas compartilhadas e recorrência financeira;
- retenção, mascaramento e acesso aos registros de auditoria.

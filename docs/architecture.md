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

### Recriação planejada de `users`

O esboço anterior do módulo foi removido para que `users` seja recriado sobre as
classes-base em uma mudança posterior e testada. A sequência prevista é:

1. remover `Varchar` dos DTOs e definir identificador, datas e respostas próprios;
2. separar a porta `UserRepository` do adaptador Prisma;
3. criar um único `UserService`, com um método para cada operação do módulo;
4. validar o parâmetro `id` na borda e mapear ausência para erro tipado;
5. tipar o handler e registrar `GET /users/:id` no router do módulo;
6. compor repository, service, controller e routes no `index.ts`;
7. adicionar testes unitários do service, controller e registro de rota.

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

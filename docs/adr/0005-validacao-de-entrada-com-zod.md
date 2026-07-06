# ADR-0005: Validação de entrada com Zod na camada de controller

- **Status:** Proposto
- **Data:** 2026-07-05
- **Decisores:** Carlos (Arquiteto)

## Contexto

As rotas do módulo `User` recebiam `req.body` como `any` e o entregavam direto às
camadas de baixo. Os tipos do TypeScript (`UserModel`, `UserCreateInput` do Prisma)
davam uma falsa sensação de segurança: eles existem apenas em tempo de compilação e
**somem em runtime**, então não validam o dado que realmente chega pela rede. Na
prática:

- Regras de negócio (senha ≥ 8, e-mail com formato válido, `username` entre 3 e 30)
  não cabiam nos tipos e ficavam sem verificação.
- A defesa contra *mass assignment* (ver [ADR-0004](0004-estrategia-de-autenticacao.md))
  dependia de montar o payload à mão, campo a campo, e de lembrar de fazê-lo.
- As assinaturas de service (`data: UserModel`) "mentiam" sobre o que de fato chegava,
  e o `tsc` passava verde mesmo com a entrada não validada, porque `any` é atribuível
  a qualquer tipo.

Como os próximos módulos do MVP (Financeiro RF002, To-do RF001) vão receber entrada do
cliente pelo mesmo caminho, decidir agora um padrão de validação evita repetir o
problema em cada módulo novo.

## Decisão

Vamos usar **Zod** para validar toda entrada de cliente na **camada de controller**,
antes de chamar o service. Cada operação tem um schema declarado (ex.:
`createUserSchema`, `updateUserSchema` em `types/user.type.ts`), e o controller valida
`req.body` com `.safeParse()`, retornando `400` quando a validação falha. Os tipos de
entrada dos services passam a ser **inferidos do schema** (`z.infer`), tornando o schema
a fonte única da verdade para validação (runtime) e tipagem (compilação).

## Alternativas consideradas

- **Zod na camada de controller (escolhida)** — validação na borda, antes da regra de
  negócio. Prós: erro de entrada é tratado como erro do cliente (`400`) no lugar certo;
  service recebe dado já validado e tipado; `z.object` descarta campos não declarados,
  matando *mass assignment* de graça; um único schema gera validação + tipo. Contras:
  uma dependência a mais; validação repetida em cada controller (mitigável no futuro
  com um middleware genérico).
- **Confiar nos tipos do Prisma (`UserCreateInput`)** — usar o tipo gerado como
  contrato de entrada. Rejeitada: o tipo some em runtime, não valida regra de negócio,
  e ainda inclui campos que o cliente não deveria controlar (`role`), reabrindo
  *mass assignment*.
- **Validação manual com `if`s** — checar campo a campo na mão. Rejeitada: verboso,
  fácil de esquecer um caso, não infere tipo, e mistura validação com regra de negócio.
- **Middleware genérico de validação (`validate(schema)`)** — considerada e adiada.
  É mais elegante e reaproveitável, mas exige domínio de middleware que ainda está sendo
  aprendido. Fica como follow-up: começar validando no controller (mais explícito) e
  refatorar para middleware depois.

## Consequências

- **Positivas:**
  - Entrada validada na borda; services recebem dado confiável e tipado.
  - *Mass assignment* fechado por padrão (`z.object` descarta chaves não declaradas).
  - Schema como fonte única: validação e tipo não podem divergir.
  - Padrão replicável para os próximos módulos (RF002, RF001).
- **Negativas / trade-offs:**
  - Dependência do Zod e do seu ciclo de versões (projeto usa Zod v4, cuja API de
    formatos mudou em relação à v3 — ex.: `z.email()`).
  - Validação declarada por controller; sem um middleware, há repetição do padrão
    `safeParse` → `400`.
  - Respostas de erro de validação (`reason: 'invalid'`) são montadas direto no
    controller, fora do `ServiceResult` tipado — sem garantia de shape uniforme.
- **Follow-ups:**
  - Decidir se `update` é PUT (schema completo) ou PATCH (schema `.partial()`), e o
    tratamento de body vazio (`.refine()` "pelo menos um campo").
  - Avaliar extrair um middleware `validate(schema)` reaproveitável.
  - Padronizar o formato da resposta de erro de validação (`z.flattenError`) para não
    vazar o `ZodError` cru ao cliente.

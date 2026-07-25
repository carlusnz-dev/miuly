# Relatório de sessão — 2026-07-16

## Contexto

Carlos retomou o backend depois de um período focado em documentação e pediu um
**inventário do estado real do código** frente ao escopo do MVP, para saber o que falta
antes do prazo (16/jul/2026). Lembrava estar no meio de Finances e Bank, com Types e Task
ainda por fazer. Leitura do backend delegada ao Antigravity (Gemini) via MCP agy-bridge.
A sessão evoluiu para debugging guiado do módulo Bank e terminou num ADR sobre ownership.

## Tópicos abordados

1. **Inventário do backend** (delegado ao Agy) — camadas existentes por módulo, CRUD por
   camada, rotas montadas, proteção JWT, validação Zod e ownership.
2. **Falso positivo do relatório da IA** — o Agy apontou `z.email()` como "método
   inexistente". O projeto usa **Zod v4** (`^4.4.3`), onde `z.email()` é a forma
   recomendada e `z.string().email()` é que está deprecado. Achado descartado após
   conferir a versão no `package.json`.
3. **Colisão de rotas no Express** — `GET /bank/all` caía em `findBankById` com
   `id = "all"`, porque `/:id` estava registrado antes e o Express casa na primeira rota
   compatível, de cima para baixo.
4. **`.default(0)` do Zod no fluxo de update** — `updateBankController` validava com
   `createBankSchema`, cujo `.default(0)` injetava `balance: 0` em todo request; o Prisma
   zerava o saldo ao atualizar só o `name`.
5. **Tipos do TypeScript não existem em runtime** — recorrente na sessão: `Partial<>` não
   removeu chave, `Pick<>` não filtrou retorno, e nenhum dos dois impediu o dado
   fabricado pelo Zod.
6. **Teste que passa pelo motivo errado** — o update "funcionou" no Postman porque
   `data.balance && ...` descartava o `balance: 0` injetado (0 é falsy), mascarando a
   causa e criando um bug novo: impossível zerar um banco.
7. **Ownership e recorte de campos: Service vs. Repository** — comparação das duas
   abordagens, que virou o ADR-0007.

## Decisões e recomendações

**Decisões do Carlos nesta sessão:**

- **Rotas em REST puro** para Bank e User: `GET /`, `POST /`, `GET /:id`, `PUT /:id`,
  `DELETE /:id` — em vez de `/create`, `/update/:id`, `/delete/:id`. Além de resolver a
  colisão `/all` vs `/:id` por construção, o método HTTP passa a expressar a ação e o
  caminho só nomeia o recurso.
- **ADR-0007 — ownership e recorte de campos na camada de Service (Opção A).** O
  repository devolve a linha completa; o service valida posse e recorta os campos.
  Justificativa: manter o registro completo disponível para regra de negócio futura e
  poder distinguir `not_found` de `unauthorized`.
- **Dívida técnica assumida conscientemente:** responder 401 em recurso alheio e 404 em
  inexistente permite *enumeration* de IDs. Aceito por ser projeto pessoal de usuário
  único; revisar se o Miuly for comercializado ou aberto a usuários não confiáveis.
- **Controle de acesso por role** em `findAllUsersService` e `findUserByIdService`
  (exige `ADMIN`) — decidido e implementado por Carlos no commit `77566ff`.

**Commits da sessão:**

| Commit | O que entrou |
| --- | --- |
| `71bb2a5` | `feat(bank)` — update de nome e saldo (controller, service, rota). |
| `467acbd` | `fix(bank)` — ownership no `updateBankService`; rotas migradas para REST. |
| `beb3818` | `fix(bank)` — liga `updateBankSchema` no controller; `max(3)`→`max(30)`; guarda do balance distingue ausência de zero. |
| `55f3baa` | `fix(bank)` — recorte real dos campos no `updateBankService` e `deleteBankService`; `omit: { user_id: true }` em `findAllBanksByUserId`. |
| `77566ff` | `feat(user)` — `authMiddleware` nas rotas de user; verificação de role `ADMIN`; rotas migradas para REST. |

**Recomendações da IA a validar por Carlos (arquiteto):**

- Ver "Próximos passos" — os achados dos dois últimos commits não foram revisados em
  profundidade durante a sessão e precisam da decisão dele.

## Aprendizados

1. **Tipo do TypeScript não existe em runtime.** `Partial<>`, `Pick<>` e `Omit<>` são
   apagados na compilação — não filtram, não removem chave, não recortam objeto. Quem
   produz o dado errado é o código de runtime (o `.default()` do Zod, o retorno cru do
   Prisma). Corrigir o tipo não corrige o comportamento. O recorte real é
   desestruturar e remontar o objeto, ou usar `select`/`omit` na query.
2. **Tipagem estrutural não acusa campo a mais.** Um objeto com propriedades além do
   contrato satisfaz o tipo — ele tem tudo que foi pedido. A checagem de excesso
   ("excess property check") só roda em **literais** escritos na hora, não em variáveis.
   Por isso `return { data: updatedBank }` com `Pick<>` no retorno passou silencioso.
3. **Teste verde não é prova de correção**, só de que aquele caso não falhou. O update
   "passou" pelo motivo errado: o `balance: 0` injetado era descartado por uma guarda
   falsy, e o caso que doía (`{"balance": 0}`, intenção legítima de zerar) nunca foi
   exercitado. Antes de dar "testado, ok": *testei o caso que me machucaria se estivesse
   errado?*
4. **Curinga de rota é guloso.** `/:id` casa com qualquer segmento único, inclusive
   `"all"`. Rota estática antes de dinâmica — ou REST puro, e o conflito deixa de existir.
5. **`&&` não distingue ausência de zero.** A pergunta certa não é "o campo tem valor?"
   mas "a chave veio no request?" — `!== undefined`, não truthiness. Vale para todo
   campo numérico ou booleano opcional.
6. **Relatório de IA é hipótese, não veredito.** O falso positivo do `z.email()` veio de
   memória de uma versão anterior da lib. Conferir versão/doc antes de "corrigir" o que
   funciona.
7. **ADR não é burocracia.** O mesmo padrão de ownership estava implementado de três
   jeitos diferentes em dois módulos porque a regra nunca tinha sido escrita.
8. **Registrar dívida ≠ ignorar problema.** O enumeration foi pesado contra a necessidade
   real, aceito e registrado com gatilho de revisão. Isso é engenharia; ignorar seria não
   saber que existe.

## Links e materiais

- Colisão e ordem de rotas — [Express — Routing](https://expressjs.com/en/guide/routing.html)
- Semântica de método HTTP e desenho REST — [MDN — HTTP request methods](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods)
- `.default()` e schemas de update — [Zod — Defaults](https://zod.dev/api?id=defaults)
- `z.email()` na v4 (falso positivo da sessão) — [Zod v4 — Changelog](https://zod.dev/v4/changelog)
- Tipos apagados na compilação — [TypeScript — Everyday Types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html)
- Tipagem estrutural e excess property check — [TypeScript — Object Types](https://www.typescriptlang.org/docs/handbook/2/objects.html#excess-property-checks)
- Recorte de campos na query — [Prisma — Select fields](https://www.prisma.io/docs/orm/prisma-client/queries/select-fields)
- IDOR, ownership e enumeration (404 vs. 401) — [OWASP — Testing for IDOR](https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/05-Authorization_Testing/04-Testing_for_Insecure_Direct_References)
- Falha aberta em checagem de autorização — [OWASP — A01:2021 Broken Access Control](https://owasp.org/Top10/A01_2021-Broken_Access_Control/)

## Próximos passos

**Achados pendentes de revisão nos commits `55f3baa` e `77566ff`** (não revisados em
profundidade na sessão — validar antes de seguir):

1. **`POST /user/` agora exige `authMiddleware`** (`user.route.ts`). Cadastro de novo
   usuário virou rota autenticada — ninguém consegue se registrar sem já estar logado.
   Confirmar se é intencional (ex.: usuário único criado por seed) ou se a rota deve ser
   pública.
2. **Checagem de role falha aberta.** Em `findAllUsersService` e `findUserByIdService`,
   o padrão `if (foundUser && !(foundUser.role == 'ADMIN'))` deixa passar quando
   `foundUser` é `null` — token válido de usuário já deletado listaria todos os usuários.
   A forma segura nega por padrão: `if (!foundUser || foundUser.role !== 'ADMIN')`.
3. **`findUserByIdService(userId, id)`** — os dois parâmetros são `number` e os nomes
   estão invertidos em relação ao uso (`userId` é o alvo, `id` é o usuário logado).
   Trocar a ordem na chamada não gera erro de compilação. Renomear.
4. **`userRouter.get('', ...)`** usa string vazia; as demais rotas usam `'/'`. Uniformizar.
5. **`omit: { user_id: true }` em `findAllBanksByUserId`** coloca o recorte no
   repository — o oposto do que o ADR-0007 acabou de decidir (Opção A: recorte no
   service). Alinhar ao ADR ou reabrir a decisão antes de aceitá-lo.
6. **`findBankByIdService` ainda não recebe `userId`** nem valida posse (IDOR aberto) —
   é o follow-up nº 1 do ADR-0007.

**Sequência sugerida (validar com Carlos):**

1. Resolver os achados acima (1 e 2 são de segurança).
2. Auditar `user.service.ts` quanto a vazamento de `password` — o model `User` tem a
   coluna e o `Omit<UserModel, 'password'>` no tipo **não** a remove em runtime
   (mesmo mecanismo do `Pick<>` desta sessão).
3. Aplicar o ADR-0007 em Bank → Finances.
4. Decidir o escopo de **Types**: CRUD gerenciável ou tabela fixa via seed do Prisma?
   Bloqueia Finances e Task, que referenciam `type_id`. Recomendação da IA: seed no MVP.
5. Finances: expor update/delete/findById (o repository já os tem) e validar se o
   `bank_id` recebido pertence ao usuário.
6. Task do zero — **candidato a TDD**, já que o módulo ainda não existe.
7. Google Calendar (RF008) — nada feito, depende de OAuth2. Maior risco de prazo.

**Nota sobre testes:** Carlos identificou que precisa aprender testes ("pode me custar
bastante NÃO testar todos os casos"). Sugerido `superpowers:test-driven-development`
aplicado ao módulo Task: escrever o teste antes obriga a vê-lo **falhar** primeiro, que é
a defesa contra o "passou pelo motivo errado" desta sessão.

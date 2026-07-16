# Middleware jwt logout e fechamento rf006
--- Cabeçalho ---
Autor: Claude Code
Data: 2026-07-07
Módulos: Backend
Atividade: Middleware jwt logout e fechamento rf006

# Corpo

## Contexto

Continuação direta do login (relatório `2026-07-06-modulo-auth-login.md`). O objetivo era
fechar as pendências do **RF006 (autenticação)**: o **logout**, o **middleware de
verificação de JWT** (o item que destrava Financeiro e To-do) e os **testes**. Carlos
trouxe um `logoutService` esboçado no `auth.service.ts` desconfiando que estava no caminho
errado ("quem controla token/cookie é o controller, não o service"). A sessão evoluiu:
diagnóstico do logout → implementação por Carlos → middleware (roteiro socrático) →
tipagem → testes com Vitest → teste de runtime. Modo didático (`role-dev`): a IA revisou e
guiou; Carlos escreveu o código.

## Tópicos abordados

1. **Logout no lugar errado (service × controller):**
   - Critério para um service existir: ter **regra de negócio** ou **falar com
     repositório**. Logout com JWT stateless não tem nenhum dos dois → é controller puro
     (`res.clearCookie`). O `logoutService` foi removido.
   - Quando o logout *mereceria* um service: se houvesse **blocklist** (revogação
     imediata) — mas o ADR-0006 adiou isso de propósito (fora do MVP).
   - Gotcha do `clearCookie`: as opções que compõem a **identidade** do cookie
     (`httpOnly`, `sameSite`, `path`) precisam bater com as do `res.cookie`; `maxAge`
     (validade) é irrelevante para limpar. Carlos acertou mantendo `httpOnly`/`sameSite` e
     dropando `maxAge`.
   - Revisão do controller: removidos um **wrapper de 1 linha** que não pagava aluguel e um
     **try/catch morto** (`clearCookie` não lança) → handler enxuto (~4 linhas).
2. **Middleware de verificação de JWT (roteiro em fases):**
   - Modelo mental "guarda de portão": lê o token → `verify` → injeta quem é → `next()` ou
     `401`. Três saídas de um middleware: `next()`, responder, ou `next(err)`.
   - **Fase 0 (bloqueador):** ligar o `cookie-parser` no `app.ts` **antes** das rotas
     (senão `req.cookies` é `undefined`). Feito, na ordem correta.
   - **Por que injetar `req.userId`:** é a ponte entre "quem é você" (autenticação) e "o
     que é seu" (controllers escopam dados por `req.userId`). A identidade vem do token
     assinado (confiável), **nunca do body**. Injeta-se em `req` (não `req.body`), que é a
     "carona" compartilhada por todo o pipeline.
   - Bug encontrado: `jwt.verify` **retorna** o payload decodificado e Carlos estava
     **jogando o retorno fora** (por isso travou na injeção) + verificava o token **duas
     vezes** (dentro e fora do try). Corrigido: capturar o retorno, um `verify` só dentro
     do try, fluxo feliz reto até `next()`.
3. **Tipagem (TypeScript):**
   - `jwt.verify` retorna `string | JwtPayload` → acessar `.id` exige **narrowing** (type
     guard `typeof payload === 'string' || !payload.id`), que também valida o formato em
     runtime. Evitar o atalho `as JwtPayload` (afirma sem verificar).
   - Estender o `Request` do Express para ter `userId`: Carlos optou por
     `declare module 'express'` (module augmentation). Funciona porque o arquivo é um
     **módulo** (tem imports) → mescla; num arquivo script substituiria.
   - Pegadinha de truthiness: `!payload.id` rejeita `id === 0`; ok para `serial` (começa em
     1), mas o check honesto de presença seria por tipo.
4. **Comparação cookie httpOnly × Bearer header** (dúvida do Carlos com um middleware de
   tutorial): mesmo modelo mental, diferem em (a) origem do token (cookie vs
   `Authorization: Bearer`), (b) parsing (`split(' ')` no Bearer), (c) o exemplo **não
   injetava** nada — incompleto para o projeto. Cookie httpOnly (escolha do ADR-0006) é
   mais seguro contra XSS para cliente web; Bearer é comum em APIs não-browser.
5. **Testes unitários com Vitest:**
   - Mockar o `jwt` = mesma receita do mock de repositório, mas pelo nome do pacote
     (`vi.mock('jsonwebtoken')`). Sucesso: `mockReturnValue({ id: 1 })`; falha:
     `mockImplementation(() => { throw ... })`.
   - Testar middleware ≠ testar service: fabricar `req`/`res`/`next` e **espiar
     comportamento**. `res.status` precisa de `mockReturnThis()` para permitir o
     encadeamento `.status().json()`.
   - **Bug de isolamento:** `beforeEach` importado de `node:test` em vez de `vitest` →
     `vi.resetAllMocks()` nunca rodava → estado vazava entre testes (o `TAP version 13` no
     output era o sinal). Corrigido importando de `vitest`.
   - **Erro conceitual no teste de sucesso:** middleware que dá certo **não responde
     `200`** — ele chama `next()` e delega; o `200` é do controller. Sucesso se mede por
     `next()` chamado + `req.userId` injetado (e, rigorosamente, `res.status` **não**
     chamado). Também um copy-paste deixou o `verify` lançando no teste de sucesso.
   - Padrão que emergiu: 3 testes = 3 caminhos do código (**cobertura de caminhos**).
6. **Teste de runtime:** criada rota protegida `GET /auth/me` (retorna `req.userId`) para
   exercitar o middleware ponta a ponta. Validado no Postman: login OK, rota protegida
   com/sem cookie, credenciais erradas, body inválido, logout. Tudo OK.

## Decisões e recomendações

- **Decisão de Carlos:** logout é **controller puro** (`res.clearCookie`), sem service —
  coerente com o ADR-0006 (sem blocklist no MVP).
- **Decisão de Carlos:** estender o `Request` via `declare module 'express'` (em vez da
  `interface AuthRequest` local que ele tinha tentado antes).
- **Decisão de Carlos:** criar `GET /auth/me` como rota protegida (endpoint "quem sou eu?")
  — útil para o front e ideal para testar o middleware.
- **Recomendação da IA (pendente, validar por Carlos):**
  - Typo `reason: 'unaunthorized'` ainda presente no `catch` do middleware → o certo é
    `'unauthorized'`. Considerar **tipar** as respostas de erro (contra o enum de
    `result.type.ts`) para o `tsc` pegar o typo.
  - Rever `reason: 'not_found'` no token ausente → `'unauthorized'` é mais coerente.
  - Mover o `declare module` para um `src/types/express.d.ts` dedicado (organização;
    manter `export {}` se não houver import).
  - Dívidas herdadas do relatório anterior ainda abertas: validar `JWT_SECRET` no boot (o
    `as string` esconde a falta), `expiresIn`/`maxAge` via env, `secure: true` em produção,
    remover o pacote `cookies-parser` (typo).

## Aprendizados

- **A existência de uma camada é ditada por responsabilidade, não por gosto:** service só
  se justifica com regra de negócio ou acesso a repositório. Logout stateless não tem
  nenhum → controller puro. (Blocklist mudaria isso.)
- **`clearCookie` precisa casar com o `res.cookie`:** o browser identifica o cookie por
  nome + atributos de identidade (`httpOnly`, `sameSite`, `path`); `maxAge` é validade, não
  identidade.
- **try/catch não é decoração:** só se justifica onde o código realmente pode lançar
  (`jwt.verify` sim; `clearCookie` não).
- **Injetar em `req` é a ponte auth → controllers:** identidade confiável vem do token
  assinado, nunca do body; anexa-se em `req` porque ele é o objeto que atravessa o
  pipeline. Sem injetar, cada controller re-verificaria o token (duplicação).
- **`jwt.verify` retorna o payload** — e retorna `string | JwtPayload`, então acessar `.id`
  exige **narrowing** (type guard), que de brinde valida o formato em runtime.
- **`declare module` faz module augmentation** (mescla) apenas em arquivo-módulo (com
  import/export); em script, substituiria.
- **`!valor` testa truthiness, não existência:** `0`/`''`/`false` são valores válidos que
  caem no `!` — cuidado em campos numéricos.
- **cookie httpOnly × Bearer header:** mesma ideia de guarda, origens diferentes do token;
  httpOnly protege de XSS (cliente web), Bearer serve APIs não-browser.
- **Testar middleware ≠ testar service:** fabrica-se `req/res/next` e espia-se
  comportamento; `mockReturnThis()` viabiliza o encadeamento `res.status().json()`.
- **Isolamento de teste:** testes não podem depender da ordem; `beforeEach(reset)` garante
  o "começar do zero". Cuidado com imports homônimos entre `node:test` e `vitest`.
- **Sucesso de middleware não é `200`:** é `next()` + injeção; responder é papel do
  controller. Cada teste cobre um **caminho** do código.
- **Ler o erro como detetive:** valor de *outro* teste aparecendo → vazamento de estado,
  não bug de lógica (o código de produção estava certo).

## Links e materiais

- Limpar cookie e flags: [Express — `res.clearCookie()`](https://expressjs.com/en/api.html#res.clearcookie) · [MDN — Set-Cookie](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie)
- Middleware no Express: [Express — Writing middleware](https://expressjs.com/en/guide/writing-middleware.html) · [Using middleware](https://expressjs.com/en/guide/using-middleware.html)
- Error handling central (contexto do try/catch): [Express — Error Handling](https://expressjs.com/en/guide/error-handling.html)
- Ler cookies: [cookie-parser (npm)](https://www.npmjs.com/package/cookie-parser)
- Verificar token e retorno (`JwtPayload`): [jsonwebtoken — verify](https://github.com/auth0/node-jsonwebtoken#jwtverifytoken-secretorpublickey-options-callback)
- Narrowing / type guards: [TS Handbook — Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)
- Estender o `Request`: [TS Handbook — Declaration Merging](https://www.typescriptlang.org/docs/handbook/declaration-merging.html) · [LogRocket — Extend Express Request in TS](https://blog.logrocket.com/extend-express-request-object-typescript/)
- Cookie httpOnly × XSS: [OWASP — Session Management Cheat Sheet (HttpOnly)](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html#httponly-attribute)
- Mock e ciclo de vida no Vitest: [Vitest — `vi.mock`/`vi.mocked`](https://vitest.dev/api/vi.html#vi-mock) · [Mock Functions](https://vitest.dev/api/mock.html) · [`beforeEach`](https://vitest.dev/api/#beforeeach) · [`resetAllMocks` vs `clearAllMocks` vs `restoreAllMocks`](https://vitest.dev/api/vi.html#vi-resetallmocks)
- Testar cookie httpOnly no curl (cookie jar `-c`/`-b`): [curl — Cookies](https://everything.curl.dev/http/cookies)

## Próximos passos

- **Higiene do RF006 (pendências acima):** corrigir o typo `unaunthorized`, rever
  `reason` do token ausente, validar `JWT_SECRET` no boot, mover `expiresIn`/`maxAge` para
  env, `secure: true` em produção, remover `cookies-parser`.
- **Proteger as rotas** dos módulos consumidores com o `authMiddleware` conforme
  Financeiro e To-do forem entrando (rotas de `User` seguem abertas por ora).
- **Avançar para os RFs restantes do MVP** — com a base de autenticação fechada, partir
  para **Financeiro (RF002)** e **To-do (RF001)**; **Google Calendar (RF008)** na
  sequência. Padrão esperado: modelagem/contrato primeiro (design-first), ADR quando
  houver decisão de arquitetura, camadas Controller → Service → Repository.
- **Levar a seção "Aprendizados" para o Obsidian.**

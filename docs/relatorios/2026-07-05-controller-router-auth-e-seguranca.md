# Controller router auth e seguranca
--- Cabeçalho ---
Autor: Claude Code
Data: 2026-07-05
Módulos: Backend
Atividade: Controller router auth e seguranca

# Corpo

## Contexto

Continuação direta da sessão registrada em `2026-07-04-eslint-prettier-e-padrao-de-retorno.md`.
Com o `user.repository.ts` e `user.service.ts` já revisados, Carlos avançou para
a camada de apresentação do módulo de Auth: Controller e Router, para poder
testar a criação e consulta de usuários no Postman. No meio do caminho, surgiu
um problema de tooling (ESLint/tsconfig) e, ao final, uma discussão de
segurança sobre mass assignment e controle de acesso por `role`.

## Tópicos abordados

1. **Modo de trabalho confirmado:** Carlos escreve o Controller e o Router, a
   IA revisa rodando `tsc`/`eslint` de verdade — reforço do padrão já
   estabelecido nas sessões anteriores.
2. **Revisão do `user.controller.ts` e `user.route.ts` (1ª rodada) — 3 bugs de
   runtime, nenhum pego por `tsc`/ESLint (só lógica, não tipo):**
   - Falta de `return` nos branches de erro do Controller — a última linha
     (`res.status(201).json(result)`) rodava sempre, causando resposta dupla
     (`ERR_HTTP_HEADERS_SENT`).
   - Router chamando `createUserController(req.body, res)` em vez de
     `createUserController(req, res)` — passava o corpo da requisição no
     lugar do objeto `req` inteiro.
   - Router sem `await` na chamada ao Controller e ainda fazendo
     `res.send(result)` depois — resposta dupla de novo, e `result` nem seria
     o dado certo (seria a Promise pendente, ou depois de corrigido o await,
     o próprio objeto `Response` retornado por `res.json()`).
   - Router sem exportar o `router` (faltava `export default router`).
3. **2ª rodada de revisão:** o `await` foi corrigido, mas o Router ainda fazia
   `res.send(result)` depois de o Controller já ter respondido — explicado que
   `res.json()` no Express retorna o próprio `res` (pra permitir encadeamento),
   não o dado, então o Router não deveria fazer nada com o retorno do
   Controller.
4. **Erro de parsing no ESLint/VSCode:** `Parsing error: No tsconfigRootDir was
   set, and multiple candidate TSConfigRootDirs are present`. Diagnóstico:
   - `tsconfig.json` não tinha `exclude`, então `tsc` compilava **todo** `.ts`
     na raiz do backend — incluindo o próprio `eslint.config.ts` e
     `prisma.config.ts` — gerando cópias deles dentro de `dist/`.
   - Isso criava dois arquivos `eslint.config.*` na árvore (fonte e cópia
     stale em `dist/`), e a auto-detecção de raiz do `typescript-eslint`
     encontrava ambos como candidatos.
   - Fix: `exclude: ["dist", "node_modules", "eslint.config.ts",
     "prisma.config.ts"]` no `tsconfig.json`, apagar e reconstruir `dist/`.
   - Efeito colateral: excluir esses dois arquivos do `tsconfig.json` fez o
     `projectService` do ESLint parar de reconhecê-los como parte do projeto —
     resolvido com `parserOptions.projectService.allowDefaultProject:
     ['eslint.config.ts', 'prisma.config.ts']`.
5. **Teste no Postman — erro 500 em `POST /user/create`.** Hipótese inicial de
   Carlos (campos faltando no body) não batia com o sintoma (`reason: 'error'`,
   mensagem do branch `if (!data)`, que só dispara com `data` totalmente
   vazio/undefined). Causa real: `app.ts` não tinha `express.json()`
   registrado, então `req.body` era sempre `undefined`, não importa o que o
   Postman mandasse. Fix: `app.use(express.json())` antes das rotas.
6. **Senha vazando em `GET /user/all`.** Hipótese inicial de Carlos (o
   `Promise`/array "escondendo" o tipo) também não era a causa. Causa real:
   `omit` do Prisma é por *query*, não global — `findAllUsers()` não tinha
   `omit: { password: true }` (diferente de `createUser`, que já tinha).
   Consequência de tipos: `Omit<UserModel[], 'password'>` na assinatura do
   Service não filtra nada (o `Omit` estava sendo aplicado no array inteiro,
   não no item) — corrigido para `Omit<UserModel, 'password'>[]`.
7. **Rotas de leitura implementadas por Carlos:** `findAllUsers`,
   `findUserById` no repository; `findAllUsersService`, `findUserByIdService`
   no service (usando `Logger` em vez de `console.log`); Controllers e rotas
   (`GET /user/all`, `GET /user/:id`) equivalentes.
8. **Testes via `curl`** (a pedido de Carlos, complementando o Postman):
   `GET /user/all` (200, sem senha), `POST /user/create` novo (201, sem
   senha), `POST /user/create` duplicado (409, conflict), `GET /user/:id`
   existente (200) e inexistente (400, `reason: 'conflict'`).
9. **Observação levantada pela IA:** usar `400`/`conflict` para "usuário não
   encontrado" é semanticamente estranho — o convencional é `404 Not Found`.
   Carlos decidiu granularizar o `reason` do `ServiceResult` com um valor
   `'not_found'`, mapeado para `404` no Controller (ação em andamento, não
   fechada nesta sessão).
10. **Vulnerabilidade de mass assignment identificada por Carlos:**
    `createUserService` espalhava `...data` (o `req.body` inteiro) no
    `createUser`, incluindo `role` — um cliente poderia mandar
    `"role": "ADMIN"` no `POST /user/create` e se auto-promover, já que
    `@default(USER)` no schema só vale quando o campo não é enviado.
    - Hipótese inicial de Carlos (`omit` na query) foi corrigida: `omit` só
      afeta o que a query **devolve**, não o que ela **grava** — não protege
      contra mass assignment.
    - Fix aplicado: montar o objeto do `createUser` explicitamente com
      `username`, `email`, `password` (whitelist), em vez de espalhar
      `...data`.
    - Ajuste de tipo decorrente: a assinatura de retorno chegou a ser trocada
      por engano para `Pick<UserModel, 'username' | 'email' | 'password'>`
      (que exige `password` no retorno) — corrigida de volta para
      `Omit<UserModel, 'password'>`, já que o retorno da função é o usuário
      criado (sem senha, graças ao `omit` do repository), não o payload de
      entrada usado para montá-lo.
11. **Discussão conceitual: controle de acesso por `role` (ADMIN) no
    futuro.** Carlos already intuiu a resposta certa: validação só no
    front-end é insuficiente, porque a API pode ser chamada diretamente
    (como a gente fez com `curl`/Postman a sessão inteira). Explicado o
    princípio de que autorização precisa vir de uma fonte verificada pelo
    próprio backend (token assinado, decodificado no servidor), nunca de um
    campo enviado pelo cliente na requisição.
12. **O que é middleware:** função que intercepta a requisição entre a
    chegada e o Controller (`(req, res, next) => {...}`), podendo inspecionar,
    barrar (sem chamar `next()`) ou deixar passar. `express.json()` (usado
    nesta mesma sessão) já é um exemplo de middleware. É um conceito de
    backend/framework de servidor — o "Middleware" do Next.js é uma coisa
    própria do front-end, que não substitui a proteção que precisa existir na
    API.

## Decisões e recomendações

- **Decisão de Carlos:** Router só chama o Controller (`await
  createUserController(req, res)`), sem tocar no valor de retorno — o
  Controller é o único responsável por escrever a resposta HTTP.
- **Decisão de Carlos:** `tsconfig.json` exclui arquivos de tooling
  (`eslint.config.ts`, `prisma.config.ts`) da compilação, com
  `allowDefaultProject` cobrindo o lint desses mesmos arquivos.
- **Decisão de Carlos:** granularizar `reason` do `ServiceResult` com
  `'not_found'`, mapeado para `404` (ação iniciada, não fechada nesta sessão).
- **Decisão de Carlos:** `createUser` monta o payload explicitamente
  (whitelist de `username`/`email`/`password`), nunca espalha `req.body`
  inteiro — mitigação de mass assignment.
- **Recomendação da IA (pendente):** revisitar a assinatura de entrada de
  `createUserService` (hoje `data: UserModel`, o model completo do Prisma)
  para um tipo mais restrito (ex. `Pick<UserModel, 'username' | 'email' |
  'password'>`), deixando explícito no contrato da função quais campos são
  esperados do cliente, em vez de depender de lembrar de filtrar à mão.
- **Recomendação da IA (pendente):** próximo passo arquitetural é o fluxo de
  login (emissão de token) + middleware de verificação, já previsto no
  ADR-0004 como follow-up de JWT.

## Aprendizados

- `res.json()`/`res.send()` no Express não interrompem a execução da função
  como um `return` faria em outras linguagens — sem `return` explícito, o
  código continua e pode tentar responder duas vezes, disparando
  `ERR_HTTP_HEADERS_SENT`.
- `res.json()` retorna o próprio objeto `Response` (para permitir
  encadeamento como `res.status(x).json(y)`), não o dado enviado — por isso
  capturar o retorno de uma função que já respondeu e tentar reenviá-lo
  (`res.send(result)`) é sempre incorreto.
- No flat config do ESLint, se `tsconfig.json` não tiver `exclude`, o `tsc`
  compila arquivos de tooling da raiz do projeto (como o próprio
  `eslint.config.ts`) para dentro de `dist/`, criando cópias divergentes que
  confundem a auto-detecção de raiz do `typescript-eslint`.
- Excluir um arquivo do `tsconfig.json` também o exclui do `projectService`
  do ESLint — arquivos de tooling que ficam de propósito fora do projeto TS
  principal precisam de `allowDefaultProject` para continuar sendo lintados.
- Sem `express.json()` registrado, `req.body` é sempre `undefined`,
  independente do que o cliente envie — é um middleware que precisa ser
  explicitamente adicionado, não vem habilitado por padrão.
- `omit` do Prisma é configurado por query, não é uma propriedade do model —
  cada chamada que expõe dado sensível precisa declarar seu próprio `omit`.
- `Omit<Array<T>, K>` não filtra as chaves dos itens de dentro do array; para
  remover uma chave de cada elemento, o `Omit` precisa ser aplicado no tipo
  do item (`Omit<T, K>[]`), não no array como um todo.
- **Mass assignment:** espalhar um objeto vindo do cliente (`...req.body`)
  direto num `create`/`update` do ORM permite que o cliente escreva campos que
  ele não deveria controlar (como `role`). A defesa é montar o payload
  explicitamente, campo a campo, nunca por spread do dado bruto de entrada.
- `omit` do Prisma protege a **saída** (o que a query devolve), não a
  **entrada** (o que é gravado) — não é defesa contra mass assignment.
- Autorização (o que um usuário pode fazer) precisa ser decidida a partir de
  uma fonte verificada pelo servidor (token assinado, sessão), nunca de um
  campo que o próprio cliente envia na requisição — validação só no
  front-end é contornável chamando a API diretamente.
- Middleware, no Express, é uma função `(req, res, next)` que fica entre a
  requisição chegar e o Controller rodar — pode inspecionar, bloquear (sem
  chamar `next()`) ou deixar passar. É conceito de backend; o "Middleware" do
  Next.js é outra coisa, que não substitui proteção na API.

## Links e materiais

- `res.json`/encadeamento de métodos no Express: [Express — Response methods](https://expressjs.com/en/api.html#res)
- Tratamento de erros e resposta única no Express: [Express — Error handling](https://expressjs.com/en/guide/error-handling.html)
- Roteamento com `express.Router()`: [Express — Routing guide](https://expressjs.com/en/guide/routing.html)
- `tsconfigRootDir` e `projectService`/`allowDefaultProject`: [typescript-eslint — Parser Configuration](https://typescript-eslint.io/packages/parser/#tsconfigrootdir) e [typescript-eslint — projectService](https://typescript-eslint.io/packages/typescript-estree/#projectservice)
- `express.json()`: [Express API reference — express.json()](https://expressjs.com/en/api.html#express.json)
- `omit` nativo do Prisma: [Prisma — Excluding fields](https://www.prisma.io/docs/orm/prisma-client/queries/excluding-fields)
- Utility type `Omit<Type, Keys>` (e por que não filtra arrays): [TypeScript Handbook — Utility Types (Omit)](https://www.typescriptlang.org/docs/handbook/utility-types.html#omittype-keys)
- Semântica de status HTTP (400 vs 404 vs 409): [MDN — HTTP response status codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)
- Mass assignment: [OWASP — Mass Assignment Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Mass_Assignment_Cheat_Sheet.html)
- Controle de acesso / autorização no backend: [OWASP Top 10 2021 — A01 Broken Access Control](https://owasp.org/Top10/A01_2021-Broken_Access_Control/)
- Middleware no Express: [Express — Writing middleware](https://expressjs.com/en/guide/writing-middleware.html)

## Próximos passos

- Fechar a granularização do `reason` (`'not_found'` → `404`) no
  `ServiceResult` e no Controller de `findUserByIdController`.
- Avaliar trocar a assinatura de entrada de `createUserService` para um tipo
  restrito (`Pick`) em vez de `UserModel` completo.
- Pesquisar e desenhar o fluxo de login + middleware de verificação de JWT
  (follow-up já registrado no ADR-0004).
- Levar a seção "Aprendizados" acima para o Obsidian (incluindo os
  aprendizados retroativos complementados nos 3 relatórios anteriores).

# Relatório de sessão — 2026-07-06

## Contexto

Segunda sessão do dia (a primeira foi `2026-07-06-validacao-de-entrada-com-zod.md`).
Com o CRUD do `User` fechado, Carlos partiu para a **autenticação (RF006)** — o
desbloqueador dos módulos Financeiro e To-do. Trouxe um plano em 4 passos (módulo
`auth` com service/controller/router; login com hash+compare; cookie com JWT; testes) e
pediu revisão didática antes de codar. A sessão evoluiu: revisão do plano → ADR-0006 →
implementação por Carlos → revisão e correção dos arquivos → commits.

## Tópicos abordados

1. **Revisão do plano de auth (antes de codar):**
   - 🔴 Erro conceitual no plano: "hashear a senha da req e comparar com o hash do
     banco" **não funciona** com bcrypt (salt aleatório embutido → hashes diferentes a
     cada execução). O certo é `bcrypt.compare(senhaTexto, hashDoBanco)`.
   - 🟠 "Login pelo ID": no login não se tem o `id`; identifica-se por credencial
     (e-mail/username) e o `id` só aparece **depois**, dentro do payload do JWT.
   - 🟠 Anti user-enumeration: "usuário não encontrado" e "senha errada" devem devolver
     a **mesma** resposta genérica `401`.
   - Estrutura: o backend é organizado **por camada** (`controllers/`, `services/`...),
     não por feature — "módulo auth" = `auth.{service,controller,route}.ts` nesse
     padrão, reusando `user.repository`.
   - Faltavam no plano: o **middleware de verificação** (o que de fato desbloqueia os
     outros módulos) e o **logout**.
2. **JWT — fundamentos discutidos:** stateless; payload mínimo (`id`, nunca senha);
   `JWT_SECRET` via env; token assinado ≠ criptografado (qualquer um lê o payload);
   duas expirações a manter em sincronia (`exp` do token × `maxAge` do cookie).
3. **Cookie httpOnly:** mais seguro que `localStorage` contra XSS; flags `httpOnly`,
   `secure`, `sameSite`. Necessidade do `cookie-parser` para ler `req.cookies` depois.
4. **Logout com JWT stateless:** = `res.clearCookie`; o token segue válido até `exp`
   (revogação imediata exigiria blocklist, fora do MVP).
5. **ADR-0006** registrando a estratégia de JWT (follow-up explícito que o ADR-0004
   havia adiado). Aceito por Carlos.
6. **Revisão da implementação (login) — bugs encontrados e corrigidos:**
   - `auth.route.ts`: cookie setado **depois** do `res.json` do controller (headers já
     enviados → crash) e lendo token de `req.body` (undefined). → router enxuto.
   - `auth.service.ts`: parâmetro `data: UserModel` (não compilava; devia ser
     `LoginUserInput`); `if (!foundUser)` logava mas **não retornava** → escorregava
     para `500` e vazava enumeration → passou a retornar `401` genérico.
   - `exactOptionalPropertyTypes`: `LoginUserInput` (com `| undefined`) vs
     `Partial<Pick>` do repo → resolvido com **spread condicional** (mesmo padrão já
     usado no `updateUserService`).
   - `auth.controller.ts`: cookie movido para cá (decisão do ADR); `400` (não `401`) no
     erro de validação Zod; corpo de resposta sem o token (só `message`).
   - Nome do campo de sucesso alinhado nos três arquivos (`data`, escolha de Carlos no
     `result.type.ts`).
   - Resultado: `npx tsc --noEmit` verde.

## Decisões e recomendações

- **Decisão de Carlos (ADR-0006, Aceito):** JWT stateless em cookie httpOnly; login por
  e-mail **ou** username + `bcrypt.compare`; falha genérica `401`; `JWT_SECRET` e
  expiração via env (24h prod / 5min teste); logout via `clearCookie`; middleware de
  verificação injeta `userId`.
- **Decisão de Carlos:** campo de sucesso do `LoginServiceResult` chamado `data`
  (sugestão da IA de renomear para `token`, por clareza, ficou a critério dele).
- **Recomendação da IA (pendente, validar por Carlos):**
  - Remover a dependência **`cookies-parser`** (pacote errado, provável typo) —
    manter só `cookie-parser`.
  - `secure: true` em produção e `maxAge`/`expiresIn` vindos de env (hoje hardcoded).
  - Validar presença de `JWT_SECRET` no boot (o `as string` esconde a falta em
    runtime).

## Aprendizados

- **bcrypt usa salt embutido** → hashear a mesma senha duas vezes dá resultados
  diferentes; por isso **nunca** se re-hasheia para comparar — usa-se `bcrypt.compare`,
  que lê o salt de dentro do hash armazenado.
- **Login identifica por credencial, não por ID.** O `id` entra só no fim, no payload
  do JWT. Buscar por e-mail/username → comparar senha → assinar token.
- **Resposta genérica de login (anti user-enumeration):** mesmo `401` e mesma mensagem
  para "não existe" e "senha errada"; a distinção fica só no log interno.
- **JWT é stateless e assinado (não criptografado):** payload é legível por qualquer
  um; nunca colocar dado sensível. Logout = limpar o cookie; o token só morre de fato
  no `exp` (sem blocklist).
- **httpOnly protege o token de XSS** (JS do browser não lê o cookie) — melhor que
  `localStorage`.
- **`exactOptionalPropertyTypes` de novo:** tipo vindo do Zod com `| undefined` não
  encaixa em `Partial<Pick<...>>`; a saída é montar o objeto com **spread condicional**
  (chave ausente, não `undefined`) — padrão que já existia no `updateUserService`.
- **Router magro:** a rota só encaminha para o controller; setar cookie/enviar resposta
  é responsabilidade do controller. Chamar `res.cookie` depois de `res.json` estoura
  `ERR_HTTP_HEADERS_SENT`.

## Links e materiais

- bcrypt e o `compare`: [bcrypt (npm) — To check a password](https://www.npmjs.com/package/bcrypt#to-check-a-password)
- Salt e hashing de senha: [Auth0 — Hashing in Action: Understanding bcrypt](https://auth0.com/blog/hashing-in-action-understanding-bcrypt/)
- Mensagens de erro de autenticação (enumeration): [OWASP — Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html#authentication-and-error-messages)
- Anatomia do JWT: [jwt.io — Introduction to JSON Web Tokens](https://jwt.io/introduction)
- Assinar/verificar token: [jsonwebtoken (npm) — sign / verify](https://github.com/auth0/node-jsonwebtoken#usage)
- Login Express + JWT (prática): [LogRocket — JWT authentication best practices in Node.js](https://blog.logrocket.com/jwt-authentication-best-practices/)
- Cookie e flags de segurança: [Express — res.cookie()](https://expressjs.com/en/api.html#res.cookie) · [MDN — Set-Cookie](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie)
- Ler cookies no Express: [cookie-parser (npm)](https://www.npmjs.com/package/cookie-parser)
- `exactOptionalPropertyTypes`: [TS tsconfig — exactOptionalPropertyTypes](https://www.typescriptlang.org/tsconfig/#exactOptionalPropertyTypes)

## Pendências para fechar 100% o RF006 (autenticação)

Ordem sugerida:

1. **Middleware de verificação de JWT** — lê o cookie `SESSIONID` → `jwt.verify` →
   injeta `req.userId` → `next()`; token ausente/inválido responde `401`. **Requer
   ligar o `cookie-parser` no `app.ts`** (senão `req.cookies` fica `undefined`).
   É o item que **desbloqueia** Financeiro (RF002) e To-do (RF001).
2. **Endpoint de logout** — `POST /auth/logout` que faz `res.clearCookie('SESSIONID')`.
3. **Higiene de dependências** — remover `cookies-parser` (typo), manter `cookie-parser`.
4. **Config por env** — `JWT_SECRET` (confirmar no `.env`, já ignorado no git),
   `expiresIn` e `maxAge` vindos de env (24h prod / 5min teste); validar presença de
   `JWT_SECRET` no boot.
5. **`secure: true`** no cookie em produção (HTTPS).
6. **Testes unitários do módulo `auth`** — senha curta (schema), usuário não
   encontrado (`401`), mapeamento da req; mockar o `user.repository`.
7. **Teste de runtime (curl)** com Postgres no ar — login ok (`200` + `Set-Cookie`),
   credencial errada (`401` genérico), body inválido (`400`), rota protegida com/sem
   cookie.
8. **Proteger as rotas existentes** com o middleware conforme os módulos consumidores
   forem entrando (as rotas de `User` seguem abertas).

## Próximos passos

- Implementar o **middleware de verificação** (item 1 acima) e o **logout**.
- Limpar a dependência `cookies-parser`.
- Escrever os **testes unitários** do `auth`.
- Subir o Postgres e rodar os **testes de runtime** do login.
- Levar a seção "Aprendizados" para o **Obsidian**.

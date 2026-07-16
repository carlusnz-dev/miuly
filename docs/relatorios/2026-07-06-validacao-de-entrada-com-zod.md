# Validacao de entrada com zod
--- Cabeçalho ---
Autor: Claude Code
Data: 2026-07-06
Módulos: Backend
Atividade: Validacao de entrada com zod

# Corpo

## Contexto

Continuação direta da sessão de `2026-07-05-controller-router-auth-e-seguranca.md`.
Com o CRUD do módulo `User` completo (create, findAll, findById, update, delete),
Carlos pediu uma **revisão dos commits de Update e Delete** e uma avaliação de se já
podia avançar para os outros RFs. A revisão apontou bugs de lógica/contrato (que o
`tsc`/ESLint não pegam) e, a partir de um deles, a sessão evoluiu para a **introdução
de validação de entrada com Zod** no módulo User, seguida de ADR, commits e testes de
runtime via `curl`.

## Tópicos abordados

1. **Revisão de Update/Delete do `User` — achados principais:**
   - 🔴 **Self-conflict no update:** `updateUserService` chamava
     `findUserByEmailOrUsername(data)` sem excluir o próprio usuário — ao atualizar
     mantendo o mesmo e-mail, a query encontrava o próprio registro e bloqueava com
     `conflict`. Na prática o update só passava trocando e-mail *e* username por
     valores inéditos.
   - `updateUserController` não mapeia `reason: 'conflict'` → cai no `else` e responde
     `500` em vez de `409`.
   - `catch` do `updateUserService` loga mas não retorna (funciona por acidente,
     escorregando para o `return` de erro no fim).
   - Menores: branch morto `conflict → 401` no `deleteUserController`; `Number(id)`
     sem validar `NaN`; `console.log` vs `Logger` no create; `if (data)` redundante.
2. **Diagnóstico de "posso avançar para os outros RFs?":** não ainda — falta a base de
   **autenticação (RF006)**. As rotas de `User` estão abertas e os próximos módulos
   (Financeiro/To-do) precisam de *ownership* (`userId`) vindo de token verificado,
   não do body.
3. **Correção do self-conflict:** parâmetro opcional `excludeId?: number` em
   `findUserByEmailOrUsername`, com `NOT: { id: excludeId }` incluído condicionalmente
   via spread — necessário por causa de `exactOptionalPropertyTypes: true` no
   `tsconfig` (não aceita `NOT: undefined`).
4. **Conceito: Zod, tipo vs. validação.** Tipo do TS/Prisma existe só em compilação e
   some em runtime; não valida `req.body` (que é `any`) nem aplica regra de negócio.
   Zod valida em runtime **e** infere o tipo (`z.infer`) a partir do mesmo schema.
5. **Aplicação do Zod no módulo User:** schemas `createUserSchema`/`updateUserSchema`
   em `types/user.type.ts`, validação com `.safeParse()` na camada de controller,
   `400` no erro, e services passando a receber os tipos inferidos em vez de
   `UserModel`.
6. **Estreitamento de tipos nos repositories:** `Pick<...>` (só os campos usados) em
   `createUser` e `findUserByEmailOrUsername` — o compilador expôs que a função pedia
   `UserModel` inteiro sendo que usava só `email`/`username` (princípio ISP aplicado a
   parâmetro).
7. **Update parcial (`.partial()`):** sequência de erros didática até acertar —
   (a) reconstruir o objeto à mão sob `exactOptionalPropertyTypes` gera erro de
   `undefined` → passar `parsed.data` direto; (b) `OR` do repo montado dinamicamente
   só com os campos presentes, senão um `{}` dentro do `OR` casa todas as linhas;
   (c) `.partial()` precisa ficar na **definição** do schema (fonte única), não inline
   no controller — senão o dado (runtime) e o tipo (`z.infer`) divergem.
8. **ADR-0005** (status Proposto) registrando a decisão de validar entrada com Zod na
   camada de controller.
9. **Commits** separados: `fix(user)` (código + dependência Zod) e `docs(adr)` (ADR),
   mantendo a disciplina de Conventional Commits (não misturar `fix` com `docs`).
10. **Testes de runtime via `curl`:** os 5 testes de validação (`400`) passaram,
    provando a camada Zod ponta a ponta. Os testes de caminho feliz (201/200/409)
    ficaram **pendentes** porque o Postgres local não estava no ar
    (`Can't reach database server at 127.0.0.1:5432`) e o Docker exigia permissão.

## Decisões e recomendações

- **Decisão de Carlos:** validar entrada com **Zod na camada de controller**, schema
  como fonte única de validação + tipo (registrado no ADR-0005, status Proposto).
- **Decisão de Carlos:** `.partial()` mora na definição do schema; controller usa
  `safeParse` simples; service recebe tipo inferido; repo usa `Pick`/`Partial`.
- **Decisão de Carlos:** commits separados `fix(user)` e `docs(adr)`.
- **Melhoria local não commitada (feita por Carlos):** separar `error:
  parsed.error.message` do `message` genérico na resposta `400` — resolve o follow-up
  de não vazar o `ZodError` cru na mensagem. Falta commitar.
- **Recomendação da IA (pendente, validar com Carlos):** mapear `conflict → 409` no
  `updateUserController`; decidir tratamento de body vazio no update parcial
  (`.refine()` "pelo menos um campo"); avaliar middleware `validate(schema)`
  reaproveitável no futuro.

## Aprendizados

- **Tipo ≠ validação.** Tipo do TypeScript/Prisma vale em compilação e some em runtime;
  não protege `req.body` (que é `any`) nem carrega regra de negócio. Validação de borda
  é runtime (`safeParse`), não tipo. `tsc` verde não significa "entrada validada".
- **Fonte única da verdade com `z.infer`.** Um schema Zod gera validação (runtime) e
  tipo (compilação). Transformar o schema (`.partial()`, `.pick()`) **no ponto de uso**
  faz o dado e o tipo divergirem em silêncio — transformações moram na **definição**.
- **`exactOptionalPropertyTypes: true`** distingue "chave ausente" de "chave presente
  valendo `undefined`". Por isso `NOT: undefined` e objetos reconstruídos à mão com
  campos opcionais dão erro; a saída é incluir a chave condicionalmente (spread) ou
  passar o objeto validado direto, deixando chaves não-enviadas *ausentes*.
- **Peça o mínimo no parâmetro (ISP).** Uma função deve tipar só os campos que usa
  (`Pick<UserModel, 'email' | 'username'>`), não o tipo mais gordo à mão. Pedir demais
  acopla a função a coisas que ela ignora.
- **`z.object` descarta campos não declarados por padrão** — mass assignment morre na
  validação, sem precisar de whitelist manual.
- **Query Prisma com `OR` e campo `undefined`:** o Prisma descarta condições
  `undefined`; um `{}` resultante dentro de um `OR` casa **todas** as linhas. Ao tornar
  a entrada parcial, a query de duplicidade precisa montar o `OR` só com os campos
  presentes.
- **Verificação de runtime ≠ compilação.** A camada Zod roda antes do banco, então os
  testes de `400` são verificáveis mesmo com o Postgres fora do ar — mas os caminhos
  felizes (201/200/409) exigem o banco.

## Links e materiais

- Zod — uso básico e `safeParse`: [Zod — Basic usage](https://zod.dev/?id=basic-usage)
- Zod — inferência de tipo: [Zod — Type inference](https://zod.dev/?id=type-inference)
- Zod — `.partial()`: [Zod — `.partial()`](https://zod.dev/api?id=partial)
- Zod — `.refine()` (validação "pelo menos um campo"): [Zod — refine](https://zod.dev/api?id=refine)
- Zod — formatação de erro: [Zod — Error formatting](https://zod.dev/error-formatting)
- `exactOptionalPropertyTypes`: [TS tsconfig — exactOptionalPropertyTypes](https://www.typescriptlang.org/tsconfig/#exactOptionalPropertyTypes)
- Utility type `Pick`: [TS Handbook — Utility Types (Pick)](https://www.typescriptlang.org/docs/handbook/utility-types.html#picktype-keys)
- Prisma — filtros e operador `NOT`: [Prisma — Filter conditions and operators](https://www.prisma.io/docs/orm/reference/prisma-client-reference#not)
- Mass assignment: [OWASP — Mass Assignment Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Mass_Assignment_Cheat_Sheet.html)
- Validação de entrada: [OWASP — Input Validation Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)
- Semântica PUT vs PATCH: [MDN — HTTP PATCH](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/PATCH)

## Próximos passos

- **Subir o Postgres e completar os testes de `curl`** de caminho feliz (ver comandos
  no fim desta seção): `POST /user/create` (201, sem senha), duplicado (409),
  mass assignment com `role: ADMIN` (deve ser descartado), `PUT /user/update/:id`
  parcial só com `username` (200), `DELETE /user/delete/:id` (200/404).
- **Commitar a melhoria local** do campo `error` na resposta `400` do controller.
- **Fechar as pontas soltas do `User`:** mapear `conflict → 409` no update; decidir
  body vazio no update parcial (`.refine()`); `return` explícito no `catch`; remover
  branch morto `conflict → 401` do delete; validar `NaN` no `Number(id)` (→ `400`);
  padronizar `console.log` → `Logger`; limpar `if (data)` redundante.
- **Escrever testes unitários** do módulo `User` (agora com Zod: "update só com
  username passa", "body com `role` é descartado").
- **RF006 (autenticação):** desenhar login (emissão de JWT) + middleware de
  verificação — desbloqueador dos módulos Financeiro (RF002) e To-do (RF001).
- **Levar a seção "Aprendizados" para o Obsidian.**

### Comandos para subir o banco e testar (rodar por Carlos)

```bash
# subir só o Postgres do docker-compose (precisa de permissão de Docker)
sudo docker compose up -d db      # ou: docker compose up -d db, se estiver no grupo docker

# aplicar as migrations do Prisma
cd backend && npx prisma migrate dev

# com o servidor (npm run dev) no ar, os testes de caminho feliz:
curl -i -X POST http://localhost:8000/user/create -H 'Content-Type: application/json' \
  -d '{"username":"carlos","email":"carlos@ex.com","password":"12345678"}'          # 201, sem senha
curl -i -X POST http://localhost:8000/user/create -H 'Content-Type: application/json' \
  -d '{"username":"carlos","email":"carlos@ex.com","password":"12345678"}'          # 409 (duplicado)
curl -i -X POST http://localhost:8000/user/create -H 'Content-Type: application/json' \
  -d '{"username":"hacker","email":"h@ex.com","password":"12345678","role":"ADMIN"}' # role deve ser descartado
curl -i -X PUT http://localhost:8000/user/update/1 -H 'Content-Type: application/json' \
  -d '{"username":"carlos_novo"}'                                                    # 200 (parcial)
curl -i -X DELETE http://localhost:8000/user/delete/1                               # 200 / 404
```

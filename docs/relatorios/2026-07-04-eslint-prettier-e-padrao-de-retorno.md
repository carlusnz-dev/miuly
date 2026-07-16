# Eslint prettier e padrao de retorno
--- Cabeçalho ---
Autor: Claude Code
Data: 2026-07-04
Módulos: Backend
Atividade: Eslint prettier e padrao de retorno

# Corpo

## Contexto

Continuação direta da sessão registrada em `2026-07-04-auth-repository-service.md`.
Carlos pediu para, antes de seguir corrigindo os achados pendentes do módulo de
Auth, resolver um chore: a configuração de ESLint e Prettier do backend não
estava formatando o código, apesar de ele já ter instalado as dependências
seguindo um tutorial (que ele suspeitava estar desatualizado). Depois de
resolver o chore, a sessão voltou para fechar as pendências do
`user.repository.ts` e `user.service.ts` deixadas em aberto no relatório
anterior.

## Tópicos abordados

1. **Investigação da config de ESLint/Prettier** — disparado um subagente
   `backend-explorer` (somente leitura) para mapear `eslint.config.ts`,
   `.prettierrc`, `package.json` e o caminho gerado pelo Prisma
   (`src/generated/prisma`, via `schema.prisma`). Achado inicial: as configs
   existiam e eram sintaticamente válidas, mas não havia scripts `lint`/`format`
   no `package.json`, e as libs `eslint-config-prettier`/`eslint-plugin-prettier`
   estavam instaladas sem uso.
2. **Correções aplicadas por Carlos, uma a uma, cada uma verificada rodando o
   ESLint/Prettier de verdade (não só lendo o código):**
   - `extends: ['js/recommended', 'prettier']` quebrava o ESLint inteiro
     (`TypeError: Plugin "" not found`) — sintaxe do formato antigo
     (`.eslintrc`), inválida no flat config. Corrigido removendo o item
     `'prettier'` do array (o `eslintConfigPrettier` importado já estava
     corretamente adicionado como item solto no array).
   - `ignores: ["./src/generated/*"]` estava dentro do mesmo bloco que tinha
     `files`, então só valia pra aquele bloco — confirmado rodando uma versão
     de teste da config, que apontou 646 problemas de lint vindos do client
     gerado do Prisma. Corrigido movendo `ignores` para um objeto de config
     global, sem `files` ao lado.
   - Mesmo corrigido, sobrou lint em `dist/src/generated/prisma/` (cópia do
     client do Prisma dentro da pasta de build). Corrigido adicionando
     `dist/**` ao mesmo `ignores` global.
   - `rules: { indent: 'error' }` era anulado silenciosamente pelo
     `eslintConfigPrettier` (posicionado depois no array, que desliga regras de
     formatação pra todos os arquivos) — removido por ser código morto.
   - `.prettierrc` tinha `"plugins": ["eslint-config-prettier"]`, que não é um
     plugin de Prettier (é um pacote de config do ESLint) — removido.
3. **VSCode não formatava ao salvar** — causa raiz: `editor.defaultFormatter`
   apontava pra `rvest.vs-code-prettier-eslint`, uma extensão de terceiro que
   provavelmente não suporta flat config do ESLint. Recomendado trocar para as
   extensões oficiais (`esbenp.prettier-vscode` + `dbaeumer.vscode-eslint`) com
   `editor.codeActionsOnSave: { "source.fixAll.eslint": "explicit" }`.
4. **Script `lint` do `package.json`** — Carlos unificou em
   `"eslint . --fix && prettier --write ."`, mas o `&&` significava que o
   Prettier só rodava se o ESLint saísse com sucesso (confirmado testando o
   exit code do ESLint com erros pendentes = 1). Trocado para `;` a pedido de
   Carlos, pra Prettier rodar independente do resultado do ESLint.
5. **Retomada das pendências do Auth (do relatório anterior):**
   - Sanitização da senha no retorno: ensinadas duas opções (destructuring
     manual vs. `omit` nativo do Prisma). Carlos optou pelo `omit` do Prisma,
     aplicado por query em `createUser` (`user.repository.ts`).
   - Correção AND→OR em `findUserByEmailOrUsername`: primeira tentativa de
     Carlos (`where: [{...}, {...}]`) gerou erro de tipo (`where` não aceita
     array direto); corrigido para `where: { OR: [...] }`.
   - `bcrypt.hashSync` → `bcrypt.hash` (assíncrono) — aplicado por Carlos.
   - Padrão de retorno único: discutidas as duas abordagens que ficaram em
     aberto no relatório anterior (união discriminada vs. classes de erro
     customizadas). Carlos escolheu a união discriminada
     (`ServiceResult<T>`), explicitamente para treinar tipagem forte do
     TypeScript. Explicado o conceito de generics (`<T>`) do zero.
   - Carlos criou `src/types/result.type.ts` com o tipo `ServiceResult<T>` e
     atualizou `createUserService` pra usá-lo. Rodando `tsc --noEmit`, dois
     erros reais de tipo apareceram: (1) um caminho da função (`data` falsy)
     não retornava nada, incompatível com `ServiceResult<T>`; (2) o retorno de
     `createUser` (já sem `password`, por causa do `omit`) não batia com
     `ServiceResult<UserModel>` (que exige `password`). Corrigido ajustando a
     assinatura para `ServiceResult<Omit<UserModel, 'password'>>` e adicionando
     o `return` que faltava. `tsc --noEmit` voltou limpo depois.
6. Revisão final apontou dois detalhes pequenos de texto, ainda não
   confirmados como corrigidos: typo "usuários" → "usuário" na mensagem de
   conflito, e uma mensagem de erro (`typeof data`) que expõe detalhe técnico
   de debug numa resposta que seria vista pelo consumidor da API.

## Decisões e recomendações

- **Decisão de Carlos:** sanitizar a senha usando o parâmetro `omit` nativo do
  Prisma na query de criação, em vez de destructuring manual no service.
- **Decisão de Carlos:** usar união discriminada (`ServiceResult<T>`) como
  padrão de retorno do Service, não classes de erro customizadas — escolha
  feita para praticar tipagem forte.
- **Decisão de Carlos:** script `lint` do backend usa `;` entre `eslint --fix`
  e `prettier --write`, não `&&`.
- **Recomendação da IA (pendente de validação):** trocar
  `editor.defaultFormatter` do VSCode para `esbenp.prettier-vscode` e usar
  `dbaeumer.vscode-eslint` só para lint/fix via `codeActionsOnSave`.
- **Recomendação da IA (pendente):** corrigir o typo "usuários"→"usuário" e
  trocar a mensagem de erro com `typeof data` por um texto mais genérico
  voltado à API.
- **Ponto em aberto:** avaliar se vale granularizar o campo `reason` do
  `ServiceResult` (hoje `'conflict' | 'error'`) com um valor a mais (ex.
  `'invalid'`) para diferenciar erro de validação de erro de banco/infra —
  Carlos ainda não decidiu.

## Aprendizados

- No flat config do ESLint (`eslint.config.ts`, ESLint ≥9), `extends` só
  aceita strings no formato `"plugin/configName"` referenciando algo
  registrado em `plugins` — o padrão antigo `extends: ["prettier"]` do
  eslintrc legado não existe mais; o jeito certo é importar o config
  (`eslint-config-prettier/flat`) e colocá-lo como item solto no array.
- Em flat config, `ignores` dentro do mesmo objeto que tem `files` só vale
  para aquele bloco específico — para um ignore global, precisa ser um
  objeto próprio no array, sem `files` ao lado.
- Pastas de build (`dist/`) podem conter cópias de código gerado (ex. client
  do Prisma) que precisam de um ignore próprio, separado da pasta fonte
  (`src/generated/`).
- Extensões de terceiro que tentam unir ESLint+Prettier num só (ex.
  `vs-code-prettier-eslint`) podem ficar defasadas na adoção do flat config;
  as extensões oficiais mantidas pelos próprios times de Prettier/Microsoft
  são a aposta mais segura.
- `&&` entre comandos só executa o segundo se o primeiro sair com código 0 —
  encadear `eslint --fix && prettier --write` faz a formatação ficar refém de
  o lint estar 100% limpo.
- O Prisma tem um parâmetro nativo `omit` (desde a versão 5.16) para excluir
  campos sensíveis diretamente na query, ajustando também o tipo TypeScript
  inferido do retorno — mais robusto que destructuring manual porque não
  depende de repetir a lógica em cada função que toca o model.
- No Prisma, `where` é sempre um objeto (`XWhereInput`); `OR`/`AND`/`NOT` são
  chaves especiais dentro dele cujo valor é um array — não é possível
  atribuir um array diretamente ao `where`.
- TypeScript generics (`<T>`) são parâmetros de **tipo**, resolvidos em tempo
  de compilação e apagados no JavaScript final — permitem escrever uma forma
  (como `ServiceResult<T>`) uma única vez e reaproveitar para qualquer
  entidade do projeto.
- O utility type nativo `Omit<Type, Keys>` do TypeScript descreve "o tipo X
  sem estas chaves" — útil para declarar a assinatura de uma função cujo
  retorno já teve campos removidos via `omit` do Prisma.
- Um retorno tipado como união discriminada (`{ ok: true, data } | { ok:
  false, ... }`) faz o próprio compilador travar builds que não retornam em
  todos os caminhos possíveis — foi o que pegou o caminho de `data` falsy sem
  `return` nesta sessão. Esse é o ganho concreto de trocar `undefined`/`null`/
  string solta por um contrato de tipo único.

## Links e materiais

- Sintaxe de `extends` no flat config do ESLint: [ESLint — Configuration Migration Guide](https://eslint.org/docs/latest/use/configure/migration-guide)
- Escopo de `ignores` no flat config: [ESLint — Ignoring files](https://eslint.org/docs/latest/use/configure/ignore)
- Extensões oficiais de formatação/lint no VSCode: [Prettier — VS Code extension](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) e [ESLint — VS Code extension](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
- `&&` vs `;` no encadeamento de comandos shell: [GNU Bash Manual — Lists of Commands](https://www.gnu.org/software/bash/manual/html_node/Lists.html)
- `omit` nativo do Prisma para excluir campos sensíveis: [Prisma — Excluding fields](https://www.prisma.io/docs/orm/prisma-client/queries/excluding-fields)
- `where` com `OR`/`AND`/`NOT` no Prisma: [Prisma — Filtering and sorting (combining operators)](https://www.prisma.io/docs/orm/prisma-client/queries/filtering-and-sorting#filter-on-and-or-not-conditions)
- Generics (`<T>`) em TypeScript: [TypeScript Handbook — Generics](https://www.typescriptlang.org/docs/handbook/2/generics.html)
- Utility type `Omit<Type, Keys>`: [TypeScript Handbook — Utility Types (Omit)](https://www.typescriptlang.org/docs/handbook/utility-types.html#omittype-keys)
- União discriminada travando build por caminho sem `return`: [TypeScript Handbook — Discriminated unions](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions)

## Próximos passos

- Corrigir o typo "usuários" → "usuário" na mensagem de conflito do
  `user.service.ts`.
- Trocar a mensagem de erro que expõe `typeof data` por um texto mais
  genérico voltado à API.
- Seguir para o Controller e Router do módulo de Auth.
- Atualizar o ADR-0004 com a decisão final do padrão de retorno
  (`ServiceResult<T>` com flag discriminada).
- Decidir se o campo `reason` do `ServiceResult` precisa de mais granularidade
  (ex. `'invalid'` além de `'conflict'`/`'error'`).
- Levar a seção "Aprendizados" acima para o Obsidian.

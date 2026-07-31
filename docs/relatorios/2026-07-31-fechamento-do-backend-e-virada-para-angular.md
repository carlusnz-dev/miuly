# Relatório de sessão — 2026-07-31 — Fechamento do backend e virada para o Angular

--- Cabeçalho ---
Autor: Carlos e Claude
Data: 2026-07-31
Módulos: Backend (Finances, Task, Types, Auth), Documentação, ADRs, Front-end
Atividade: Revisão e commit do trabalho pendente, CRUD de Task e Types, correção de IDOR em Finances, ADR-0009 (Angular) e ADR-0010 (PrimeNG), atualização dos docs principais, CORS e revisão do cookie de sessão

# Corpo

## Contexto

Carlos abriu a sessão achando que os módulos do backend estavam concluídos e querendo
partir para o front-end. A revisão do código mostrou que **não estavam**: RF001 (Task) e
RF008 (Calendar) não tinham uma linha sequer, e Finances tinha um IDOR aberto. A sessão
virou, na prática, o fechamento do backend do MVP e a preparação do terreno para o
Angular.

## Tópicos abordados

1. **Revisão do diff pendente** (Finances, rotas de auth e user) e da realidade do
   projeto contra a matriz de rastreabilidade.
2. **ADR-0009** — troca do front-end de Next.js/React para Angular.
3. **Commits do trabalho pendente**, quebrados por assunto.
4. **CRUD de Task (RF001)** em todas as camadas.
5. **Testes unitários** dos services de task, finances, bank e types.
6. **Correções em Finances**: IDOR de `bank_id`, vazamento de `user_id`, `try/catch`
   incompleto no delete, status HTTP e validação de `params`.
7. **Atualização dos docs principais**: matriz de rastreabilidade, `CLAUDE.md`, `README.md`.
8. **CRUD de Types** completo e correção do `frontend-explorer` para Angular.
9. **ADR-0010** — PrimeNG como biblioteca de UI.
10. **Aula de Angular** para quem vem de React/Next.
11. **Revisão do CORS** e do cookie de sessão do `loginController`.

## Decisões e recomendações

### Decisões do Carlos

- **Front-end migra para Angular** (ADR-0009, Proposto). Motivo: framework opinativo e
  alinhado à stack que ele usa no estágio, somando aprendizado dos dois lados. Custo de
  troca praticamente zero porque o front só tinha scaffold. Framer Motion saiu junto.
- **PrimeNG como biblioteca de UI** (ADR-0010, Proposto). Critério decisivo: velocidade
  de entrega, com o MVP já atrasado.
- **Delegou a escrita do CRUD de Task e dos testes** — exceção explícita à regra padrão
  de "ensinar e revisar", pedida por ele para acelerar o fechamento do backend.
- Manteve a decisão de responder `not_found` (e não `unauthorized`) quando o recurso é
  de outro usuário, para não confirmar sua existência.

### Recomendações da IA (a validar por Carlos)

- **Cortar RF008 (Google Calendar) do MVP.** É o item mais caro que resta (OAuth +
  scopes + integração externa) e o único módulo do escopo original ainda em zero.
- **Centralizar configuração por ambiente** antes de seguir para o front: `JWT_SECRET`,
  origin do CORS e opções do cookie já são três configs que precisam variar entre dev e
  produção. Candidato a ADR.
- **Extrair as opções do cookie para uma constante única**, usada no `res.cookie` e no
  `res.clearCookie` — hoje elas são repetidas e vão divergir.
- **Alinhar `Task.id` (`BigInt`) com o resto dos models (`Int`)** — decisão de schema,
  pendente.
- Ordem sugerida para o front: config de ambiente → PrimeNG + Tailwind → AuthService e
  login → guard e layout → lista de finanças → formulário de finança.

## O que foi feito (12 commits)

| Commit | Conteúdo |
|---|---|
| `0311ba1` | `authMiddleware` na rota de logout |
| `aa2fdc7` | `POST /user` público, para permitir registro |
| `ffb0dab` | Finances: update e delete com validação de tipo, banco e `try/catch` |
| `6fd9db6` | ADR-0009 (Angular) |
| `06ef49b` | CRUD de Task (RF001) nas quatro camadas |
| `4635443` | Testes dos services de task, finances, bank e types |
| `1a5aace` | Finances: IDOR de `bank_id` e vazamento de `user_id` |
| `65a79c7` | Testes das correções de Finances |
| `0a90fec` | Matriz de rastreabilidade, `CLAUDE.md` e `README.md` |
| `c8efeeb` | CRUD de Types completo (list, update, delete) |
| `d0a0b31` | `frontend-explorer` atualizado para Angular |
| `a06d727` | ADR-0010 (PrimeNG) |

Estado final do backend: `tsc --noEmit` limpo, `eslint` limpo, **85 testes passando +
1 `it.todo`**. Todos os módulos do caminho crítico validados por `curl` contra o
servidor rodando, incluindo cenários de acesso cruzado entre dois usuários.

## Bugs encontrados e corrigidos

1. **IDOR de `bank_id` em Finances** — `findBankById` não filtra por dono e o service não
   conferia `foundBank.user_id`. Usuário A conseguia vincular uma finança ao banco do
   usuário B. Violava o RNF007.
2. **Vazamento de `user_id` no `GET /finances`** — o service *declarava*
   `Omit<FinancesModel, 'user_id'>` e o `tsc` passava, mas a query devolvia a coluna.
   Descoberto por `curl`, não pelo compilador.
3. **`deleteFinanceService` com buscas fora do `try/catch`** — falha do banco viraria
   `unhandledRejection` e derrubaria o processo, o mesmo bug diagnosticado em 25/07.
4. **`createTypeController` não respondia** quando o Zod falhava: fazia `return` de um
   objeto solto sem nunca chamar `res`. A requisição ficava pendurada até o timeout do
   cliente — nem 400, nem 500, silêncio.
5. **CORS sem esquema no origin** — `origin: ['localhost:4200']` nunca casaria, porque o
   header `Origin` do browser é sempre `esquema://host:porta`.
6. **CORS sem `credentials: true`** — o cookie de sessão seria descartado pelo browser, e
   o sintoma seria 401 em toda rota autenticada.

Os dois últimos foram corrigidos por Carlos durante a sessão e verificados por `curl`.

## Correção de um erro meu

Na primeira revisão apontei o spread condicional (`...(data.name !== undefined && {...})`)
como redundante. **Estava errado.** O `tsconfig` tem `exactOptionalPropertyTypes: true`,
que trata `campo?: T` e `campo?: T | undefined` como tipos diferentes; o `z.infer` de um
`.partial()` produz o segundo e o Prisma espera o primeiro. Passar `data` direto é
rejeitado pelo compilador (TS2379). O padrão do Carlos estava certo.

Também removi da matriz de rastreabilidade o apontamento de que `z.email()` seria
inválido: é a API de formatos do Zod 4, funciona, e foi verificado por `curl`.

## Aprendizados

- **`Pick`/`Omit` não recortam dados em runtime, só anotam.** Quem recorta é o `omit` do
  Prisma ou o destructuring. Dá para ter o tipo certo e o dado errado com o `tsc` feliz.
- **`exactOptionalPropertyTypes`** faz `campo?: T` e `campo?: T | undefined` serem tipos
  distintos — é a razão do spread condicional nos updates.
- **`BigInt` não sobrevive ao `JSON.stringify`** (`res.json()` lança). Por isso o `id` de
  Task é convertido com `Number()` no service.
- **Um `return` sem `res` num controller do Express é pior que um erro:** vira timeout
  silencioso. Controller sempre termina em `res.`.
- **Códigos de erro do Prisma são contrato:** `P2002` (unicidade) e `P2003` (chave
  estrangeira) permitem traduzir erro de banco em status HTTP honesto (409) em vez de 500.
- **Checagem de aplicação e constraint de banco não são redundantes:** uma existe pela
  mensagem, a outra pela integridade, e a janela entre as duas é uma condição de corrida
  real.
- **CORS não é uma coisa, são duas:** liberação de origem e liberação de credenciais,
  controladas por headers diferentes. Faltando a segunda, o sintoma é 401 em toda rota
  autenticada — que não se parece nada com a causa.
- **`SameSite` fala de *site* (eTLD+1), não de origem:** porta e esquema não contam. Por
  isso `localhost:4200 → localhost:8000` é same-site e passa em dev, enquanto
  Vercel → Raspberry Pi não é e vai quebrar em produção. `SameSite=None` **exige**
  `Secure`, que exige HTTPS.
- **`clearCookie` precisa das mesmas opções do `res.cookie`** — se divergirem, o logout
  responde 200 e não apaga nada.
- **Angular vs React:** Angular é compilador + contêiner de DI, não biblioteca de
  runtime. Não há re-render de função; signals atualizam só o que depende deles. Service
  com DI é o equivalente estrutural do `Controller → Service → Repository` do backend.
- **Guard do Angular não é `middleware.ts` do Next:** roda no browser e é só UX. A
  segurança real continua sendo o `authMiddleware` do Express.
- **Documentação mente com o tempo, código não.** A matriz tinha 4 apontamentos: 1
  estava errado e 2 já haviam sido resolvidos.

## Links e materiais

- [OWASP API1:2023 — Broken Object Level Authorization](https://owasp.org/API-Security/editions/2023/en/0xa1-broken-object-level-authorization/) — a classe do IDOR corrigido.
- [TypeScript — `exactOptionalPropertyTypes`](https://www.typescriptlang.org/tsconfig/#exactOptionalPropertyTypes)
- [MDN — `BigInt` e JSON](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt#use_within_json)
- [Prisma — Error reference (P2002, P2003)](https://www.prisma.io/docs/orm/reference/error-reference#error-codes)
- [Prisma — `omit` de campos](https://www.prisma.io/docs/orm/prisma-client/queries/excluding-fields)
- [Express — Error handling](https://expressjs.com/en/guide/error-handling.html)
- [Zod — `.refine()`](https://zod.dev/api?id=refine)
- [MDN — CORS: requests with credentials](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS#requests_with_credentials)
- [MDN — `Set-Cookie` / `SameSite`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie#samesitesamesite-value)
- [Conventional Commits](https://www.conventionalcommits.org/pt-br/v1.0.0/)
- [angular.dev — Signals](https://angular.dev/guide/signals)
- [angular.dev — Dependency Injection](https://angular.dev/guide/di)
- [PrimeNG](https://primeng.org/)

## Próximos passos

1. Commitar o scaffold Angular do `frontend/` (trocado durante a sessão, ainda fora do
   versionamento).
2. Extrair as opções do cookie para uma constante única, usada no login e no logout.
3. Criar módulo de configuração por ambiente, validado na subida do servidor
   (`JWT_SECRET`, origin do CORS, opções do cookie).
4. Instalar PrimeNG (`primeng`, `@primeuix/themes`, `@angular/cdk`) e resolver a
   convivência com o Tailwind 4 **antes** da primeira tela.
5. Construir o módulo de autenticação do front: `AuthService` + componente de login.
6. Decidir o escopo final do MVP (cortar ou adiar o RF008).
7. Fechar o `it.todo` restante: `.refine()` de corpo vazio no `updateTaskSchema`.

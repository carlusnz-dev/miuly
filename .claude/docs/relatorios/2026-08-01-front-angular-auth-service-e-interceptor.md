# Relatório de sessão — 2026-08-01

--- Cabeçalho ---
Autor: Carlos e Claude
Data: 2026-08-01
Módulos: Front-end (Angular), ADRs, Back-end (contrato de auth)
Atividade: ADR-0011 (Taiga UI), estruturação do front por domínio, interceptor de
credenciais, `AuthService` e ajuste do contrato de `/auth/me`

# Corpo

## Contexto

Carlos abriu a sessão com o backend fechado e o front recomeçando do zero em Angular.
Pediu explicitamente o modo **professor**: ensinar Angular por partes, começando pelo
componente de login e seu service, com ele codando e pedindo revisão — não receber o
módulo pronto.

Ponto de partida real do `frontend/`: scaffold Angular 22 com `routes = []`,
`provideHttpClient()` sem interceptor e Taiga UI já instalado — divergindo da ADR-0010,
que registrava PrimeNG.

## Tópicos abordados

1. Leitura dos relatórios de 31/07 (Claude e Agy) e do estado real do `frontend/`.
2. **ADR-0011** — Taiga UI substituindo o PrimeNG da ADR-0010.
3. Verificação da licença do PrimeNG e do Taiga UI (delegada ao Agy via `web_lookup`).
4. **"Módulos" no Angular moderno** — por que `NgModule` é legado e o que o substituiu.
5. Crítica a uma resposta do Google AI Mode que recomendava monorepo com
   `ng g application` por RF.
6. Schematics do CLI: nomes de arquivo gerados, `--type`, `--dry-run`.
7. Diagnóstico do build quebrado (`less` ausente) e de duplicações no `angular.json`.
8. Mecanismo de `environments` e `fileReplacements`.
9. **Interceptor de credenciais** — `withCredentials`, imutabilidade de `HttpRequest`.
10. **`AuthService`** — `inject()`, signals com `asReadonly()`, Observables lazy, `tap`.
11. Revisão do contrato de auth do backend, expondo três problemas de API.
12. Duas rodadas de code review sobre o código escrito pelo Carlos.

## Decisões e recomendações

### Decisões do Carlos

- **Taiga UI como biblioteca de UI** (ADR-0011, Proposto), substituindo a ADR-0010.
  Critérios: já estava instalado e ligado (custo de adoção zero) e preferência pela API.
  A ADR-0010 foi marcada como *Substituída por ADR-0011*.
- **Estrutura por domínio numa SPA única**, com `core/`, `pages/` e rotas lazy —
  rejeitado o monorepo com múltiplas `application`.
- **`pages/`** em vez de `features/` como nome da pasta de telas.
- **`/auth/me` passou a devolver o usuário completo** (via
  `findLoggedUserByIdService`), com `omit: { password: true }` no repositório.
- **Login continua devolvendo apenas a mensagem** — o front resolve com
  `login()` → `me()`, deixando o `me()` como fonte única de verdade da sessão.

### Recomendações da IA (a validar por Carlos)

- **`loginUserSchema` precisa de `.refine()`** exigindo ao menos um entre `username` e
  `email`. Hoje um POST só com `password` passa pelo Zod e chega ao repositório com um
  `OR` vazio. **Não verifiquei** se isso é explorável — depende da semântica do Prisma
  para `OR: []` —, mas depender de comportamento implícito de ORM em caminho de
  autenticação é frágil. Irmão do `it.todo` pendente no `updateTaskSchema`.
- **Envelope inconsistente:** `message` é string em toda rota, mas carregava objeto no
  `/auth/me` (já corrigido para `data` nessa rota). Vale padronizar `data` para payload
  e `message` para texto em toda a API.
- Trocar a `apiUrl` de produção no `environment.ts` antes do deploy — hoje está com
  `localhost` e um `TODO`.
- Renomear `core/interceptor/` para `interceptors/` (a pasta terá mais de um).

## Bugs encontrados e corrigidos

1. **Build quebrado:** o schematic do Taiga registrou dois `.less` em `angular.json`,
   mas o pacote `less` não estava instalado. `ng build` falhava com *"Unable to load the
   less stylesheet preprocessor"*, enquanto `tsc --noEmit` passava limpo.
2. **Entrada duplicada em `angular.json`** — o glob de `@taiga-ui/icons` aparecia duas
   vezes em `assets[]`, provavelmente por rodar o `ng add` duas vezes. (Mesma causa do
   `TuiRoot` duplicado no `imports` do `app.ts`, corrigido pelo Carlos.)
3. **`fileReplacements` furado:** `auth.ts` e o interceptor importavam
   `environments/environment.development` diretamente, anulando a substituição por
   ambiente. Um build de produção sairia apontando para `localhost:8000`.
4. **`environment.ts` vazio** (`{}`) — era a causa de (3): o import do arquivo de
   desenvolvimento "resolvia" o erro de compilação em vez de corrigi-lo.
5. **`login(user: User)` com o tipo errado** — `User` é o modelo de *resposta* e não
   tem `password`. O corpo enviado seria rejeitado com 400 pelo Zod. Corrigido com uma
   interface `LoginRequest` espelhando o `loginUserSchema`.
6. **`User` sem `email` e `role: string`** em vez do union `'USER' | 'ADMIN'`.

## Correção de um erro meu

Apontei o `@Service()` gerado pelo CLI como bug, assumindo que a decorator de service
em Angular é `@Injectable`. **Estava errado:** no Angular 22 o `@Service` é o padrão do
schematic e `--injectable` é a opção para gerar `@Injectable`. Verificado por
`tsc --noEmit`. Também previ uma colisão de nomes entre os arquivos de service e guard
que não existe — o CLI desambigua sozinho (`auth.ts` vs `auth-guard.ts`), confirmado
por `--dry-run`.

## Aprendizados

- **`NgModule` é legado.** "Módulo" no Angular moderno = pasta de feature + arquivo de
  rotas. Não use `ng generate module`.
- **`ng g application` é fronteira de _deploy_; `loadChildren` é fronteira de _código_.**
  Um RF é uma rota, não uma aplicação. Apps separados não compartilham estado nem
  chunks, e navegar entre eles é page load completo.
- **Observable é lazy:** sem `subscribe()`, a requisição nunca sai. É o oposto do
  `fetch()`, e o tropeço nº 1 de quem vem de React.
- **O service retorna o Observable, o componente assina.** Se o service assina, o
  chamador perde saber quando terminou, se falhou, e a chance de cancelar.
- **`HttpRequest` é imutável** — interceptor clona (`req.clone({...})`) e precisa passar
  **o clone** para o `next`. Passar o original vira no-op silencioso.
- **Interceptor não registrado é código morto silencioso.** `provideHttpClient()` sem
  `withInterceptors([...])` não dá erro nenhum.
- **`environment.ts` é o de produção**; `environment.development.ts` é o override via
  `fileReplacements`. Importar o `.development` direto anula o mecanismo.
- **`tsc --noEmit` verde ≠ `ng build` verde** — o TypeScript não sabe nada de CSS.
- **Typecheck verde pode significar que você contornou o erro, não que o resolveu.**
- **Datas chegam como string ISO no JSON.** Tipar como `Date` compila e quebra em
  runtime — mesma família do `Omit` que não recorta.
- **`post<T>()` tipa a resposta; o corpo entra como `unknown`.** O compilador não
  fiscaliza o que você envia.
- **Request e response são contratos distintos** e merecem tipos distintos.
- **`asReadonly()`** deixa o componente ler sem poder escrever — o equivalente no front
  do princípio da ADR-0007: quem decide o estado é o service, não a tela.
- **O erro HTTP vive em outro canal:** 4xx/5xx chegam como `HttpErrorResponse` no
  `error`, nunca no `next`.
- **PrimeNG core é MIT e continua gratuito** — o que é pago são PrimeBlocks, templates e
  o LTS. Taiga UI é Apache-2.0.
- **Descreva o problema à IA, não a solução que você presumiu.** A resposta do Google
  estava tecnicamente correta e resolvia um problema que o Miuly não tem.

## Links e materiais

- [angular.dev — Signals](https://angular.dev/guide/signals)
- [angular.dev — Dependency Injection](https://angular.dev/guide/di)
- [angular.dev — `inject()`](https://angular.dev/api/core/inject)
- [angular.dev — HttpClient](https://angular.dev/guide/http)
- [angular.dev — HTTP interceptors](https://angular.dev/guide/http/interceptors)
- [angular.dev — `HttpRequest.clone`](https://angular.dev/api/common/http/HttpRequest#clone)
- [angular.dev — `HttpErrorResponse`](https://angular.dev/api/common/http/HttpErrorResponse)
- [angular.dev — Reactive forms](https://angular.dev/guide/forms/reactive-forms)
- [angular.dev — Typed forms](https://angular.dev/guide/forms/typed-forms)
- [angular.dev — `Validators`](https://angular.dev/api/forms/Validators)
- [angular.dev — Lazy loading de rotas](https://angular.dev/guide/routing/common-router-tasks#lazy-loading)
- [angular.dev — Importing e standalone](https://angular.dev/guide/components/importing)
- [angular.dev — Referência do `ng generate`](https://angular.dev/cli/generate)
- [angular.dev — Workspace configuration](https://angular.dev/reference/configs/workspace-config)
- [RxJS — Observables são lazy](https://rxjs.dev/guide/observable)
- [RxJS — `tap`](https://rxjs.dev/api/operators/tap)
- [RxJS — `catchError`](https://rxjs.dev/api/operators/catchError)
- [RxJS — `switchMap`](https://rxjs.dev/api/operators/switchMap)
- [Taiga UI](https://taiga-ui.dev/)
- [Zod — `.refine()`](https://zod.dev/api?id=refine)
- [MDN — `JSON.parse()` e datas](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse)
- [MDN — CORS: requests with credentials](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS#requests_with_credentials)

## Próximos passos

1. **Corrigir o import restante** em `core/interceptor/credentials-interceptor.ts`:
   trocar `environments/environment.development` por `environments/environment`.
2. **Provar o `me()` no browser** — `ng serve`, aba Network, confirmar a requisição a
   `/auth/me` saindo com `Cookie: SESSIONID` (ou um 401 limpo).
3. **Construir o formulário de login** (`pages/auth/login/`): `ReactiveFormsModule`,
   `FormBuilder`, `Validators.minLength(8)` espelhando o Zod, e o `onSubmit`.
   Decidir o desenho do campo identificador (username *ou* email).
4. **Encadear `login()` → `me()`** com `switchMap`, evitando callback aninhado.
5. Remover o `constructor` de teste do `App` (andaime).
6. Criar o `authGuard` usando o estado publicado pelo `AuthService`.
7. Adicionar o `.refine()` no `loginUserSchema` do backend.
8. Commitar em partes: `chore(front)` para o scaffold Taiga, `docs(adr)` para a
   ADR-0011, `feat(front)` para o módulo de auth.

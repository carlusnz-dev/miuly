# Arquitetura do frontend

## Estado e objetivo

O frontend em `frontend/` é uma SPA Angular 22 standalone, com TypeScript
estrito, Angular Router, Vitest e Sass (`.scss`), sem Tailwind. Existem a página
inicial e as telas de login e cadastro. Finanças, tarefas e calendário continuam
planejados.

A inspiração em Next é **organizacional**: páginas e arquivos relacionados
ficam juntos por funcionalidade. Angular Router continua sendo a fonte das
rotas; nomes de pastas não criam rotas automaticamente e `modules/` não
significa que cada funcionalidade precise de um `NgModule`.

## Estrutura

```text
frontend/
  angular.json                build, teste, Sass e proxy de desenvolvimento
  src/
    index.html                documento HTML e idioma
    main.ts                   bootstrap da aplicação
    proxy.conf.json           /users/** -> backend local
    styles.scss               base visual global
    app/
      app.ts|html|scss        shell com layout e router-outlet
      app.config.ts           providers globais (Router e HttpClient)
      app.routes.ts           mapa explícito de rotas
      api/
        http-response.ts      envelope HTTP compartilhado
        auth.api.ts            DTOs e chamadas de identidade
        auth.interceptor.ts    Bearer e tentativa única de renovação após 401
        users.api.ts          cliente e DTOs das rotas /users/me
        users.api.spec.ts     contrato de requisição testado
      components/
        ui/
          brand/             componente visual reutilizável
        layout/
          header/            cabeçalho e link para conteúdo
          footer/            rodapé
      modules/
        auth/
          session.ts          estado em signals e hook useSession
          pages/auth/         login e cadastro
        home/
          pages/
            home/            página inicial e estilos locais
```

Ao implementar uma nova área, coloque páginas, componentes exclusivos, estado
de interface e testes sob `modules/<area>/`. Se a área crescer, adicione um
arquivo `<area>.routes.ts` e carregue-o em `app.routes.ts`. Mova um componente
para `components/ui/` somente quando for compartilhado por áreas diferentes.
O layout global fica em `components/layout/`; layouts exclusivos ficam na
própria área. Crie pastas conforme houver código real, sem diretórios vazios.

## Limites de dependência

```text
rota -> página/área -> api/<recurso> -> HttpClient -> backend
             |-> components/ui
app shell -> components/layout -> components/ui
```

- `api/` concentra URL, método HTTP e DTOs de transporte. O código de páginas
  consome serviços dessa pasta, sem espalhar `HttpClient` ou caminhos de API.
- DTOs refletem o contrato público, não os tipos Prisma. O envelope atual de
  sucesso é `{ ok, message, data }`; datas de `UserResponse` e `ProfileResponse`
  são strings ISO 8601.
  Os tipos TypeScript não fazem validação em tempo de execução.
- Regras de domínio, autorização e propriedade dos dados permanecem no backend.
  O frontend pode controlar apresentação e navegação, mas não substitui
  verificações de segurança da API.
- `AuthApi` espelha os DTOs de `backend/src/modules/auth/contract.ts` da branch
  `feature/modulos-corte-1` e o contrato HTTP em `docs/plano-corte-1-backend.md`.
  O backend ainda precisa publicar as rotas para integração ponta a ponta.
- `UsersApi` espelha as rotas autenticadas `GET/PATCH /users/me`,
  `PUT /users/me/password` e `GET/PATCH /users/me/profile` do contrato de `users`.
  Nenhuma tela consome esse cliente ainda.

## Sessão e autenticação

`useSession()` inicia uma única verificação por abertura da SPA. Os signals
`status`, `user` e `isAuthenticated` deixam cada trecho da interface reagir ao
estado que usa. Os estados são `checking`, `authenticated`, `anonymous` e
`unavailable` (erro de rede na verificação inicial, com ação para tentar novamente).
O refresh token é enviado
somente pelo cookie httpOnly; o access token fica em memória e nunca em
`localStorage` ou `sessionStorage`.

O interceptor anexa `Authorization: Bearer` às chamadas protegidas. Após 401,
compartilha uma única operação de refresh entre chamadas concorrentes e repete
a chamada original uma vez. Um 409 no refresh gera uma nova tentativa, conforme
o ADR 0002. Um 401 no refresh limpa a sessão e leva ao login. Logout só descarta
o estado local após confirmação da API; se a rede falhar, a interface permite
tentar novamente sem afirmar que a sessão no servidor foi encerrada.

## Roteamento, estilos e execução

O `app.routes.ts` registra `home`, `login` e `cadastro` com `loadComponent`. O `App` é o shell
persistente; páginas entram no `router-outlet`. A rota curinga redireciona
para a página inicial enquanto não houver tela de 404 definida.

Sass está configurado no `angular.json` e em arquivos `.scss`. A base global
em `src/styles.scss` contém tokens semânticos do tema escuro, foco visível e
preferência por movimento reduzido; estilos de componentes ficam próximos do
HTML/TypeScript correspondente. A direção está em [docs/style](style/README.md).
Não adicionar Tailwind.

Em desenvolvimento, a SPA chama `/auth/**` e `/users/**` na mesma origem. O proxy
do Angular encaminha essas rotas para `localhost:8080`. Em implantação,
configurar o servidor da SPA para encaminhá-las à API e servir `index.html` nas
rotas de navegação.
Não há configuração de produção de hospedagem nesta etapa.

## Evolução

Antes de ampliar identidade ou criar telas de finanças, tarefas e calendário,
confirmar requisitos, contrato HTTP e segurança da área. Criar rotas e cliente
HTTP específicos; testes de UI para comportamento e testes de API para método,
caminho e envelope quando houver integração. Não introduzir abstração genérica
de CRUD ou estado global sem uso concreto.

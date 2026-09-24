# Arquitetura do frontend

## Estado e objetivo

O frontend em `frontend/` é uma SPA Angular 22 standalone, com TypeScript
estrito, Angular Router, Vitest e Sass (`.scss`), sem Tailwind. Nesta fundação
existe apenas a página inicial. Finanças, tarefas, calendário e identidade
continuam planejados; não há telas nem fluxos funcionais dessas áreas.

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
        users.api.ts          cliente e DTO de GET /users/:id
        users.api.spec.ts     contrato de requisição testado
      components/
        ui/
          brand/             componente visual reutilizável
        layout/
          header/            cabeçalho e link para conteúdo
          footer/            rodapé
      modules/
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
  sucesso é `{ ok, message, data }`; datas de `UserDto` são strings ISO 8601.
  Os tipos TypeScript não fazem validação em tempo de execução.
- Regras de domínio, autorização e propriedade dos dados permanecem no backend.
  O frontend pode controlar apresentação e navegação, mas não substitui
  verificações de segurança da API.
- `UsersApi` representa somente o endpoint já existente `GET /users/:id`.
  A página inicial não o chama nem exibe dados pessoais. Estratégia de
  autenticação e propriedade ainda depende de decisão de produto e backend.

## Roteamento, estilos e execução

O `app.routes.ts` registra `home` com `loadComponent`. O `App` é o shell
persistente; páginas entram no `router-outlet`. A rota curinga redireciona
para a página inicial enquanto não houver tela de 404 definida.

Sass está configurado no `angular.json` e em arquivos `.scss`. Use
`src/styles.scss` só para base global; estilos de componentes ficam próximos
do HTML/TypeScript correspondente. Adicione tokens ou mixins compartilhados
quando houver repetição real. Não adicionar Tailwind.

Em desenvolvimento, a SPA chama `/users/:id` na mesma origem. O proxy do
Angular encaminha `/users/**` para `localhost:8080`, que corresponde à rota e
porta padrão atuais do backend. Em implantação, configurar o servidor da SPA
para encaminhar essa rota à API e servir `index.html` nas rotas de navegação.
Não há configuração de produção de hospedagem nesta etapa.

## Evolução

Antes de criar uma tela de identidade, finanças, tarefas ou calendário,
confirmar requisitos, contrato HTTP e segurança da área. Criar rotas e cliente
HTTP específicos; testes de UI para comportamento e testes de API para método,
caminho e envelope quando houver integração. Não introduzir abstração genérica
de CRUD ou estado global sem uso concreto.

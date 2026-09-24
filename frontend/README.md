# Frontend Miuly

SPA Angular standalone com TypeScript, roteamento explícito e estilos Sass
(`.scss`). Não usa Tailwind. A organização de módulos é descrita em
[docs/frontend-architecture.md](../docs/frontend-architecture.md).

## Começar

Requer Node.js compatível com Angular 22 e npm. Na pasta `frontend/`:

```bash
npm ci
npm start
```

Acesse `http://localhost:4200`. A página inicial funciona sem o backend. O
proxy de desenvolvimento encaminha `/users/**` para `http://localhost:8080`,
porta padrão do backend. O backend só deve ser iniciado após configurar o banco,
conforme [backend/README.md](../backend/README.md).

## Validação

```bash
npm run check
npm run build
npm test
```

`check` compila em modo de desenvolvimento com verificação de templates;
`build` gera o bundle de produção; `test` executa Vitest uma vez.

## Organização

- `src/app/modules/`: funcionalidades e páginas agrupadas por área;
- `src/app/components/ui/`: componentes visuais reutilizados entre áreas;
- `src/app/components/layout/`: estrutura persistente da aplicação;
- `src/app/api/`: clientes HTTP e DTOs públicos do backend;
- `src/app/app.routes.ts`: registro explícito de rotas com carregamento tardio;
- `src/styles.scss`: estilos globais mínimos; estilos locais ficam com cada
  componente.

Para produzir a aplicação fora do servidor de desenvolvimento, o servidor web
deve entregar a SPA nas rotas de navegação e encaminhar `/users/**` à API.
Novas rotas de API exigem atualizar essa configuração.

# Roadmap do Projeto: Miuly

## Objetivo Geral

Desenvolver um sistema unificado (Personal Life ERP) para integrar controle financeiro,
tarefas, Google Calendar e, futuramente, Obsidian.

## Escopo do MVP

Meta de entrega: **16 de julho de 2026**. O MVP entrega **três módulos ponta a ponta** —
Financeiro (RF002), To-do List (RF001) e Google Calendar (RF008) — sobre uma base de
autenticação (RF006). Detalhes de requisitos e cronograma em [`docs/plano_mvp.md`](docs/plano_mvp.md).
Decisão de topologia de deploy em [`docs/adr/0001-topologia-de-deploy.md`](docs/adr/0001-topologia-de-deploy.md).

## Metas e Fases

### Fase 1: Fundação e Estruturação

- [X] Inicializar repositório Git.
- [ ] Configurar projeto Back-end (Node.js + Express + TypeScript).
- [ ] Configurar projeto Front-end (Next.js).
- [ ] Configurar banco de dados PostgreSQL no Supabase e conectar via ORM (Prisma ou Drizzle).
- [ ] Modelar o banco dos três módulos (conceitual → lógico → físico) e criar migrations.
- [ ] Montar esqueleto da Clean Architecture (Controllers, Services, Repositories) + healthcheck.

### Fase 2: Autenticação (RF006)

- [ ] Login por email/senha.
- [ ] Login via Google OAuth2 (escopo já preparado para reaproveitar no Calendar).
- [ ] Middleware de autenticação.

### Fase 3: Módulo Financeiro (RF002) — MVP

- [ ] Desenvolver rotas CRUD no Back-end (criação + edição RF002.1).
- [ ] Testes unitários do módulo.
- [ ] Desenvolver interface no Front-end para visualização e input.

### Fase 4: Módulo To-do List (RF001) — MVP

- [ ] Desenvolver rotas CRUD no Back-end.
- [ ] Testes unitários do módulo.
- [ ] Desenvolver interface no Front-end.

### Fase 5: Integração Google Calendar (RF008) — MVP

- [ ] Configurar scopes OAuth2 do Google Calendar.
- [ ] Desenvolver rotas no Back-end para buscar e normalizar eventos (somente leitura).
- [ ] Criar visualização de calendário no Front-end.

### Fase 6: Deploy e Infraestrutura

- [ ] Configurar pipeline de testes básicos e CI/CD (GitHub Actions).
- [ ] Deploy do Front-end na Vercel.
- [ ] Deploy do Back-end no Raspberry Pi (processo long-running).
- [ ] Configurar acesso externo (DDNS/túnel), HTTPS e CORS.

## Backlog (pós-MVP)

Requisitos fora do escopo da entrega de 16/jul, para evoluir depois com CI/CD já montado:

- **RF001 (sync)** — Sincronização de tarefas com o Google Drive.
- **RF002.2** — Exportação dos dados financeiros para CSV / Google Sheets.
- **RF003 / RF003.1** — Módulo de notas em Markdown e exportação para o Obsidian.
  - Requer o serviço no Back-end usando `fs` para ler o cofre local (`.md`) e parser de
    Markdown para extrair metadados (tags, tasks) — motivação central da topologia self-hosted.
- **RF004** — Notificações push / Telegram.
- **RF005** — Relatórios mensais por email.
- **RF007** — LLM (Gemini) para descrição em algum módulo.

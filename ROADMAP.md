# Roadmap do Projeto: Miuly

## Objetivo Geral

Desenvolver um sistema unificado (Personal ERP) para integrar Google Calendar, Obsidian e controle financeiro.

## Metas e Fases

### Fase 1: Fundação e Estruturação

- [X] Inicializar repositório Git.
- [ ] Configurar projeto Back-end (Node.js + Express + TypeScript).
- [ ] Configurar projeto Front-end (Next.js).
- [ ] Configurar banco de dados PostgreSQL no Supabase e conectar via ORM (Prisma ou Drizzle).

### Fase 2: Módulo Financeiro (MVP)

- [ ] Modelar banco de dados (Tabelas de Transações, Categorias, Contas).
- [ ] Desenvolver rotas CRUD no Back-end.
- [ ] Desenvolver interface no Front-end para visualização e input.

### Fase 3: Integração Google Calendar

- [ ] Obter credenciais da API do Google Calendar (OAuth2).
- [ ] Desenvolver rotas no Back-end para buscar e sincronizar eventos/tasks.
- [ ] Criar visualização de calendário no Front-end.

### Fase 4: Integração Obsidian

- [ ] Desenvolver serviço no Back-end utilizando `fs` (File System) para ler arquivos `.md` locais do cofre.
- [ ] Criar parser de Markdown para extrair metadados (tags, tasks).
- [ ] Exibir anotações indexadas no Front-end.

### Fase 5: Deploy e Infraestrutura

- [ ] Configurar pipeline de testes básicos e CI/CD.
- [ ] Preparar ambiente de produção em um Raspberry Pi (Deploy do Back-end local).
- [ ] Configurar acesso externo (DDNS/Ngrok) e Webhooks, se necessário.

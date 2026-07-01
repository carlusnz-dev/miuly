# Plano MVP - Miuly

> O #Miuly é um projeto pessoal para gerenciamento e planejamento da sua vida pessoal, que basicamente consiste em cruzar dados externos (como Google Calendar ou Obsidian), com sistema de notas, tasks e área financeira, reunindo tudo em um lugar só para facilitar a organização diária.

## Conceito inicial

O projeto hoje (01 de julho de 2026) segue na fase de **construção do MVP**. Depois de uma revisão de escopo, decidi encurtar o objetivo para algo realmente entregável: em vez de tentar implementar tudo, o MVP entrega **três módulos ponta a ponta** — Financeiro, To-do List e Eventos do Google Calendar. O foco continua sendo estudar #EngenhariaDeSoftware, #CleanCode, #ADR e #CleanArchitecture, escrevendo **eu mesmo** toda a lógica de negócio e modelagem, usando IA apenas como revisora, para documentos, testes e relatórios.

O prazo de entrega do MVP é **16 de julho de 2026** (janela de ~15 dias). A ideia é entregar uma fatia vertical funcional de cada módulo e deixar o restante dos requisitos no backlog para evoluir depois com CI/CD já montado.

## Stacks

Para o front-end, escolhi #NextJS, devido à sua rápida implementação e ao meu conhecimento já avançado em #React, mais uma biblioteca de UI (a definir) e #FramerMotion para animações dinâmicas. As versões estarão definidas no escopo geral do projeto.

Para o back-end, escolhi o #ExpressJS, pois quero aprender mais sobre frameworks leves (como Flask), a fim de entender a fundo a configuração inicial, middlewares, ORMs como Prisma e outros "acessórios" desse tipo de ferramenta.

Para o banco de dados, decidi usar a nuvem via #Supabase, pelo custo zero, por ser #PostgreSQL e pela liberdade que dá sobre todo o sistema.

Sobre **onde hospedar**: o back-end Express é um processo *long-running* e, no futuro, precisará ler o File System local do cofre do Obsidian — o que é incompatível com serverless (Vercel). Por isso a topologia foi decidida e registrada no **[ADR-0001](adr/0001-topologia-de-deploy.md)**: **front-end na Vercel** e **back-end em um Raspberry Pi** (self-hosted), com o Supabase como banco gerenciado.

## Estrutura

Sobre a estrutura de pastas do projeto, juntando stacks, documentos e configurações do #Antigravity, ficou assim:

```
| miuly

|----> .gemini/
	|----> docs/ # Documentos importantes sobre notas do próprio Antigravity
	|----> rules/ # Regras sobre o Antigravity de como ele deve se comportar
	settings.json
	AGENTS.md

|----> docs/ # Documentos do projeto, feitos no Obsidian e colados aqui.
	|----> adr/ # Architecture Decision Records

|----> frontend/
	|----> src/ # Projeto principal: componentes, páginas, api etc.
	|----> public/ # arquivos estáticos e públicos
	README.md
	AGENTS.md
	...

|----> backend/
	|----> src/ # Pasta principal do projeto
		|----> models/
		|----> routes/
		|----> middleware/
		|----> config/
	.env
	AGENTS.md

CLAUDE.md
docker-compose.yml
.env
AGENTS.md
README.md
```

Em conclusão, a estrutura de diretórios fica, de forma abstrata, separada entre **front-end**, **back-end**, documentos e arquivos do Antigravity.

## Requisitos

Os requisitos abaixo são os principais do projeto. Para o MVP, **nem todos serão implementados até 16/jul** — a seleção de escopo está marcada explicitamente em cada item. O objetivo é entregar poucos requisitos, porém completos (ponta a ponta), e deixar o resto no backlog.

**No escopo do MVP (16/jul):** RF006 (autenticação), RF002 (financeiro), RF001 (to-do), RF008 (Google Calendar).
**Fora do escopo (backlog pós-MVP):** RF003, RF004, RF005, RF007 e as integrações de exportação (RF001 sync no Drive, RF002.2 CSV/Sheets).

### Requisitos Funcionais

> Todas as funcionalidades disponíveis no sistema, onde o usuário usufruirá das ferramentas possíveis.

1. **RF001** *(MVP — sync no Drive fica no backlog)* - O usuário pode criar tarefas em _to do list_, definindo título e descrição **obrigatórios**, _due date_, compartilhamento e localização opcionais. A sincronização com o Google Drive fica para depois do MVP.
2. **RF002** *(MVP)* - O usuário pode criar marcações de entrada/saída de dinheiro no sistema, com título, descrição, instituição financeira, área relacionada, data e status (entrada ou saída).
	1. **RF002.1** *(MVP)* - O usuário pode editar suas marcações financeiras criadas (RF002), modificando todos os campos usados na criação.
	2. **RF002.2** *(backlog)* - O usuário pode exportar **todos** os dados para um arquivo CSV ou direto para o Google Sheets (via API).
3. **RF003** *(backlog)* - O usuário pode criar e modificar notas em `markdown`, que deverão ser pequenas (RNF002).
	1. **RF003.1** *(backlog)* - O usuário pode exportar as notas para o Obsidian, por padrão na pasta _"00_Inbox"_.
4. **RF004** *(backlog)* - O sistema deve enviar notificações push ou via Telegram sobre avisos de tasks _due date_ e eventos.
5. **RF005** *(backlog)* - O sistema deve gerar relatórios mensais sobre o que foi alterado no mês e dados totais via email.
6. **RF006** *(MVP)* - O sistema deve ter login via email e Google OAuth. O OAuth do Google é reaproveitado pela integração do Calendar (RF008), o que justifica priorizá-lo.
7. **RF007** *(backlog)* - O sistema deve ter uma LLM (Gemini de preferência) para descrição de algum RF à escolha (RF001, RF002 e RF003).
8. **RF008** *(MVP)* - O usuário pode conectar sua conta Google e visualizar os eventos do Google Calendar dentro do Miuly (somente leitura no MVP).

### Requisitos Não Funcionais

> Todos os requisitos sobre o comportamento do sistema, como regras, funcionamento etc.

- **RNF001** - O sistema deve ser compatível com os SOs de desktop atuais, rodando nos navegadores modernos.
- **RNF002** - O sistema deve receber arquivos `markdown` de no máximo **2 MB**.
- **RNF003** - O sistema deve gerar relatórios em até 3 minutos.
- **RNF004** - O sistema deve gerar o CSV em até 1 minuto.
- **RNF005** - O sistema deve ser empacotável em um ambiente `Electron`.
- **RNF006** - O sistema deve ser responsivo e rápido, com tempo de resposta em até **1,5 s**.
- **RNF007** - O sistema deve ter exibição aninhada de funcionalidades por usuário (ex.: usuário X vê telas 1 e 2).

## Plano de construção

Cronograma de **01 a 16 de julho de 2026**. A regra é fechar cada camada antes de subir para a próxima e escrever a lógica de negócio na mão; a IA entra em documentação, boilerplate estrutural, testes e relatórios.

- **Dia 1 (01/jul)** - Setup dos projetos `backend` (Node + Express + TypeScript) e `frontend` (Next.js), ESLint/Prettier, `docker-compose`, Prisma iniciado e conexão com o Supabase validada. _(Fase 1 do Roadmap)_
- **Dias 2–3 (02–03/jul)** - Modelagem do banco dos três módulos (feita do zero por mim: conceitual → lógico → físico), migrations no Prisma e esqueleto da Clean Architecture (Controllers, Services, Repositories) + healthcheck.
- **Dias 4–5 (04–05/jul)** - Autenticação (RF006): email/senha + Google OAuth2 (escopo já preparado para o Calendar) e middleware de auth.
- **Dias 6–7 (06–07/jul)** - Módulo Financeiro (RF002 + RF002.1) no back-end, com testes unitários.
- **Dia 8 (08/jul)** - Módulo To-do List (RF001) no back-end, com testes unitários.
- **Dias 9–10 (09–10/jul)** - Integração Google Calendar (RF008): scopes OAuth, buscar e normalizar eventos.
- **Dias 11–13 (11–13/jul)** - Front-end: telas de auth, financeiro, to-do e calendário; responsivo e com #FramerMotion.
- **Dia 14 (14/jul)** - Integração ponta a ponta, ajuste de RNFs (tempo de resposta) e testes com os 2 amigos.
- **Dia 15 (15/jul)** - Deploy do front-end na Vercel, do back-end no Raspberry Pi e CI/CD básico com GitHub Actions.
- **Dia 16 (16/jul)** - Buffer: documentação final, correções e definição do plano de continuidade.

## Testes

Para teste funcional, eu mesmo serei o usuário primário e stakeholder principal. Para teste de UI e usabilidade, usarei 2 amigos com acesso limitado às funções de _to do list_ (RF001) e financeiro (RF002). Os testes unitários do back-end acompanham cada módulo conforme o cronograma, com apoio da IA na escrita dos casos.

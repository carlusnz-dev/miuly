# Matriz de Rastreabilidade de Requisitos — Miuly

> Documento de acompanhamento que cruza **requisito ↔ implementação ↔ realidade**.
> Serve para responder, a qualquer momento, "o que está feito, onde está no código e o
> que falta". Fonte dos requisitos: [`plano-mvp.md`](plano-mvp.md). Fonte do status:
> leitura direta do código do backend.

- **Última verificação:** 31 de julho de 2026
- **Prazo original do MVP:** 16 de julho de 2026 — **vencido**, ver §3
- **Escopo do MVP:** RF006 (auth), RF002 (financeiro), RF001 (to-do), RF008 (Calendar).

## Legenda de status

| Símbolo | Significado |
|---------|-------------|
| 🟢 Feito | Implementado ponta a ponta na camada em questão e sem gap bloqueante conhecido. |
| 🟡 Parcial | Começado, mas incompleto ou com gap relevante (segurança, bug, camada faltando). |
| 🔴 Pendente | Não iniciado ou apenas modelado (ex.: só existe o model no schema). |
| ⚪ Backlog | Fora do escopo do MVP; não é para estar pronto em 16/jul. |

---

## 1. Catálogo de requisitos

### Requisitos Funcionais

| RF | Escopo | Descrição resumida |
|----|--------|--------------------|
| RF001 | MVP | Criar tarefas (to-do) com título e descrição obrigatórios; due date, compartilhamento e localização opcionais. Sync com Drive fica no backlog. |
| RF002 | MVP | Registrar entradas/saídas financeiras (título, descrição, instituição, área, data, status). |
| RF002.1 | MVP | Editar marcações financeiras (todos os campos). |
| RF002.2 | Backlog | Exportar dados financeiros para CSV / Google Sheets. |
| RF003 | Backlog | Criar/editar notas em Markdown (pequenas — RNF002). |
| RF003.1 | Backlog | Exportar notas para o Obsidian (pasta `00_Inbox`). |
| RF004 | Backlog | Notificações push / Telegram para tasks e eventos. |
| RF005 | Backlog | Relatórios mensais por email. |
| RF006 | MVP | Login por email/senha + Google OAuth (OAuth reaproveitado pelo RF008). |
| RF007 | Backlog | LLM (Gemini) para descrição em algum módulo. |
| RF008 | MVP | Conectar conta Google e visualizar eventos do Calendar (somente leitura no MVP). |

### Requisitos Não Funcionais

| RNF | Descrição | Verificável hoje? |
|-----|-----------|-------------------|
| RNF001 | Compatível com navegadores modernos de desktop. | Front-end recomeçando em Angular (ADR-0009). |
| RNF002 | Aceitar Markdown de no máximo 2 MB. | Depende de RF003 (backlog). |
| RNF003 | Gerar relatórios em até 3 min. | Depende de RF005 (backlog). |
| RNF004 | Gerar CSV em até 1 min. | Depende de RF002.2 (backlog). |
| RNF005 | Empacotável em Electron. | Não iniciado. |
| RNF006 | Responsivo, resposta em até 1,5 s. | Front-end pendente. SPA sem SSR aumenta o custo do carregamento inicial (ADR-0009). |
| RNF007 | Exibição de funcionalidades por usuário (autorização por dono). | ✅ Sem violação conhecida no backend — ver §3. |

---

## 2. Matriz de rastreabilidade (MVP)

### Backend

| RF | Status | Camadas presentes | Onde está no código | Gaps / pendências |
|----|--------|-------------------|---------------------|-------------------|
| **RF006** | 🟡 Parcial | Route · Controller · Service · Repository · Middleware | `routes/auth.route.ts`, `controllers/auth.controller.ts`, `services/auth.service.ts`, `repositories/user.repository.ts`, `middleware/auth.middleware.ts` | Falta login **Google OAuth** (só email/senha). `JWT_SECRET` lido com `as string` sem checagem de existência (`auth.service.ts:40`, `auth.middleware.ts:22`) — se faltar no ambiente, quebra em runtime. Typo `reason: 'unaunthorized'` (`auth.middleware.ts:40`). |
| **RF002** | 🟢 Feito | Route · Controller · Service · Repository · Types | `routes/finances.router.ts`, `controllers/finances.controller.ts`, `services/finances.service.ts`, `repositories/finances.repository.ts` | Falta `GET /finances/:id` (a tela de edição vai precisar). Validado por `curl` em 31/jul: ownership de `bank_id`/`type_id`, recorte de `user_id` e status HTTP conferidos. |
| **RF002.1** | 🟢 Feito | Route · Controller · Service · Repository | `updateFinanceController`, `updateFinanceService` | Update é `PUT` mas semanticamente parcial (seria `PATCH`) — dívida de convenção, vale para Bank e User também. |
| **RF001** | 🟢 Feito | Route · Controller · Service · Repository · Types | `routes/task.route.ts`, `controllers/task.controller.ts`, `services/task.service.ts`, `repositories/task.repository.ts`, `types/task.type.ts` | `updateTaskSchema` aceita corpo vazio (falta `.refine()`). `:id` ainda sem validação Zod. `Task.id` é `BigInt` — inconsistente com os outros models (`Int`) e não serializável em JSON; o service converte com `Number()`, mas alinhar o schema seria mais limpo. |
| **RF008** | 🔴 Pendente | *(nenhuma)* | — | Nada iniciado. Sem scopes OAuth, sem integração com a API do Google Calendar, sem normalização de eventos. |

### Módulos de apoio (não são RF, mas o MVP depende deles)

| Módulo | Status | Onde está | Gaps |
|--------|--------|-----------|------|
| **Bank** | 🟢 Feito | `routes/bank.route.ts`, `controllers/bank.controller.ts`, `services/bank.service.ts` | `updateBankService` engole a exceção no `catch` e cai no retorno genérico "Dados inválidos" — a mensagem mente sobre a causa. |
| **Types** | 🟡 Parcial | `routes/types.route.ts`, `services/types.service.ts` | Só `create` e `findById`. **Faltam `list`, `update` e `delete`** — a rota `GET /` está comentada (`types.route.ts:11`). **Bloqueia o front**: sem listar tipos não dá para montar o select de categoria em Finanças nem em Tarefas. O `delete` precisa checar vínculos (FK `Restrict`) e devolver `conflict`. Violação de `@@unique` volta como `error` genérico. |
| **User** | 🟢 Feito | `routes/user.route.ts`, `services/user.service.ts` | `POST /user` é público (correto, é o registro) mas sem rate-limit. |

### Front-end

| Item | Status | Observação |
|------|--------|------------|
| Aplicação Angular | 🔴 Pendente | Scaffold criado (Angular 22, standalone). Nenhuma tela, service HTTP ou guard de rota escrito. |
| Integração com a API | 🔴 Pendente | Precisa de CORS + cookie `httpOnly` cruzando domínios (`SameSite`, `withCredentials`) — follow-up aberto da [ADR-0009](adr/0009-troca-do-framework-de-frontend-para-angular.md). |
| Biblioteca de animação | 🔴 Pendente | Framer Motion saiu com o React; substituto não escolhido. |

### Testes

| Alvo | Cobertura |
|------|-----------|
| `backend/tests/` | 9 arquivos, 74 testes passando + 2 `it.todo`. Services de task, finances, bank, types e user; middleware de auth; schemas Zod. Repositórios mockados — **não precisam de banco**, servem de gate de CI. |
| `it.todo` abertos | corpo vazio no `updateTaskSchema`; `conflict` em vez de `error` na violação de `@@unique` em Types. |

---

## 3. Alerta de integridade (31/jul)

1. **O prazo venceu com o MVP incompleto.** O `plano-mvp.md` previa entrega em 16/jul.
   Hoje o **backend** dos módulos RF006/RF002/RF001 está fechado, mas o **RF008
   (Calendar) não foi iniciado** e o **front-end está no zero** — recomeçado em Angular
   pela [ADR-0009](adr/0009-troca-do-framework-de-frontend-para-angular.md). Decisão de
   escopo pendente (decisão do Carlos): cortar o RF008 do MVP, adiá-lo, ou renegociar a
   data. O RF008 é o item mais caro que resta (OAuth + scopes + integração externa).
2. **RNF007 deixou de estar violado.** Os IDOR de `findBankByIdService` e
   `createFinancesService` foram fechados (commits `720e619` e `1a5aace`), e o
   vazamento de `user_id` no `GET /finances` foi corrigido junto. Todo acesso a recurso
   hoje passa por verificação de dono na camada de service, conforme
   [ADR-0007](adr/0007-ownership-e-recorte-de-campos-na-camada-de-service.md).
3. **Types é o gargalo do front.** É o único módulo do caminho crítico ainda incompleto,
   e as duas telas principais (Finanças e Tarefas) dependem de listar categorias.
   Deveria vir antes da primeira tela Angular.
4. **Gap resolvido que constava aqui antes:** o `z.email()` em `user.type.ts` **não** é
   inválido — é a API de formatos do Zod 4 e funciona (verificado por `curl`: registro
   e login OK). O apontamento de 15/jul estava errado.
5. **Pendências de infraestrutura para o deploy** (não são RF, mas bloqueiam a subida):
   falta `.env.example`, checagem de `JWT_SECRET` na inicialização e um `npm run build`
   validado. Rodar `vitest` na raiz do repositório falha, porque ele tenta executar os
   specs do Angular — o CI precisa rodar de dentro de `backend/`.

## Como manter este documento

- Atualize a coluna **Status** e **Gaps** sempre que fechar/mexer numa camada.
- A verdade do status vem do **código**, não do cronograma. Se divergir, o código ganha.
- Ao concluir um RF, mova o resumo do gap para o histórico (ou apague) e marque 🟢.

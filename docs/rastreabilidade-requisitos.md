# Matriz de Rastreabilidade de Requisitos — Miuly

> Documento de acompanhamento que cruza **requisito ↔ implementação ↔ realidade**.
> Serve para responder, a qualquer momento, "o que está feito, onde está no código e o
> que falta". Fonte dos requisitos: [`plano-mvp.md`](plano-mvp.md). Fonte do status:
> leitura direta do código do backend.

- **Última verificação:** 15 de julho de 2026
- **Prazo do MVP:** 16 de julho de 2026
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
| RNF001 | Compatível com navegadores modernos de desktop. | Front-end pendente. |
| RNF002 | Aceitar Markdown de no máximo 2 MB. | Depende de RF003 (backlog). |
| RNF003 | Gerar relatórios em até 3 min. | Depende de RF005 (backlog). |
| RNF004 | Gerar CSV em até 1 min. | Depende de RF002.2 (backlog). |
| RNF005 | Empacotável em Electron. | Não iniciado. |
| RNF006 | Responsivo, resposta em até 1,5 s. | Front-end pendente. |
| RNF007 | Exibição de funcionalidades por usuário (autorização por dono). | ⚠️ Ver gaps de IDOR abaixo. |

---

## 2. Matriz de rastreabilidade (MVP)

| RF | Status | Camadas presentes | Onde está no código | Gaps / pendências |
|----|--------|-------------------|---------------------|-------------------|
| **RF006** | 🟡 Parcial | Route · Controller · Service · Repository · Middleware | `routes/auth.route.ts`, `controllers/auth.controller.ts`, `services/auth.service.ts`, `repositories/user.repository.ts`, `middleware/auth.middleware.ts` | Falta login **Google OAuth** (só email/senha). `JWT_SECRET` sem checagem de existência (`auth.service.ts:40`). Typo `reason: 'unaunthorized'` (`auth.middleware.ts:40`). |
| **RF002** | 🟡 Parcial | Route · Controller · Service · Repository · Types | `routes/finances.router.ts`, `routes/bank.route.ts`, `controllers/finances.controller.ts`, `controllers/bank.controller.ts`, `services/*`, `repositories/*` | **Rotas de bank/finances sem `authMiddleware`**. **IDOR**: `findBankByIdService` e `createFinancesService` não validam dono (`bank.service.ts:125`, `finances.service.ts:13`). `z.email()` inválido (`user.type.ts`) trava validação. Status HTTP inconsistentes (201/200, 400/401). |
| **RF002.1** | 🟡 Parcial | Route · Controller · Service · Repository | `updateFinance` em `repositories/finances.repository.ts:25` | `update`/`delete` do Prisma filtrando por campo não-único (`{ id, user_id }`) — validação de posse deve subir para o Service. |
| **RF001** | 🔴 Pendente | *(só modelagem)* | `model Task` em `schema.prisma:66` | Faltam **controller, service, repository e route** de Task. Nenhuma rota registrada em `app.ts`. |
| **RF008** | 🔴 Pendente | *(nenhuma)* | — | Nada iniciado. Sem scopes OAuth, sem integração com a API do Google Calendar, sem normalização de eventos. |

> Detalhamento técnico dos gaps de RF002/RF006 (separação de camadas, segurança, erros)
> está no code-review desta sessão — ver relatório em `.claude/docs/relatorios/`.

---

## 3. Alerta de integridade (15/jul)

1. **Cronograma vs. realidade.** O `plano-mvp.md` previa RF001 no dia 08/jul e RF008 nos
   dias 09–10/jul. Hoje (15/jul, véspera do prazo) ambos estão 🔴. O MVP de 4 módulos
   não fecha ponta a ponta até 16/jul no ritmo atual — decisão de escopo é do Carlos
   (cortar, adiar ou renegociar o prazo).
2. **Docs de status dessincronizados.** O `ROADMAP.md` marca a **Fase 1 quase toda como
   `[ ]` não feita**, mas o backend já tem setup, Prisma, Clean Architecture e auth.
   (O `docs/estrutura.md`, que estava vazio, foi removido nesta sessão e seu conteúdo
   migrou para o `docs/README.md`.) Recomendo: esta matriz passa a ser a fonte única
   de status dos RFs, e o `ROADMAP.md` é atualizado (ou passa a apontar para cá).
3. **RNF007 (autorização por dono) está violado** pelos gaps de IDOR do RF002 — não é só
   dívida funcional, é requisito não-funcional explícito quebrado.

## Como manter este documento

- Atualize a coluna **Status** e **Gaps** sempre que fechar/mexer numa camada.
- A verdade do status vem do **código**, não do cronograma. Se divergir, o código ganha.
- Ao concluir um RF, mova o resumo do gap para o histórico (ou apague) e marque 🟢.

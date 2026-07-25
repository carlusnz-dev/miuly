# Relatório de sessão — 2026-07-15

## Contexto

Carlos pediu uma sessão de **code-review** do backend para avaliar como o projeto está
indo e alinhá-lo ao que foi definido no início (Clean Architecture, segurança,
convenções do `CLAUDE.md`), além de **revisar a documentação e a integridade dos
requisitos**. Como entregáveis paralelos: criar um documento dedicado aos RFs e
formalizar um padrão de arquivos Markdown para o projeto. Leitura do backend delegada ao
Antigravity (Gemini) via MCP agy-bridge.

## Tópicos abordados

1. **Code-review do backend** (delegado ao Agy) — separação de camadas, consistência
   entre módulos (auth/user/bank/finances), segurança, tratamento de erros e qualidade.
2. **Estado real dos módulos do MVP** confirmado por leitura do código.
3. **Matriz de rastreabilidade de requisitos** — novo documento cruzando RF ↔ código ↔
   status.
4. **Padrão de arquivos Markdown** — nomenclatura, frontmatter, cabeçalho e índices.

## Decisões e recomendações

**Decisões do Carlos nesta sessão:**
- Documento de RFs no formato **matriz de rastreabilidade** (não só catálogo).
- Padrão Markdown **proposto primeiro, aplicado depois** da aprovação — aprovado como
  proposto e aplicado na sequência.

**Aplicado (aprovado por Carlos):**
- Criado `docs/rastreabilidade-requisitos.md` (matriz RF ↔ implementação ↔ status).
- Criado `docs/padrao-markdown.md` (convenção de docs).
- Renomeados `plano_mvp.md` → `plano-mvp.md` e `workflow_mcp_agy_bridge.md` →
  `workflow-mcp-agy-bridge.md` (kebab-case), com correção de 6 links.
- Removido `docs/estrutura.md` (estava vazio); estrutura migrou para `docs/README.md`.
- Criados índices `docs/README.md`, `docs/relatorios/README.md`, `docs/planos/README.md`.

**Recomendações da IA a validar por Carlos (arquiteto):**
- Achados de code-review priorizados (ver abaixo) — Carlos decide a ordem/execução, pois
  tocam regra de negócio e segurança.
- Decisão de escopo do MVP: RF001 e RF008 estão 🔴 na véspera do prazo (16/jul).
  Cortar, adiar ou renegociar prazo é decisão dele.
- Atualizar `ROADMAP.md` (Fase 1 marcada como não feita, mas já concluída no código).

## Achados do code-review (priorizados)

Top 3 a corrigir primeiro:
1. **`z.email()` inválido** em `user.type.ts` (5, 12, 18) — não existe no Zod; trava a
   validação. Correção: `z.string().email()`.
2. **Rotas de `user` sem `authMiddleware`** (`user.route.ts`) — qualquer um lista, edita
   ou deleta usuários. Bank/finances também não exigem auth.
3. **IDOR** — `findBankByIdService` (`bank.service.ts:125`) e `createFinancesService`
   (`finances.service.ts:13`) não validam se o recurso pertence ao usuário logado.
   Viola o RNF007 (autorização por dono).

Outros: `JWT_SECRET` sem checagem (`auth.service.ts:40`); vazamento de erro interno do
Prisma na resposta (`user.service.ts:50`); status HTTP inconsistentes (201 vs 200, 400
vs 401, 409 ausente); `update`/`delete` do Prisma filtrando por campo não-único;
`404` usado para "lista vazia" e para erro interno em finances; typo
`reason: 'unaunthorized'`; nome divergente `finances.router.ts` vs `*.route.ts`; falta
de `await` nas rotas; `POST /delete/:id` em vez de `DELETE`.

## Aprendizados

- **Matriz de rastreabilidade** (traceability matrix): artefato que liga requisito →
  implementação → status → gaps. Base da norma de requisitos IEEE 830 / ISO/IEC/IEEE
  29148. Serve para detectar dessincronização entre plano e código.
- **IDOR (Insecure Direct Object Reference)**: falha de autorização em que um usuário
  acessa recurso de outro trocando o ID; a checagem de posse deve ficar no **Service**,
  não no Repository.
- **Fronteira de camadas na Clean Architecture**: validação de posse é regra de negócio
  (Service); Repository só executa acesso a dados com filtro por chave única.
- **Governança de documentação**: convenção de nomes/estrutura + índices tornam os docs
  consultáveis por metadado (mesmo princípio das *properties* do Obsidian). Diátaxis
  ajuda a classificar tipos de doc; ADR registra o "porquê" das decisões.

## Links e materiais

- Rastreabilidade de requisitos (ISO/IEC/IEEE 29148): https://www.iso.org/standard/72089.html
- IDOR (OWASP): https://owasp.org/www-community/attacks/Insecure_Direct_Object_Reference_Prevention_Cheat_Sheet
- Broken Access Control (OWASP Top 10 A01): https://owasp.org/Top10/A01_2021-Broken_Access_Control/
- Validação com Zod (`z.string().email`): https://zod.dev/
- JWT — boas práticas (RFC 8725): https://datatracker.ietf.org/doc/html/rfc8725
- Clean Architecture (Uncle Bob): https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html
- Diátaxis (tipos de documentação): https://diataxis.fr/
- Documenting Architecture Decisions (Nygard): https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions

## Próximos passos

Definidos nesta sessão (Carlos executa a lógica; IA revisa):
- Corrigir os 3 achados prioritários do code-review (Zod, auth nas rotas, IDOR).
- Tomar a decisão de escopo do MVP diante de RF001 e RF008 pendentes na véspera do prazo.
- Atualizar o `ROADMAP.md` para refletir o estado real (ou apontar para a matriz).
- Levar a seção "Aprendizados" para o Obsidian.

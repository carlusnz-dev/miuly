# Claude Code Project Guidelines - Miuly

Este arquivo fornece as instruções rápidas para a CLI do Claude Code no repositório **Miuly**.

---

## Comandos Principais (Backend)

- **Checagem de Tipos (TypeScript):** `npm --prefix backend run check`
- **Ambiente de Desenvolvimento:** `npm --prefix backend run dev`
- **Emissão de Contrato Prisma:** `npm --prefix backend run contract:emit`
- **Formatação de Código:** `npm --prefix backend run fmt`

---

## Governança e Regras do Projeto

- **Governança Principal:** Consulte [`AGENTS.md`](AGENTS.md) e [`docs/adr/0001-uso-de-llm-para-codificacao.md`](docs/adr/0001-uso-de-llm-para-codificacao.md).
- **Escopo de Alterações:** Implementações de código de produção devem ser previamente autorizadas e restritas ao escopo solicitado.
- **Git Flow:** Utilize `feature/<slug>` ou `fix/<slug>`. Commits devem seguir Conventional Commits: `tipo(modulo): descrição`.
- **Validação Obrigatoria:** Sempre execute `npm --prefix backend run check` antes de considerar uma tarefa concluída.

---

## Arquitetura & Padrões

- Consolidado em [`docs/architecture.md`](docs/architecture.md).
- Preserve a independência do domínio. Adaptadores Express e Prisma não devem vazar tipos para a camada central.
- DTOs devem utilizar tipos primitivos/nativos TS e schemas Zod para validação nas bordas HTTP.

---

## Integração com Antigravity (`agy-bridge`)

- Tarefas pesadas de varredura de código, revisões adversárias de segurança/arquitetura ou diagnósticos complexos podem ser delegadas ao Antigravity via MCP `agy-bridge`.
- Consulte `.agents/README.md` e `GEMINI.md` para entender as capacidades do workspace Antigravity.

---
description: Revisa código do backend do Miuly contra as convenções do projeto (Clean Architecture, segurança), sem reescrever a lógica de negócio.
argument-hint: [caminho ou módulo opcional, ex.: src/modules/financas]
allowed-tools: Read, Glob, Grep, Skill
---

Revise o código do backend em `backend/$ARGUMENTS` (se nenhum argumento for passado,
revise as mudanças pendentes no diff atual de `backend/`, via `git diff`).

Use a skill `revisar-modulo-backend` para aplicar o checklist de camadas
(Controller → Service → Repository), segurança e convenções do projeto.

Lembre-se das regras do `CLAUDE.md`:

- Carlos escreve a lógica de negócio na mão. Este comando **aponta falhas e faz
  perguntas** — não reescreve o código dele nem entrega a implementação corrigida,
  a menos que ele peça explicitamente depois de ver a revisão.
- Priorize, nesta ordem: violação de camada (Clean Architecture), segurança
  (OWASP: injeção, validação de entrada, autorização, exposição de dados sensíveis),
  edge cases não tratados, e só depois estilo/legibilidade.
- Responda em português, com achados ranqueados por severidade e caminho
  `arquivo:linha` para cada um.

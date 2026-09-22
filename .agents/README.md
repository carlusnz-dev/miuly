# Agentes locais

As regras de atuação estão no [`AGENTS.md`](../AGENTS.md). Skills reutilizáveis
ficam em `skills/<nome>/SKILL.md` e são carregadas conforme a natureza da tarefa.
Os agentes personalizados executáveis ficam em [`.codex/agents/`](../.codex/agents/),
conforme a convenção do Codex.

| Skill | Uso |
| --- | --- |
| `role-dev` | análise sênior de arquitetura e qualidade |
| `debug-code` | diagnóstico de falhas, duplicação e código morto |
| `documentation-requirements` | integridade entre mudanças, docs e requisitos |
| `pr-review` | revisão de PR orientada a risco e impacto |
| `security-review` | autenticação, privacidade e hardening |
| `lazy-mcp-validation` | UX econômica: DOM, JavaScript e captura de tela |

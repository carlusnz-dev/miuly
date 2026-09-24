# Estrutura do Workspace Antigravity & Agentes Locais

Este diretório contém a configuração completa de customizações, regras, skills e governança do **Antigravity** e dos agentes locais do repositório Miuly.

---

## 📁 Estrutura do Workspace

```text
.agents/
├── README.md                     # Documentação do workspace Antigravity e agentes
├── settings.json                 # Configurações globais do workspace Antigravity
├── rules/                        # Regras modulares carregadas pelo Antigravity
│   ├── 01-architecture-boundaries.md
│   ├── 02-git-and-commits.md
│   ├── 03-prisma-and-database.md
│   ├── 04-llm-governance.md
│   └── 05-m2m-communication.md
└── skills/                       # Skills reutilizáveis (progressively disclosed)
    ├── role-dev/
    ├── debug-code/
    ├── documentation-requirements/
    ├── pr-review/
    ├── security-review/
    ├── lazy-mcp-validation/
    ├── antigravity-orchestrator/
    └── clean-architecture-review/
```

Outros arquivos essenciais de agentes:
- **`AGENTS.md`**: Regras globais universais de governança (raiz).
- **`GEMINI.md`**: Instruções do desenvolvedor orquestrador Antigravity (raiz).
- **`CLAUDE.md`**: Guia para CLI do Claude Code (raiz).
- **`.codex/agents/`**: Agentes especializados em formato TOML para o Codex CLI.

---

## 🛠️ Skills Disponíveis

| Skill | Finalidade |
| --- | --- |
| `role-dev` | Análise sênior de arquitetura, qualidade e suporte ao desenvolvimento |
| `debug-code` | Diagnóstico de falhas, duplicação e código morto |
| `documentation-requirements` | Integridade entre mudanças, documentação e requisitos |
| `pr-review` | Revisão de PR orientada a risco, segurança e impacto |
| `security-review` | Autenticação, privacidade e hardening operacional |
| `lazy-mcp-validation` | Validação de UX econômica (DOM, JS, captura de tela) |
| `antigravity-orchestrator` | Orquestração sênior do Antigravity e pipelines de checagem |
| `clean-architecture-review` | Validação de limites arquiteturais, DTOs e serviços |

---

## 📋 Regras do Antigravity (`.agents/rules/`)

As regras são carregadas automaticamente pelo Antigravity ao navegar pelos arquivos e diretórios do projeto:

1. **01-architecture-boundaries.md**: Princípios de Clean Architecture e isolamento de domínio.
2. **02-git-and-commits.md**: Convenção de branches e Conventional Commits.
3. **03-prisma-and-database.md**: Governança do Prisma 8 ORM e comandos seguros de banco.
4. **04-llm-governance.md**: Limites de atuação de LLMs baseados no ADR 0001.
5. **05-m2m-communication.md**: Protocolo de resposta sintetizada para Claude Code via MCP `agy-bridge`.

---

## 🤝 Coexistência Multi-LLM (Antigravity + Claude Code + Codex)

- **Antigravity (AGY):** Atua como desenvolvedor sênior orquestrador e trabalhador de contexto pesado. Lê `GEMINI.md`, `.agents/settings.json`, `.agents/rules/*.md` e `.agents/skills/`.
- **Claude Code:** Interface leve de comando. Utiliza `CLAUDE.md` e delega análises profundas ao Antigravity via `agy-bridge`.
- **Codex:** Executa agentes especializados definidos em `.codex/agents/*.toml` (`project-reviewer` e `project-integrity`).

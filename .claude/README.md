# .claude/ — Miuly

Configuração do Claude Code para este projeto. Segue a convenção oficial da Anthropic
(`.claude/agents/`, `.claude/commands/`, `.claude/skills/`, `settings.json`) e existe
para dar suporte ao fluxo **"ensinar e revisar"** definido em `CLAUDE.md` na raiz do
projeto — não para gerar arquitetura ou lógica de negócio no lugar do Carlos.

## Estrutura

```
.claude/
├── README.md              este arquivo
├── settings.json           permissões de ferramentas (allow/ask) do Claude Code
├── agents/                  subagentes especializados, invocados via Task/Agent
│   ├── frontend-explorer.md    leitura do front-end (Next.js)
│   └── backend-explorer.md     leitura do back-end (Express/Prisma)
├── commands/                 comandos de barra (`/nome`)
│   └── revisar-backend.md      `/revisar-backend [caminho]` — review do backend
└── skills/                   skills invocadas automaticamente por contexto
    ├── criar-adr/               monta o esqueleto de um novo ADR
    ├── revisar-modulo-backend/  checklist de Clean Architecture + segurança
    ├── role-dev/                persona padrão de dev sênior didático
    └── salvar-relatorio/        registra um relatório de sessão em docs/relatorios/
```

## Subagentes (`agents/`)

Ambos são **somente leitura** (`tools: Read, Glob, Grep` — sem `Edit`/`Write`). Servem
para localizar e explicar código sem risco de o agente "corrigir" algo por conta
própria. Use quando precisar entender rápido onde um comportamento está implementado,
sem gastar contexto da conversa principal explorando arquivo por arquivo.

- **`frontend-explorer`** — estrutura do App Router, componentes, hooks, uso do
  Framer Motion.
- **`backend-explorer`** — em qual camada (controller/service/repository) uma regra
  vive, uso do Prisma, fluxo de uma rota até o banco.

## Comandos (`commands/`)

- **`/revisar-backend [caminho]`** — roda a skill `revisar-modulo-backend` sobre um
  módulo específico (ou sobre o diff pendente, se nenhum caminho for passado).
  Aponta violações de camada e segurança; não reescreve a lógica de negócio.

## Skills (`skills/`)

- **`criar-adr`** — dispara quando alguém pede pra registrar uma decisão
  arquitetural. Monta o arquivo a partir de `docs/adr/template.md`, acha o próximo
  número sequencial e atualiza o índice em `docs/adr/README.md`. Não inventa o
  conteúdo da decisão — isso é papel do Carlos como arquiteto.
- **`revisar-modulo-backend`** — dispara quando Carlos termina de escrever ou mudar
  um módulo do backend. Aplica um checklist de Clean Architecture e segurança,
  reporta achados com `arquivo:linha` e o porquê de cada um — nunca entrega correção
  pronta.
- **`role-dev`** — persona padrão de dev sênior didático para sessões de estudo/
  implementação. Lê os docs de contexto no início da sessão, ensina em vez de
  entregar pronto, e lembra Carlos de levar aprendizados para o Obsidian.
- **`salvar-relatorio`** — dispara quando Carlos pede pra registrar o que rolou numa
  sessão. Gera um markdown em `.claude/docs/relatorios/` com contexto, decisões e
  aprendizados — não é ADR (decisão de arquitetura), é memória de sessão.

## Por que essa separação (agentes vs. comandos vs. skills)

- **Agentes** = *quem* explora (isolam a busca do contexto principal, leitura pura).
- **Comandos** = *gatilho explícito* do usuário (`/revisar-backend`), bom para review
  sob demanda.
- **Skills** = *gatilho automático por contexto* — disparam quando a intenção do
  usuário casa com a descrição, sem precisar lembrar um comando específico.

## Manutenção

Ao editar ou criar novos agentes/comandos/skills, mantenha coerência com as regras de
`CLAUDE.md`: nada aqui deve gerar arquitetura do zero, gerar regra de negócio pronta,
ou pular a etapa de compreensão do Carlos sobre o que foi produzido.

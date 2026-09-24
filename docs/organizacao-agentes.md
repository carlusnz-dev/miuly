# Organização do projeto e dos agentes

Este documento explica como o Miuly é desenvolvido com mais de uma LLM ao mesmo
tempo: quem faz o quê, onde cada agente trabalha, como o código chega a `develop`
e como uma tarefa é delegada de um agente a outro. Ele complementa o
[`AGENTS.md`](../AGENTS.md), que continua sendo a fonte das regras de atuação.

Se você é um agente começando uma sessão, leia a seção
[Por onde começar](#por-onde-começar) antes de qualquer outra coisa.

---

## Papéis

| Quem | Ferramenta | Papel | Pode alterar |
| --- | --- | --- | --- |
| **Carlos** | — | Dono do produto e do repositório. Decide escopo, requisitos, segurança e o que entra em `develop`/`main`. | Tudo |
| **Claude** | Claude Code | LLM principal: arquitetura, codificação complexa, validação, debug, revisão e integração de PRs. Coordena e delega tarefas aos demais agentes. | Código, testes, docs e configuração de agentes, dentro do escopo pedido |
| **Codex** | Codex CLI | Desenvolvedor sênior fullstack: implementa funcionalidades e correções com escopo definido, com testes. | Código de produção, testes e docs diretamente ligados à mudança |
| **Gemini** | Antigravity CLI | Documentação: requisitos, critérios de aceite, ADRs, relatórios, `docs/` e `specs/`. Via `agy-bridge`, também faz análises e revisões adversárias **somente leitura** para o Claude. | `docs/`, `specs/`, `README.md` e arquivos de `.agents/`; **não** altera código de produção |

Regras que valem para todos, detalhadas no `AGENTS.md`:

- implementar só com pedido explícito e escopo claro (ADR 0001);
- migrações e comandos que leiam ou alterem o banco exigem autorização separada,
  incluindo `npm run dev`;
- revisão formal é somente leitura;
- não declarar sucesso sem executar a validação pertinente.

## Onde cada agente trabalha

Cada agente tem um **worktree fixo** no Orca e troca de **branch por tarefa**. O
worktree é o lugar de trabalho; a branch é a tarefa. Assim, dois agentes nunca
editam a mesma cópia do repositório.

| Agente | Worktree | Workspace no Orca |
| --- | --- | --- |
| Claude | `~/Documentos/Projetos/miuly` (repositório principal) | `feature/...` da tarefa corrente |
| Codex | `~/orca/workspaces/miuly/Dev-senior` | "Dev senior" |
| Gemini | `~/orca/workspaces/miuly/Documentação-do-projeto` | "Documentação do projeto" |

A branch que o Orca cria junto com o worktree (`carlusnz-dev/Dev-senior`,
`Documentação-do-projeto`) serve só de ponto de partida e **não é publicada**. Ao
receber uma tarefa, o agente cria a branch dela a partir de `develop`:

```bash
git fetch origin
git switch -c feature/<slug> origin/develop   # ou fix/<slug>
```

Não edite arquivos no worktree de outro agente. Se precisar do trabalho dele,
espere o PR ser integrado em `develop` e atualize a sua branch.

## Fluxo de uma mudança

1. Carlos define a tarefa, diretamente ou pedindo ao Claude que delegue.
2. O agente cria `feature/<slug>` ou `fix/<slug>` a partir de `origin/develop`.
3. Commits no formato exato `tipo(modulo): descrição`, em português.
4. Validação antes do PR, em `backend/`: `npm run check` e `npm test`. Para
   documentação, links relativos e consistência com o código.
5. O agente registra a sessão em `docs/relatorios/AAAA-MM-DD-<slug>.md`, no
   formato de [`relatorios/template.md`](relatorios/template.md).
6. PR para `develop`. O Claude revisa e valida; o merge acontece com autorização
   do Carlos, usando merge commit para preservar o histórico de cada agente.
7. `main` recebe apenas versões validadas de `develop`, com tag SemVer.

Mudança de comportamento, contrato, arquitetura ou segurança atualiza o documento
correspondente em `docs/` no mesmo PR.

## Por onde começar

Ordem de leitura para ganhar contexto no início de uma sessão:

1. [`AGENTS.md`](../AGENTS.md): regras de atuação.
2. Este documento: papéis, worktrees e fluxo.
3. O relatório mais recente em [`docs/relatorios/`](relatorios/): estado atual e
   pendências.
4. [`docs/architecture.md`](architecture.md) e o módulo de referência
   `backend/src/modules/users/`, antes de mexer em código.
5. [`docs/requirements.md`](requirements.md) e [`specs/`](../specs/README.md),
   antes de mexer em comportamento.
6. [`docs/data-model-review.md`](data-model-review.md), antes de tocar no
   contrato Prisma.

Arquivos de instrução por ferramenta:

| Ferramenta | Instruções | Skills e configuração |
| --- | --- | --- |
| Claude Code | `CLAUDE.md` (importa o `AGENTS.md`) | `.claude/skills/`, `.claude/commands/`, `.claude/settings.json` |
| Codex | `AGENTS.md` | `.agents/skills/`, `.codex/agents/`, `.codex/rules/` |
| Antigravity | `GEMINI.md` | `.agents/rules/`, `.agents/skills/`, `.agents/settings.json` |

## Delegação entre agentes

Existem dois canais, com usos diferentes.

### `agy-bridge` (MCP): consultas ao Gemini, sem alterar arquivos

O Claude chama o Antigravity em modo headless para ler arquivos grandes, fazer
buscas amplas no repositório, consultar documentação e fazer revisões adversárias.
Só a resposta volta; nada é editado. Ferramentas: `analyze_files`, `deep_search`,
`web_lookup`, `adversarial_review` e `follow_up`. O formato das respostas está em
`.agents/rules/05-m2m-communication.md`.

### Terminais do Orca: tarefas que alteram o repositório

Para tarefas que produzem commits, o Claude envia um briefing ao agente que já
está aberto no terminal do workspace dele, usando a CLI do Orca. Não é preciso
nenhum MCP adicional. Dentro de um terminal do Orca, o comando é `orca`; fora dele,
use `orca-ide`, porque `orca` pode ser o leitor de tela do GNOME.

```bash
# 1. Descobrir o terminal do agente (os handles mudam a cada reinício do Orca)
orca terminal list --json

# 2. Ver se o agente está ocioso antes de enviar
orca terminal read --terminal <handle> --json
orca terminal wait --terminal <handle> --for tui-idle --timeout-ms 60000 --json

# 3. Enviar o briefing e confirmar que o turno começou
orca terminal send --terminal <handle> --text "<briefing>" --enter --wait-submit 10 --json

# 4. Acompanhar e ler o resultado
orca terminal wait --terminal <handle> --for tui-idle --timeout-ms 600000 --json
orca terminal read --terminal <handle> --json
```

Só envie o briefing quando o `wait` retornar `satisfied: true`: texto digitado
enquanto a TUI ainda inicia é perdido. Nunca reenvie por falta de resposta; use
`--retry-request <id>` se o `send` falhar no transporte. Para tarefas com
dependências entre si, filas ou pedidos de aprovação, use `orca orchestration`
(skill `orchestration`) em vez de `terminal send`.

O briefing deve ser autossuficiente, porque o agente não vê a conversa do Claude:

```text
Tarefa: <o que fazer, em uma frase>
Branch: feature/<slug> a partir de origin/develop
Escopo: <arquivos ou módulos que podem ser alterados>; fora do escopo: <o que não tocar>
Contexto: <decisões já tomadas, links para docs/ e specs/>
Critério de pronto: <testes/validações que devem passar>
Banco de dados: não autorizado   (ou: autorizado para <comando>)
Entrega: commit(s) na branch e relatório em docs/relatorios/; não abrir PR / abrir PR para develop
```

Quem recebe trabalha só no próprio worktree, segue o `AGENTS.md` e, ao terminar,
deixa um resumo no terminal: branch, commits, validações e pendências. O Claude
revisa o resultado antes de qualquer PR ou merge.

### Rotinas delegáveis

A definir pelo Carlos. Registre aqui cada rotina aprovada, com o agente
responsável e o gatilho.

| Rotina | Agente | Gatilho | Observações |
| --- | --- | --- | --- |
| — | — | — | — |

## Pendências de organização

- `.agents/skills/` tem skills exclusivas do Antigravity (`antigravity-orchestrator`,
  `clean-architecture-review`) que não existem em `.claude/skills/`. Falta decidir
  se a regra de cópia idêntica passa a admitir skills por ferramenta.
- O worktree aninhado `Documentação-do-projeto/.worktrees/antigravity`
  (`feature/antigravity-workspace`) já foi integrado em `develop` pelo PR #2 e pode
  ser removido.
- `main` ainda está no commit inicial; a primeira promoção de `develop` depende de
  uma versão validada.

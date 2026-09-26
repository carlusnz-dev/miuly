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

O Claude trabalha diretamente no repositório principal (`~/Documentos/Projetos/miuly`).
Para o Codex e o Gemini (Antigravity), os worktrees no Orca são criados **por tarefa**
em `~/orca/workspaces/miuly/<slug>` (por exemplo: `remodelacao-front`,
`docs-remodelacao-front`), cada um com a branch da sua respectiva tarefa. Assim,
dois agentes nunca editam o mesmo worktree nem a mesma cópia do repositório.

| Agente | Local de trabalho | Descrição no Orca |
| --- | --- | --- |
| Claude | `~/Documentos/Projetos/miuly` (repositório principal) | Repositório base / branch da tarefa corrente |
| Codex | `~/orca/workspaces/miuly/<slug>` | Worktree isolado criado por tarefa de desenvolvimento |
| Gemini | `~/orca/workspaces/miuly/<slug>` | Worktree isolado criado por tarefa de documentação |

A branch que o Orca cria automaticamente junto com o worktree (por exemplo
`carlusnz-dev/<slug>`) serve apenas de ponto de partida e **não é publicada**. Ao
receber uma tarefa, o agente garante que sua branch de trabalho foi criada a
partir de `origin/develop`:

```bash
git switch -c feature/<slug> origin/develop   # ou fix/<slug>
```

Os terminais dos agentes não têm a chave SSH do GitHub carregada: `git fetch` e
`git push` por SSH falham com `Permission denied (publickey)`, e o Antigravity
chega a travar esperando o `fetch`. Por isso, os agentes usam o `origin/develop`
local e não fazem `fetch` nem `push`. Antes de delegar, o Claude atualiza as refs
por HTTPS com a credencial do `gh`; push e PR também ficam com ele:

```bash
git -c url."https://github.com/".insteadOf=git@github.com: \
  -c credential.helper= -c credential.helper='!gh auth git-credential' fetch origin
```

As refs `origin/*` são compartilhadas por todos os worktrees. Um `fetch` durante
uma tarefa move o `origin/develop` que o agente usou como base; isso não é motivo
para `git reset` na branch da tarefa.

**Exceção de empilhamento:** como exceção possível (e não como regra), uma branch
de documentação pode ser criada tendo como base uma branch de funcionalidade ainda
não integrada em `develop`, caso a documentação dependa diretamente das mudanças
dessa funcionalidade (como ocorreu no PR #9, cuja base foi `feature/remodelacao-front`).
Essa dependência deve ser explicitada no briefing da tarefa.

Não edite arquivos no worktree de outro agente. Se precisar do trabalho dele, a
regra é esperar o PR ser integrado em `develop` e atualizar a sua branch.

Como recomendação (e não regra aprovada), sugere-se que o worktree da tarefa seja
removido no Orca após a conclusão e o merge do PR correspondente em `develop`,
mantendo o ambiente limpo.

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

Para tarefas que produzem commits, o Claude cria um worktree por tarefa no Orca
e delega ao respectivo agente via CLI do Orca. Não é preciso nenhum MCP adicional.
Dentro de um terminal do Orca, o comando é `orca`; fora dele, use `orca-ide`,
porque `orca` pode ser o leitor de tela do GNOME.

O fluxo de delegação varia de acordo com o agente:

#### Delegação para o Codex

O Claude pode criar o worktree e já inicializar o Codex com o briefing em um único comando:

```bash
orca-ide worktree create --name <slug> --base-branch origin/develop --agent codex --prompt "<briefing>" --json
```

#### Delegação para o Antigravity (Gemini)

Para o Antigravity, o Claude cria o worktree e abre o terminal executando `agy`. Em seguida, aguarda a inicialização da TUI e envia o briefing:

```bash
# 1. Cria o worktree da tarefa a partir de develop
orca-ide worktree create --name <slug> --base-branch origin/develop --json

# 2. Cria o terminal com o Antigravity no worktree
# (o <handle> do terminal é retornado no JSON de saída do terminal create)
orca-ide terminal create --worktree <id> --command agy --json

# 3. Aguarda a TUI inicializar e ficar ociosa
orca-ide terminal wait --terminal <handle> --for tui-idle --timeout-ms 60000 --json

# 4. Envia o briefing e confirma que o turno começou
orca-ide terminal send --terminal <handle> --text "<briefing>" --enter --wait-submit 10 --json

# 5. Acompanha a execução e lê o resultado
orca-ide terminal wait --terminal <handle> --for tui-idle --timeout-ms 600000 --json
orca-ide terminal read --terminal <handle> --json
```

O `<handle>` do terminal vem do comando de criação (`terminal create`) ou da listagem (`terminal list`, caso o terminal já esteja aberto ou o Orca tenha sido reiniciado).

Num worktree novo, o `agy` pergunta primeiro se a pasta é confiável; o `wait`
volta com `blockedReason: "agent-trust-workspace"`. Confirme com
`terminal send --terminal <handle> --enter` e repita o `wait`. Sem `--agent`, o
`worktree create` também abre um shell vazio; ele pode ficar ou ser fechado depois
de conferido.

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
- `main` ainda está no commit inicial; a primeira promoção de `develop` depende de
  uma versão validada.

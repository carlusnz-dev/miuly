---
description: Gera o relatório da sessão atual em docs/relatorios/ seguindo o template do projeto
argument-hint: "[slug-do-relatorio] [observações]"
allowed-tools: Bash(git status:*), Bash(git branch:*), Bash(git log:*), Bash(git diff:*), Bash(git config:*), Bash(date:*), Bash(ls:*), Read, Write, Edit
---

## Contexto coletado

- Data: !`date '+%Y-%m-%d %H:%M:%S %z'`
- Autor: !`git config user.name`
- E-mail: !`git config user.email`
- Branch: !`git branch --show-current`
- Worktree: !`git status --short`
- Commits recentes: !`git log --oneline -15`
- Relatórios existentes: !`ls docs/relatorios/`

## Template obrigatório

@docs/relatorios/template.md

## Tarefa

Escreva o relatório **desta sessão do Claude Code** em
`docs/relatorios/AAAA-MM-DD-<slug>.md`, seguindo o template acima seção por seção.
Argumentos do usuário: $ARGUMENTS (o primeiro termo, se houver, é o slug;
sem slug, derive um curto em kebab-case do título).

Regras:

1. **LLM:** `Claude Code`. **Modelo:** o nome e o ID do modelo em execução.
   **Reasoning effort:** o nível definido por `/effort` nesta conversa, se tiver
   aparecido; caso contrário, `não disponibilizado ao agente nesta execução`.
2. Relate só o que foi feito nesta conversa. Commits, arquivos e relatórios de
   outras ferramentas (Codex, Agy) ou do usuário entram em "Limitações e
   pendências" como trabalho paralelo preservado, sem assumir a autoria.
3. Liste em "Commits criados" apenas hashes de commits feitos nesta sessão; sem
   commits, escreva **Nenhum commit criado.**
4. Validações: só comandos realmente executados na conversa, com o resultado
   observado. Declare de forma explícita se houve migração ou comando contra o banco.
5. Se já existir relatório com o mesmo nome, mostre a diferença e pergunte antes
   de sobrescrever.
6. Não faça commit do relatório; ao final, informe o caminho e sugira a mensagem
   `docs(relatorios): registra sessão de <assunto>`.

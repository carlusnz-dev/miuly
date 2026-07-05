---
name: salvar-relatorio
description: Use quando Carlos pedir para salvar/gerar um relatório da sessão — frases como "salva um relatório dessa sessão", "gera um relatório do que vimos", "documenta essa sessão de estudo". Cria um markdown em .claude/docs/relatorios/ resumindo contexto, decisões e aprendizados da conversa, para consulta futura e para alimentar as notas do Obsidian.
---

Esta skill registra o que aconteceu em uma sessão de trabalho/estudo — não é um ADR
(decisão de arquitetura) nem um comentário de code review. É a memória de curto prazo
da sessão, para Carlos revisar depois ou colar no Obsidian.

## Passos

1. Rode `ls .claude/docs/relatorios/` para ver relatórios existentes e evitar
   duplicar nome de arquivo no mesmo dia.
2. Monte o nome do arquivo como `YYYY-MM-DD-titulo-curto-em-kebab-case.md`, usando a
   data atual e um título curto que resuma o assunto principal da sessão (ex.:
   `2026-07-04-inicio-backend-mvp.md`).
3. Preencha o relatório com base **apenas no que foi de fato discutido/decidido na
   conversa** — não invente aprendizados ou próximos passos que não vieram do
   usuário ou da própria sessão. Estrutura do arquivo:

```markdown
# Relatório de sessão — {{data}}

## Contexto
{{Por que essa sessão aconteceu — o que Carlos pediu/trouxe como objetivo}}

## Tópicos abordados
{{Lista do que foi explicado/discutido, em ordem}}

## Decisões e recomendações
{{O que foi decidido ou recomendado — deixe claro o que é decisão do Carlos vs.
sugestão da IA a ser validada por ele}}

## Aprendizados
{{Conceitos novos ou revisados nesta sessão — pensados para virar nota no Obsidian}}

## Links e materiais
{{Um link por aprendizado/tópico técnico citado (doc oficial, MDN, OWASP, RFC,
etc.). Se um aprendizado foi discutido mas nenhum link foi citado na conversa,
busque a referência oficial equivalente antes de salvar — não deixe a seção
vazia nem com "não citado".}}

## Próximos passos
{{Ações concretas que Carlos definiu fazer a seguir}}
```

4. Salve o arquivo em `.claude/docs/relatorios/`.
5. Avise o caminho do arquivo criado e lembre Carlos (regra da persona `role-dev`)
   de levar a seção "Aprendizados" para o Obsidian.

## Nota sobre links (desde 2026-07-05)

A partir da sessão de 2026-07-05, todo relatório passou a levar uma seção
"Links e materiais" com uma referência por aprendizado citado. Relatórios
anteriores a essa data foram complementados retroativamente com essa mesma
seção. Ao revisar/atualizar um relatório antigo, mantenha esse padrão.

---
name: criar-adr
description: Use quando o usuário quiser registrar uma decisão arquitetural do Miuly como ADR — frases como "cria um ADR", "registra essa decisão", "documenta essa escolha de arquitetura". Cria o arquivo em docs/adr/ a partir do template e atualiza o índice em docs/adr/README.md.
---

Esta skill só monta o **esqueleto** do ADR. O conteúdo (Contexto, Decisão, Alternativas,
Consequências) é decisão arquitetural de Carlos — ver `CLAUDE.md`: "Carlos é o
Arquiteto". Não invente o raciocínio da decisão por ele; ajude a estruturar o que ele
já decidiu, e faça perguntas se o contexto/decisão passado for vago demais para
preencher um ADR completo.

## Passos

1. Liste `docs/adr/*.md` (exceto `template.md` e `README.md`) para achar o maior `NNNN`
   já usado. O novo ADR usa o próximo número sequencial, com zero à esquerda
   (ex.: se o maior for `0001`, o novo é `0002`).
2. Peça ao usuário (se ainda não tiver dito): título curto da decisão, status inicial
   (normalmente **Proposto**), data, e quem decidiu.
3. Copie `docs/adr/template.md` para `docs/adr/NNNN-titulo-curto-em-kebab-case.md`,
   preenchendo o cabeçalho (Status/Data/Decisores). Preencha Contexto/Decisão/
   Alternativas/Consequências apenas com o que o usuário já forneceu — não complete
   com suposições seus. Se faltar informação, deixe marcado ou pergunte.
4. Atualize a tabela de índice em `docs/adr/README.md`, adicionando uma linha nova
   (mantendo a ordem por `NNNN`) com link para o arquivo criado.
5. Avise o usuário do caminho do arquivo criado e lembre que ADRs **aceitos são
   imutáveis** — mudanças futuras viram um novo ADR que substitui este.

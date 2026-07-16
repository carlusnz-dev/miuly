---
name: salvar-relatorio
description: Salva um relatório da sessão em docs/relatorios usando o template padrão. Use quando o usuário pedir para gerar um relatório ou registrar a sessão.
---

# Salvar Relatório de Sessão

**Objetivo:** Gerar um relatório documentando o que foi feito na sessão e salvá-lo na pasta `docs/relatorios/` seguindo o template oficial.

## Instruções

1. Ao receber a solicitação de salvar um relatório, crie um arquivo Markdown em `docs/relatorios/` com o nome no formato `YYYY-MM-DD-tema-da-sessao.md`.
2. O conteúdo DEVE seguir exatamente a estrutura abaixo:

```markdown
# [Título autoexplicativo]
--- Cabeçalho ---
Autor: [Carlos e Agy / Claude Code]
Data: [Data atual ISO]
Módulos: [Módulos afetados]
Atividade: [Nome da atividade realizada]

# Corpo

[Resumo da sessão, decisões tomadas, aprendizados e impactos no sistema. Formato livre.]
```

3. Preencha o corpo com as principais decisões arquiteturais, problemas resolvidos e tarefas implementadas. Não inclua código extenso, apenas aprendizados conceituais ou lógicos se houver.
4. Salve usando a tool `write_to_file`.

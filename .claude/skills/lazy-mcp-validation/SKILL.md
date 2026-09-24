---
name: lazy-mcp-validation
description: Validar UX do Miuly com baixo consumo de contexto via MCP, seguindo progressivamente DOM, JavaScript e captura de tela.
---

# Validação MCP Econômica

Siga a sequência obrigatória e pare assim que houver evidência suficiente:

1. **DOM:** inspecione estrutura, texto, roles, labels, estados e alvos relevantes.
2. **JavaScript:** execute somente a interação ou consulta necessária para validar
   comportamento, foco, navegação, rede ou estado que o DOM não resolveu.
3. **Captura de tela:** use apenas para questões realmente visuais, como layout,
   sobreposição, contraste aparente ou responsividade.

Não capture a tela por hábito e não despeje o DOM completo. Restrinja cada coleta
ao componente/cenário em análise. Registre viewport, estado inicial, ação, resultado
esperado e observado. Esta skill valida UX; não autoriza editar frontend/backend.

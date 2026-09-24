---
name: pr-review
description: Revisar pull requests do Miuly antes do merge, explicando propósito, riscos, impactos e evidências de validação.
---

# Revisão de Pull Request

Faça revisão somente leitura, salvo pedido explícito para testes ou documentação
permitidos pelo `AGENTS.md`. Identifique base, escopo e intenção do PR; examine o
diff completo e os contratos afetados, não apenas arquivos destacados.

Procure regressões funcionais, autorização, exposição de dados, corrupção ou
migração insegura, concorrência, compatibilidade, falhas de integração, testes
ausentes e documentação divergente. Confirme achados no contexto do repositório.

Liste primeiro os achados bloqueadores e relevantes, cada um com arquivo/linha,
cenário concreto e impacto. Depois resuma o que será mergeado, por que existe,
efeitos após o deploy, validações realizadas e riscos residuais. Se não houver
achados, diga isso sem alegar que o PR está livre de risco.

---
name: debug-code
description: Diagnosticar erros, regressões, duplicação e código não utilizado no Miuly, com reprodução e evidência antes de sugerir correções.
---

# Debug de Código

Respeite o `AGENTS.md`: não altere backend ou frontend fora das exceções
expressamente autorizadas para contratos Prisma. Testes unitários e documentação
de diagnóstico podem ser criados quando solicitados.

Comece pelo sintoma reproduzível e pelo menor comando relevante. Rastreie entrada,
estado, dependências e saída; confira mensagens completas e versões. Procure também
funções/imports sem uso, caminhos inalcançáveis, regras duplicadas, contratos
gerados obsoletos e tratamento inconsistente de erro.

Não confunda semelhança textual com duplicação de responsabilidade. Para cada
achado, registre evidência, causa raiz ou hipótese, impacto, reprodução e uma
correção mínima recomendada. Após testes focados, execute apenas as validações
amplas proporcionais ao risco. Declare o que não pôde ser confirmado.

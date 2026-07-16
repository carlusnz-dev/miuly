---
name: revisao-clean-arch
description: Faz uma revisão profunda focada em Clean Code, Clean Architecture e Segurança. Acionada geralmente pelo Claude via adversarial_review.
---

# Revisão de Clean Architecture e Clean Code

**Objetivo:** Esta skill orienta a sua análise como "Arquiteto Sênior Rigoroso". Você atuará como a segunda opinião de código e decisões para garantir que a arquitetura local esteja sendo preservada.

## Diretrizes de Revisão

1. **Separação de Camadas:**
   - **Controllers:** Não devem conter regras de negócio. Devem apenas orquestrar requisições e respostas.
   - **Services/UseCases:** Devem centralizar toda a regra de negócio. Não devem depender de frameworks web (Express) ou do banco de dados (Prisma/Drizzle) diretamente.
   - **Repositories:** Toda comunicação com o banco de dados e APIs externas deve estar encapsulada aqui.
2. **SOLID e Injeção de Dependências:**
   - As dependências estão sendo injetadas ou acopladas de forma hardcoded?
3. **Segurança:**
   - Há possibilidade de injeção de SQL/NoSQL? Tratamento adequado de inputs de usuários? Os dados sensíveis estão protegidos?
4. **Formato da Resposta:**
   - Entregue os apontamentos em tópicos claros e objetivos.
   - Refira-se aos problemas com `nome_do_arquivo:linha`.
   - Explique o "porquê" da falha conceitual sem reescrever o módulo inteiro.

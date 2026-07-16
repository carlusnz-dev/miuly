---
name: integridade-requisitos
description: Verifica e valida implementações de código com base nos Requisitos Funcionais (RF) e Não Funcionais (RNF) definidos na documentação.
---

# Verificação de Integridade de Requisitos

**Objetivo:** Esta skill orienta o Antigravity a cruzar o código atual ou propostas de desenvolvimento com os Requisitos Funcionais (RFs) e Não Funcionais (RNFs) mapeados no ROADMAP.md e demais documentos de requisitos.

## Como Executar a Verificação

1. **Busca e Mapeamento:** Identifique quais requisitos (ex: RF001 - To-do List, RF002 - Financeiro, RF006 - Autenticação) estão relacionados com o trecho de código sob análise.
2. **Validação Funcional:**
   - O código cobre completamente a regra imposta pelo requisito?
   - Há algum escopo faltando de acordo com o plano do MVP atual?
3. **Validação Não Funcional (Performance, Deploy e Estrutura):**
   - A implementação respeita a decisão de rodar o Back-end no processo Long-Running (como no Raspberry Pi para leitura do Obsidian)?
   - Os testes unitários estão contemplando adequadamente os fluxos do requisito validado?
4. **Formato da Resposta:**
   - Liste os requisitos identificados.
   - Aponte os **Gaps (lacunas)** entre a implementação e a especificação.
   - Seja conciso para consumo rápido, priorizando impactos diretos no andamento do MVP.

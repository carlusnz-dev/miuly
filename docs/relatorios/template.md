# Modelo de Relatório de Sessão / Execução por LLM

Este arquivo é o modelo oficial (`template.md`) que define a estrutura padrão para a geração de relatórios de sessão e tarefas executadas por agentes LLM ou desenvolvedores no projeto **Miuly**.

---

## Metadata da Sessão

| Campo | Valor |
| --- | --- |
| **Título** | [Título Resumido da Sessão / Funcionalidade Executada] |
| **Data** | AAAA-MM-DD HH:MM:SS -03 |
| **Autor** | [Nome do Agente ou Desenvolvedor] |
| **LLM Utilizada** | [Nome da LLM / Provedor ou N/A] |
| **Modelo** | [Nome Exato do Modelo ou N/A] |
| **Reasoning Effort** | [Alto \| Médio \| Baixo \| N/A] |
| **Branch de Trabalho** | `[nome-da-branch]` |

---

## 1. Resumo Executivo

Apresente um resumo conciso do objetivo principal da sessão, o contexto da demanda, as decisões de alto nível tomadas e o resultado final alcançado.

---

## 2. Detalhamento das Alterações Realizadas

Descreva minuciosamente as alterações efetuadas nos arquivos do projeto, organizando por categorias (código de produção, contratos, testes, documentação, configurações de agentes).

### Commits Criados
- `[hash]` — `tipo(modulo): descrição do commit`
- `[hash]` — `tipo(modulo): descrição do commit`

### Validações Executadas
- `[comando 1]`: [resultado e evidência obtida];
- `[comando 2]`: [resultado e evidência obtida];

---

## 3. Observações, Riscos e Próximos Passos

- **Riscos Residuais:** [Identificação de riscos ou pontos de atenção não completamente mitigados nesta sessão]
- **Pendências:** [Decisões arquiteturais ou funcionais pendentes de aprovação humana]
- **Próximos Passos:** [Recomendações técnicas para as próximas tarefas do projeto]

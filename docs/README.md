# Documentação do Projeto Miuly

Este diretório é a fonte de contexto técnico e funcional do **Miuly**. Toda mudança que altere comportamento, contrato, arquitetura, segurança ou operação deve atualizar o documento correspondente no mesmo commit.

---

## Índice Técnico

- **[Organização dos Agentes](organizacao-agentes.md):** papéis das LLMs, worktrees do Orca, fluxo de PR e delegação. Comece por aqui.
- **[Arquitetura](architecture.md):** limites, dependências, injeção e isolamento de camadas.
- **[Arquitetura do Frontend](frontend-architecture.md):** estrutura Angular, roteamento, Sass e limite com a API.
- **[Requisitos](requirements.md):** Requisitos Funcionais (`RF-xxx`) e Não-Funcionais (`RNF-xxx`) padronizados.
- **[Modelo de Dados](data-model-review.md):** diagnóstico do contrato Prisma 8 e desenho dos domínios.
- **[Contribuição e Versionamento](contributing.md):** branches, Conventional Commits e releases.
- **[Decisões Arquiteturais (ADRs)](adr/):** histórico de decisões aceitas ou substituídas ([Modelo de ADR](adr/template.md)).
- **[Relatórios de Sessões](relatorios/):** registros de execuções efetuadas por LLMs e desenvolvedores ([Modelo de Relatório](relatorios/template.md)).

As especificações verificáveis por testes ficam em [`specs/`](../specs/README.md). Quando a documentação e a implementação divergirem, registre a divergência explicitamente; não descreva funcionalidade planejada como se estivesse disponível.

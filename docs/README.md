# Documentação

Este diretório é a fonte de contexto técnico e funcional do Miuly. Toda mudança
que altere comportamento, contrato, arquitetura, segurança ou operação deve
atualizar o documento correspondente no mesmo commit.

## Índice

- [Arquitetura](architecture.md): limites, dependências e integrações.
- [Requisitos](requirements.md): escopo funcional e critérios de aceite.
- [Modelo de dados](data-model-review.md): diagnóstico do contrato Prisma e
  desenho recomendado para os novos domínios.
- [Contribuição](contributing.md): branches, commits, revisão e releases.

As especificações verificáveis ficam em [`specs/`](../specs/README.md). Quando
documentação e implementação divergirem, registre a divergência explicitamente;
não descreva funcionalidade planejada como se estivesse disponível.

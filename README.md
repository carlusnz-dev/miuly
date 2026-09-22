# Miuly

Plataforma pessoal para centralizar organização financeira, tarefas e eventos,
com integrações a serviços como Google Calendar e Gmail.

## Estado atual

O projeto está em fase de fundação. O backend Express e o contrato de dados com
Prisma ORM 8 RC estão sendo estruturados; a SPA Angular ainda não está presente
neste repositório. Consulte a [revisão do modelo de dados](docs/data-model-review.md)
antes de criar migrações.

## Módulos

| Módulo | Responsabilidade | Estado |
| --- | --- | --- |
| `backend/` | API Express, regras de aplicação, integrações e persistência | Em desenvolvimento |
| `frontend/` | SPA Angular para finanças e organização pessoal | Planejado |
| `docs/` | Arquitetura, requisitos e decisões técnicas | Ativo |
| `specs/` | Critérios verificáveis e contratos funcionais | Ativo |
| `infra/` | Ambientes, observabilidade e implantação | Reservado |
| `.agents/` | Skills e regras locais dos agentes Codex | Ativo |
| `.codex/agents/` | Agentes especializados de revisão e integridade | Ativo |

## Arquitetura pretendida

As dependências devem apontar para dentro: domínio e casos de uso não dependem
de Express, Prisma, Google ou Angular. Adaptadores traduzem HTTP, banco de dados
e APIs externas para contratos da aplicação. Tokens OAuth e detalhes dos
provedores nunca pertencem às entidades centrais.

## Documentação

- [Índice técnico](docs/README.md)
- [Arquitetura e limites](docs/architecture.md)
- [Requisitos de produto](docs/requirements.md)
- [Revisão do modelo Prisma](docs/data-model-review.md)
- [Fluxo Git e releases](docs/contributing.md)
- [Especificações](specs/README.md)

## Desenvolvimento

O backend requer Node.js, npm e PostgreSQL 15 ou superior. Os comandos e as
variáveis de ambiente estão descritos em [backend/README.md](backend/README.md).

Antes de integrar uma mudança, execute as validações aplicáveis e mantenha os
documentos afetados no mesmo commit. Agentes automatizados obedecem ao
[`AGENTS.md`](AGENTS.md): revisam, diagnosticam, testam e documentam, mas não
implementam código de produto do backend ou frontend.

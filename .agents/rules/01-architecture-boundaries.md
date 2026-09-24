# Regra 01: Limites Arquiteturais (Clean Architecture)

- **Direção de Dependência:** Entidades de domínio e casos de uso de aplicação são o núcleo do sistema. Eles **nunca** dependem de frameworks externos (Express, Prisma ORM, Google API Client, Angular).
- **Tradução na Borda:**
  - Controllers Express traduzem requisições HTTP para DTOs de aplicação usando schemas Zod.
  - Repositórios adaptadores convertem registros do Prisma ORM em entidades puras de domínio.
  - Tipos gerados do Prisma ORM nunca são expostos como resposta HTTP ou parâmetros de caso de uso.
- **Estrutura por Módulo:**
  - Cada módulo HTTP deve se organizar em `contract.ts`, `repository.ts`, `service.ts`, `controller.ts`, `routes.ts` e `index.ts`.
  - Injeção de dependência explícita via construtor com getters protegidos nas classes-base de `core/base`.

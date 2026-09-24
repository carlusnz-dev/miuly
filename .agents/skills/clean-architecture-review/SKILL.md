---
name: clean-architecture-review
description: Validar isolamento de domínio, conversão de DTOs, abstração de repositórios e conformidade com a Clean Architecture no Miuly.
---

# Revisão de Clean Architecture

Valide a adesão do código do Miuly aos princípios de Clean Architecture definidos em `docs/architecture.md`.

## Checklists de Validação

1. **Camada de Domínio (`domain`):**
   - [ ] Não importa Express (`Request`, `Response`, `NextFunction`).
   - [ ] Não importa Prisma Client ou tipos do schema ORM.
   - [ ] Não possui dependências de bibliotecas de infraestrutura externa (Google APIs).

2. **Camada de Aplicação (`services`):**
   - [ ] Herda de `BaseService` de `core/base/service.ts`.
   - [ ] Concentra a orquestração dos casos de uso do módulo.
   - [ ] Recebe abstrações de repositórios via injeção no construtor.

3. **Camada de Adaptadores (`controllers`, `repositories`):**
   - [ ] Handlers de controllers convertem entradas via Zod schemas e capturam erros de domínio.
   - [ ] Repositórios traduzem entidades do Prisma para entidades de domínio antes de retornar aos serviços.

4. **Composition Root (`index.ts`):**
   - [ ] Instancia concretamente repositories, serviços, controllers e rotas, vinculando as dependências.

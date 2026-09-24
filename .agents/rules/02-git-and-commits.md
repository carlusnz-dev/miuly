# Regra 02: Governança de Git e Commits

- **Estratégia de Branches:**
  - Branches protegidas: `main` e `develop`. Nunca realizar commits diretos nestas branches.
  - Branches de trabalho: `feature/<slug>` para novas capacidades autorizadas e `fix/<slug>` para correções de bugs.
- **Conventional Commits:**
  - Formato obrigatório: `tipo(modulo): descrição em português`.
  - Tipos permitidos: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `build`, `ci`.
  - Exemplos: `feat(finance): adiciona filtro de categoria`, `fix(auth): trata token expirado no middleware`.
- **Higiene:**
  - Mantenha commits atômicos. Alterações no código, testes e documentação afetados devem estar no mesmo commit.

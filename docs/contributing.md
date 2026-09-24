# Contribuição e versionamento

## Branches

- `main`: versões estáveis e publicáveis;
- `develop`: integração das próximas versões;
- `feature/<descricao-curta>`: nova capacidade, criada a partir de `develop`;
- `fix/<descricao-curta>`: correção comum, criada a partir de `develop`.

Correções urgentes em produção devem ter fluxo acordado antes de partir de
`main`. Evite commits diretos nas branches permanentes.

## Commits

Use Conventional Commits no formato obrigatório:

```text
tipo(modulo): descrição
```

Tipos usuais: `feat`, `fix`, `docs`, `test`, `refactor`, `perf`, `build`, `ci`
e `chore`. Exemplos: `feat(finance): validar moeda do lançamento` e
`docs(calendar): registrar política de conflitos`.

## Pull requests

O PR deve explicar problema, solução, impactos, riscos, validações executadas,
mudanças de contrato e documentação afetada. A revisão verifica primeiro erros,
regressões, segurança, dados e testes; resumo estilístico não substitui achados.

## Tags e releases

Versões publicadas a partir de `main` seguem Semantic Versioning (`MAJOR.MINOR.PATCH`)
e recebem tag anotada `vX.Y.Z`. Cada release lista mudanças, migrações, riscos de
rollback e incompatibilidades. Não mova nem reutilize tags publicadas.

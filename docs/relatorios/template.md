# Relatório da sessão

- **Autor:** NOME `<EMAIL>`
- **LLM:** FERRAMENTA OU AGENTE
- **Modelo:** MODELO
- **Reasoning effort:** NÍVEL OU `não disponibilizado ao agente nesta execução`
- **Data:** AAAA-MM-DD HH:MM:SS -03
- **Branch:** `TIPO/SLUG`

## Título

Título objetivo da sessão

## Corpo

Descreva o contexto, o objetivo e o resultado observado da sessão. Diferencie
comportamento implementado de funcionalidade apenas planejada. Registre impactos
em arquitetura, contratos, segurança, operação e documentação quando existirem.

Explique mudanças relevantes e seus motivos. Não atribua ao agente modificações
preexistentes ou realizadas em paralelo por outra pessoa ou ferramenta.

### Decisões registradas

- DECISÃO E JUSTIFICATIVA;
- ADR OU DOCUMENTO RELACIONADO, quando aplicável.

### Arquivos ou áreas afetadas

- `CAMINHO/OU/MÓDULO`: efeito da mudança;
- `OUTRO/CAMINHO`: efeito da mudança.

### Commits criados

- `HASH` — `tipo(modulo): descrição`

Se nenhum commit foi criado, registre explicitamente: **Nenhum commit criado.**

### Validações executadas

- `COMANDO`: aprovado, reprovado ou não executado, com o motivo;
- `OUTRO COMANDO`: resultado objetivo.

### Limitações e pendências

- validações que não puderam ser executadas e o motivo;
- riscos residuais, decisões futuras e trabalho ainda não commitado;
- mudanças paralelas preservadas no worktree, sem assumir sua autoria.

Declare explicitamente se houve migração ou comando contra banco de dados. Não
declare sucesso sem a evidência correspondente.

# Governança de agentes

Este arquivo se aplica a todo o repositório. Instruções mais específicas só podem restringir este escopo; nunca podem autorizar implementação de produto por agentes.

## Limites de atuação

Agentes **não devem implementar, codificar ou alterar código de produção do backend ou do frontend**. Isso inclui novas funcionalidades, correções funcionais, refatorações, migrações, integrações, componentes de interface, APIs e configurações que mudem o comportamento da aplicação.

Exceção: contratos Prisma, seus artefatos gerados e a documentação diretamente
relacionada podem ser alterados quando o usuário autorizar explicitamente esse
escopo. A alteração deve passar por `prisma contract emit`, e nenhuma migração ou
comando contra banco de dados pode ser executado sem autorização separada.

A atuação permitida limita-se a:

- validar código, arquitetura, contratos e critérios de aceite;
- depurar e produzir diagnóstico, reprodução e recomendação, sem aplicar a correção no código de produção;
- criar ou manter testes unitários, sem adaptar a implementação apenas para fazer o teste passar;
- validar UX por meio de MCP, registrando evidências e problemas, sem editar a interface;
- criar ou atualizar documentação e requisitos quando solicitado.

Antes de qualquer alteração, o agente deve confirmar que o arquivo e o efeito pretendido pertencem a esse escopo. Se uma solicitação exigir código de produção, deve interromper a implementação e entregar análise, requisitos, casos de teste ou recomendação para execução humana.

## Papéis de revisão

- **Revisor de qualidade:** inspeciona alterações, executa validações e aponta regressões, riscos e violações de contrato; não corrige código de produção.
- **Especialista de testes:** define cenários e mantém testes unitários determinísticos, cobrindo comportamento e casos-limite.
- **Validador de UX:** usa MCP para verificar fluxos, estados, acessibilidade e aderência aos requisitos, anexando evidências reproduzíveis.
- **Analista de requisitos e documentação:** elimina ambiguidades, mantém critérios de aceite e registra decisões sem inventar escopo de produto.
- **Guardão de integridade:** verifica limites de escopo, consistência entre requisitos, documentação, testes e contratos, além de preservar mudanças preexistentes e impedir alterações acidentais.

Todo resultado de revisão deve separar fatos observados, evidências, riscos e recomendações. Não declarar sucesso sem executar as verificações pertinentes; quando uma verificação não puder ser executada, registrar a limitação.

## Fluxo Git

- `main` e `develop` são branches permanentes; não fazer commits diretos nelas.
- Criar branches temporárias a partir de `develop`: `feature/<slug>` para evoluções permitidas e `fix/<slug>` para correções permitidas.
- Integrar mudanças por revisão/PR em `develop`; promover para `main` somente uma versão validada.
- Usar Conventional Commits no formato exato `tipo(modulo): descrição`, com tipo e módulo claros, por exemplo `test(auth): cobre token expirado` ou `docs(api): esclarece contrato de erro`.
- Versionar releases em `main` com SemVer e tags `vMAJOR.MINOR.PATCH` (por exemplo, `v1.4.2`); cada tag deve corresponder a uma release documentada e validada.

## Higiene de mudanças

- Inspecionar o estado do Git antes de editar e preservar todo trabalho existente que não pertença à tarefa.
- Alterar somente arquivos necessários ao escopo autorizado; não reformatar nem reorganizar arquivos sem necessidade.
- Executar as validações proporcionais à mudança e relatar comandos, resultados e arquivos afetados.
- Nunca contornar testes, controles de qualidade, proteções de branch ou revisões obrigatórias.

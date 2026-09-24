# Governança de agentes

Este arquivo se aplica a todo o repositório. Instruções mais específicas podem
restringir este escopo para tarefas ou papéis especializados.

## Limites de atuação

Agentes podem implementar, codificar e alterar código de produção do backend e
do frontend quando o usuário solicitar explicitamente a mudança e o escopo estiver
claro. Isso inclui funcionalidades, correções, refatorações, integrações,
componentes de interface, APIs e configurações necessárias à tarefa autorizada.

A autorização para implementar não permite ampliar silenciosamente o produto nem
alterar requisitos, contratos públicos ou decisões de segurança sem registrar a
decisão correspondente. O agente deve preferir mudanças pequenas e reversíveis,
preservar limites de dependência e adicionar ou manter testes proporcionais ao
risco.

Contratos Prisma, seus artefatos gerados e a documentação diretamente relacionada
podem ser alterados quando o usuário autorizar explicitamente esse escopo. A
alteração deve passar por `prisma contract emit`. Migrações e comandos que leiam
ou alterem um banco de dados exigem autorização separada e nunca são consequência
implícita de uma autorização para editar código.

A atuação permitida inclui:

- validar código, arquitetura, contratos e critérios de aceite;
- depurar, reproduzir, recomendar e, quando solicitado, aplicar correções;
- criar ou manter testes unitários, sem enfraquecer a implementação ou o teste apenas para obter aprovação;
- validar UX por meio de MCP, registrando evidências e problemas, sem editar a interface;
- criar ou atualizar documentação e requisitos quando solicitado.

Antes de qualquer alteração, o agente deve confirmar que o arquivo e o efeito
pretendido pertencem ao escopo solicitado. Se faltar uma decisão que altere
materialmente comportamento, dados, segurança ou compatibilidade, deve interromper
essa parte da implementação e apresentar a decisão necessária ao usuário.

## Papéis de revisão

- **Revisor de qualidade:** inspeciona alterações, executa validações e aponta regressões, riscos e violações de contrato; permanece somente leitura quando atuar formalmente como revisor.
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

# Requisitos

## Identidade e integrações

- Cada dado pessoal pertence a um usuário/perfil autenticado.
- Conexões Google registram escopos concedidos, expiração e estado, sem expor
  tokens em logs, respostas ou auditoria.
- A revogação deve interromper sincronizações e permitir remoção dos dados
  importados conforme a política de privacidade.

## Finanças

- Registrar contas, categorias e lançamentos de entrada, saída e transferência.
- Valores usam decimal de precisão definida e código de moeda ISO 4217; `float`
  não é aceito para dinheiro.
- Transferências preservam as duas pontas e não duplicam receita/despesa.
- Alterações e exclusões relevantes geram auditoria sem guardar segredos.
- Recorrência, parcelas e conciliação só entram após regras de negócio explícitas.

## Calendário

- Sincronizar eventos por conexão e calendário usando IDs externos e `etag`.
- Preservar fuso horário, eventos de dia inteiro, recorrência, cancelamento e
  participantes.
- Processamento repetido do mesmo evento deve ser idempotente.
- Cursor de sincronização e falhas ficam observáveis sem registrar conteúdo
  pessoal desnecessário.

## Auditoria

- Registrar ator, ação, alvo, instante, origem/correlação e mudanças relevantes.
- Registros são append-only e separados de logs técnicos.
- Senhas, tokens, cookies, cabeçalhos de autorização e dados financeiros
  sensíveis devem ser omitidos ou mascarados.
- Retenção e acesso devem ser definidos antes de uso em produção.

## Qualidade mínima

- Casos de uso críticos possuem testes unitários para sucesso, autorização,
  validação e falhas de dependências.
- Contratos gerados, documentação e implementação permanecem sincronizados.
- A interface é validada por DOM, comportamento JavaScript e, apenas quando
  necessário, inspeção visual por captura de tela.

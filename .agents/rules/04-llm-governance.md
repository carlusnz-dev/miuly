# Regra 04: Governança de Agentes e LLMs (ADR 0001)

- **Autorização Prévia:**
  - LLMs só podem criar ou modificar código de produção (backend Express, frontend Angular) quando houver autorização e instrução explícitas do usuário para aquela tarefa específica.
- **Modo Somente Leitura:**
  - Requisições de revisão de PR, auditoria de segurança, diagnóstico de bug ou integridade de requisitos devem ser executadas em modo estritamente **somente leitura**, sem alterar o código de produção.
- **Verificação Empírica:**
  - Não declarar sucesso ou resolução de tarefa sem executar verificação real (`npm --prefix backend run check`).
  - É proibido criar patches superficiais (como engolir exceções em `try/catch` vazios ou mascarar tipos) para forçar aprovação de testes ou compilação.

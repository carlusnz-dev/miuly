# Miuly

Miuly é um Personal Life ERP desenvolvido para centralizar e gerenciar aspectos da vida pessoal, integrando calendário, finanças e gerenciamento de conhecimento.

## Arquitetura e Stack

Este projeto segue uma arquitetura baseada em back-end separado do front-end. Essa decisão permite a execução de tarefas em background e a leitura de arquivos do sistema local (Cofre do Obsidian).

- **Front-end:** Next.js (React)
- **Back-end:** Express.js (Node.js + TypeScript)
- **Banco de Dados:** PostgreSQL (via Supabase)

## Metodologia de Desenvolvimento

Este projeto possui um foco educacional em Engenharia de Software. As práticas adotadas incluem:

- **Design First:** Modelagem de banco de dados e definição de contratos de API são feitos antes da codificação.
- **Clean Architecture:** O Back-end utiliza separação de responsabilidades (Controllers, Services, Repositories).
- **Uso Consciente de IA:** A Inteligência Artificial atua estritamente como revisora de código (Code Review) e validadora de arquitetura, nunca como solucionadora principal. Todo código escrito passa por revisão humana para fixação de aprendizado.

## Estrutura do Repositório

*A definir durante a inicialização (ex: separação em `/frontend` e `/backend`).*

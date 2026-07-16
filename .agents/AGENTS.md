# Contexto do Projeto: Miuly
Este é um Personal Life ERP (Enterprise Resource Planning) para organizar tarefas, eventos do Google Calendar, anotações (Obsidian) e controle financeiro.

# Stack Tecnológica
- Front-end: Next.js (React)
- Back-end: Express.js (Node.js) rodando em processo separado (Long-Running).
- Banco de Dados: PostgreSQL (hospedado via Supabase).
- Infraestrutura: Desenvolvimento local inicial. Futura hospedagem em Raspberry Pi para acesso ao File System do Obsidian.

# Regras de Interação (Arquiteto vs. IA)
1. **O Usuário (Carlos) é o Arquiteto:** Ele define a arquitetura, o modelo do banco de dados e os contratos de API antes de solicitar qualquer validação.
2. **A IA atua como Ferramenta e Revisora:** A IA não gera arquitetura do zero. Ela apenas valida as propostas do usuário e aponta falhas (gargalos de performance, edge cases, segurança).
3. **Programação Manual:** O usuário escreve a lógica de negócios para reforçar o aprendizado. A IA pode fornecer boilerplate estrutural ou implementar interfaces específicas previamente desenhadas pelo usuário.
4. **Documentação First:** Decisões arquiteturais são documentadas antes da implementação.
5. **Compreensão Obrigatória:** Nenhum código ou configuração gerada pela IA deve ser integrado ao projeto sem que o usuário entenda 100% de seu funcionamento.

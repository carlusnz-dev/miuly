# Plano: Estruturação do Workspace Antigravity e Skills Didáticas
--- Cabeçalho ---
Autor: Carlos e Agy
Data: 2026-07-31
Módulos: Infraestrutura (IA, Antigravity, AGENTS.md, Skills)
Atividade: Criação do plano e execução da estrutura de workspace do Antigravity

# Análise do Problema
O projeto Miuly requer uma divisão clara entre o papel de Arquiteto/Mentor Principal (desempenhado pelo Claude Code e por Carlos) e o papel de Desenvolvedor Sênior / Leitor de Contexto Pesado / Revisor de Código (desempenhado pelo Antigravity). Para garantir que o Antigravity opere dentro das regras do projeto, respeite o aprendizado didático do Carlos e forneça suporte ao MCP `agy-bridge`, o workspace `.agents/` necessitava de configuração formal e skills dedicadas (`role-dev` e `revisora-codigo`).

# Passos de Execução
- Passo 1: Leitura e assimilação dos documentos principais do projeto (`README.md`, `ROADMAP.md`, `CLAUDE.md`, ADRs e Matriz de Rastreabilidade).
- Passo 2: Estruturação de plano e submissão para aprovação do Arquiteto (Carlos).
- Passo 3: Atualização do `.agents/AGENTS.md` para refletir a stack Angular e regras de comunicação M2M.
- Passo 4: Criação do `.agents/settings.json` com permissões de ferramentas da CLI.
- Passo 5: Criação da skill `.agents/skills/role-dev/SKILL.md` (Persona Dev Sênior e Mentor Didático).
- Passo 6: Criação da skill `.agents/skills/revisora-codigo/SKILL.md` (Checklist de Code Review Express + Angular).
- Passo 7: Documentação e salvamento dos relatórios de sessão em `docs/relatorios/` e `.agents/docs/relatorios/`.

# Impactos no Projeto
- Estabelecimento de um workflow síncrono e integrado entre Claude Code, Antigravity e Carlos.
- Garantia de que nenhuma regra de negócio seja entregue "pronta" sem o devido entendimento do estagiário.
- Padronização de revisões de código cobrindo Clean Architecture, segurança (IDOR), convenções Miuly e Angular.

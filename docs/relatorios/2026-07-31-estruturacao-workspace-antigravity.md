# Estruturação do Workspace Antigravity e Skills Didáticas
--- Cabeçalho ---
Autor: Carlos e Agy
Data: 2026-07-31
Módulos: Infraestrutura (IA, Antigravity, AGENTS.md, Skills)
Atividade: Configuração do workspace .agents/ e criação das skills role-dev e revisora-codigo

# Corpo

## Contexto
O projeto Miuly utiliza o Claude Code como Arquiteto e Mentor principal, enquanto o Antigravity (Agy) atua como braço direito, desenvolvedor sênior e processador de contexto pesado (diretamente com Carlos ou de forma autônoma via MCP `agy-bridge`). Para que o Agy funcione com máxima eficiência, alinhado à stack real (Angular no frontend e Express/Prisma no backend) e com papéis bem definidos, fez-se necessária a inicialização e estruturação completa do workspace em `.agents/`.

## Ações Realizadas

1. **Leitura e Análise de Contexto:**
   - Leitura completa dos arquivos principais do repositório: `README.md`, `ROADMAP.md`, `CLAUDE.md` e toda a documentação em `docs/` (incluindo ADRs e a matriz de rastreabilidade).

2. **Atualização do `.agents/AGENTS.md`:**
   - Atualização da stack de Front-end para Angular (SPA) com componentes standalone e RxJS/Signals ([ADR-0009](docs/adr/0009-troca-do-framework-de-frontend-para-angular.md)).
   - Consolidação da dinâmica Arquiteto (Carlos) vs. IA (Agy): preservação da programação manual, proibição de geração autônoma de regras de negócio sem autorização, prioridade à didática e obrigatoriedade de compreensão.
   - Formalização do contrato de comunicação M2M para requisições via `agy-bridge` (resumos arquiteturais, buscas precisas `arquivo:linha` e revisões adversárias).

3. **Criação do `.agents/settings.json`:**
   - Configuração de permissões da CLI do Antigravity para comandos essenciais (`npm`, `npx prisma`, `ng`, `git status/diff`, etc.).

4. **Criação da Skill `role-dev` (`.agents/skills/role-dev/SKILL.md`):**
   - Definição da persona de Desenvolvedor Sênior e Professor Didático.
   - Estabelecimento do workflow de ensino: leitura inicial dos docs do projeto, orientação por camadas, fornecimento apenas de boilerplate/estruturas e lembretes de armadilhas conhecidas (`exactOptionalPropertyTypes`, ownership na camada Service, exceções do Prisma e reatividade no Angular).

5. **Criação da Skill `revisora-codigo` (`.agents/skills/revisora-codigo/SKILL.md`):**
   - Criação de checklist detalhado de auditoria de código backend (Clean Architecture, IDOR, Zod, exceções Prisma, TypeScript strict) e frontend (Angular standalone, gerenciamento de estado, desinscrição RxJS, `withCredentials`).
   - Padronização da saída de revisão em três categorias: **Erros Críticos**, **Alertas & Vícios** e **Sugestões de Clean Code**.

## Impactos no Projeto

- O Antigravity passa a operar com total clareza do seu papel de mentor didático e desenvolvedor sênior, sem colidir com a atuação do Claude Code.
- A padronização do código backend (Express) e frontend (Angular) ganha um mecanismo automático de revisão e orientação alinhado a todas as ADRs do projeto.

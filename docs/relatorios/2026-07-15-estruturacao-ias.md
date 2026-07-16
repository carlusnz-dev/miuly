# Estruturação e Workflow de IAs
--- Cabeçalho ---
Autor: Carlos e Agy
Data: 2026-07-15
Módulos: Infraestrutura (IA, Automação)
Atividade: Configuração do workflow MCP agy-bridge e padronização de relatórios

# Corpo

## Contexto
Carlos solicitou a organização do fluxo de trabalho entre o Claude Code e o Antigravity (Agy) via CLI. O objetivo principal era estabelecer uma arquitetura onde o Claude delega leitura pesada e revisão para o Agy, economizando contexto. Adicionalmente, foi necessário padronizar o local e o formato dos relatórios de sessão gerados para que ambas as ferramentas pudessem lê-los padronizadamente.

## Ações Realizadas
1. **Configuração do MCP:** Criamos o `AGENTS.md` global para instruir o Agy a ter respostas estruturadas e concisas (Machine-to-Machine) via delegação de ferramentas (`analyze_files`, `deep_search`, `adversarial_review`) do Claude.
2. **Migração do Diretório Local:** A pasta `.gemini/` foi migrada para `.agents/` conforme o padrão da documentação do Antigravity.
3. **Novas Skills:**
   - `revisao-clean-arch`: Avalia camadas de arquitetura (Controllers, Services, Repositories).
   - `integridade-requisitos`: Valida se a lógica de negócio atende os RFs e RNFs do ROADMAP.
   - `salvar-relatorio`: Automatiza a criação de relatórios seguindo o novo formato padrão.
4. **Padronização dos Relatórios:**
   - Criados `docs/relatorios/template.md` e `docs/planos/template.md`.
   - Migrados e reestruturados 7 relatórios antigos que estavam no diretório `.claude/docs/relatorios` para a nova localização e formato.

## Impactos no Projeto
Com esse setup, o desenvolvedor opera de forma síncrona com IAs especializadas. O Claude mantém contexto alto, focando apenas na parte arquitetural "mastigada" pelo Agy, enquanto a documentação se mantém uniforme e passível de leitura por ambos.

# Plano de Workflow: Claude Code (MCP) + Antigravity

**Objetivo:** Estabelecer uma colaboração síncrona e automatizada via MCP (`agy-bridge`) onde o Claude Code delega o processamento pesado de arquivos e revisão profunda para o Antigravity (agy).

## 1. Fluxo de Trabalho
- **Comunicação:** O Claude Code atua como cérebro e invoca o Antigravity de forma autônoma através das ferramentas do MCP `agy-bridge`.
- **Casos de Uso do Agy:**
  - `analyze_files`: Leitura de múltiplos arquivos ou arquivos muito longos (>200 linhas).
  - `deep_search`: Busca em logs do git ou pesquisa abrangente no repositório.
  - `adversarial_review`: Revisão crítica de Clean Architecture e integridade do código.
- **Formato de Retorno:** O Antigravity processa as informações e as devolve diretamente à memória do Claude Code de forma estruturada e densa, omitindo grandes blocos de código para economizar contexto.

## 2. Configurações Feitas
- **AGENTS.md Global:** Configuradas as diretrizes para que o Antigravity compreenda o contexto Máquina-para-Máquina (M2M) quando acionado pelo Claude.
- **Customização Local:** A pasta `.gemini/` foi migrada para `.agents/` conforme o padrão da ferramenta, armazenando as configurações e regras específicas do projeto Miuly.

## 3. Skills Adicionadas no Antigravity
- **revisao-clean-arch:** Verifica o cumprimento das diretrizes de Clean Code e Clean Architecture do projeto, focando em segurança e isolamento de dependências.
- **integridade-requisitos:** Valida o código ou a documentação cruzando com os Requisitos Funcionais (RFs) e Não Funcionais (RNFs) descritos no ROADMAP e no Plano do MVP.

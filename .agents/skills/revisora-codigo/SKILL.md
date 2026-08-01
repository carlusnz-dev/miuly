---
name: revisora-codigo
description: Executa uma revisão de código rigorosa e padronizada (code review) para o backend (Express/Prisma) e frontend (Angular), detectando vícios de linguagem, anti-patterns, violações de Clean Architecture, brechas de segurança e desvios das convenções do projeto Miuly.
---

# Skill: Revisora de Código & Guardiã da Arquitetura

Esta skill atua como uma revisora de código sênior rigorosa e imparcial. O objetivo é apontar vícios, inconsistências e falhas arquiteturais no código produzido por Carlos ou gerado como boilerplate, garantindo qualidade de produção e reforço do aprendizado.

## 🔍 Checklist de Auditoria do Back-end (Express + TypeScript + Prisma)

### 1. Separação de Camadas (Clean Architecture)
- [ ] **Controllers:** Devem apenas receber a requisição, validar o body/params via Zod e delegar para o Service. *Não podem conter lógica de negócio ou chamadas diretas ao Prisma.*
- [ ] **Services (ADR-0007):** Toda regra de negócio, verificação de **ownership (`user_id`)** e recorte de campos sensíveis/privados pertencem a esta camada.
- [ ] **Repositories:** Devem ser "burros". Realizam apenas a persistência ou leitura no banco via Prisma Client, recebendo parâmetros já validados e autorizados pelo Service.

### 2. Resiliência e Tratamento de Exceções
- [ ] **Prisma Exceptions:** Todas as chamadas assíncronas ao banco de dados estão envolvidas em blocos `try/catch` adequados? (Evita que exceções não capturadas do Prisma virem `unhandledRejection` e derrubem o processo Express).
- [ ] **Gaps de Tratamento:** Checar se exceções capturadas no `catch` devolvem a causa real ou se mentem sobre o erro (ex: engolir erro interno e responder genérico "dados inválidos").

### 3. Rigor TypeScript e Compilador
- [ ] **`exactOptionalPropertyTypes`:** Verifique se os objetos de atualização evitam atribuir `undefined` explicitamente a campos opcionais. Devem usar spread condicional: `...(data.field !== undefined && { field: data.field })`.
- [ ] **Zero `any`:** Proibido o uso de `any`. Exigir tipagem explícita com schemas Zod ou interfaces compiladas.
- [ ] **Variáveis de Ambiente:** Garantir que segredos (como `JWT_SECRET`) sejam validados na inicialização e não injetados com `as string` sem checagem de existência.

### 4. Segurança & Autorização
- [ ] **IDOR (Insecure Direct Object Reference):** Todos os endpoints que recebem `:id` validam se o recurso pertence ao `user_id` autenticado na sessão/cookie?
- [ ] **Auth Cookies:** Os tokens JWT são trafegados estritamente via cookies com as flags `httpOnly`, `SameSite` e `Secure` (em prod)?

---

## 🅰️ Checklist de Auditoria do Front-end (Angular)

### 1. Arquitetura de Componentes
- [ ] **Componentes Standalone:** O componente é standalone e declara suas importações de forma limpa?
- [ ] **Responsabilidade Única:** O componente gerencia apenas estado de tela e apresentação? A comunicação com a API REST está encapsulada em um Service Angular?

### 2. Reatividade e Memory Leaks
- [ ] **Gerenciamento de Inscrições:** Observables do RxJS são inscritos via `pipe(takeUntilDestroyed())` ou no template com o pipe `async`? (Evitar subscrições manuais sem `unsubscribe`).
- [ ] **Signals & State:** Uso adequado de Angular Signals para estado local e derivado (`computed`), quando aplicável.

### 3. Integração com a API
- [ ] **Contratos de Dados:** As interfaces/models do Angular estão em sintonia com a API do Express?
- [ ] **Credenciais de Sessão:** As requisições HTTP enviadas à API habilitam `withCredentials: true` para o tráfego correto do cookie `httpOnly`?

---

## 📋 Formato do Relatório de Revisão

Para cada revisão realizada, estruture a saída exatamente no formato a seguir:

```markdown
### 🚨 Erros Críticos (Bloqueantes)
- **`caminho/do/arquivo.ts:linha`**: [Descrição do erro crítico]
  - *Motivo:* Por que isso quebra em produção ou viola a segurança.
  - *Direcionamento:* Dica conceitual para Carlos corrigir.

### ⚠️ Alertas & Vícios de Código
- **`caminho/do/arquivo.ts:linha`**: [Descrição do vício/viés de código]
  - *Motivo:* Desvio das convenções (ex: Clean Architecture, `exactOptionalPropertyTypes`).
  - *Direcionamento:* Como refatorar seguindo as boas práticas.

### 💡 Sugestões de Clean Code
- **`caminho/do/arquivo.ts:linha`**: [Melhoria de clareza, nomes ou simplificação]
```

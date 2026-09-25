# Requisitos do Sistema (Miuly)

Este documento especifica os Requisitos Funcionais (RF) e Requisitos Não-Funcionais (RNF) da plataforma **Miuly**, estruturados sob padrões de engenharia de software para orientar o desenvolvimento, testes e validações automatizadas por LLMs e desenvolvedores.

---

## 1. Requisitos Funcionais (RF)

Os requisitos funcionais descrevem as capacidades, fluxos de negócio e operações expostas pelo sistema aos usuários e integrações.

| Código | Módulo Afetado | Descrição do Requisito | Critérios de Aceite |
| --- | --- | --- | --- |
| **RF-001** | `identity` (`auth`) | Cadastro e Autenticação de Usuários | Permite registrar usuário com nome, e-mail único e senha criptografada (`hashPassword`). Cria automaticamente um perfil (`Profile`) associado. |
| **RF-002** | `identity` (`users`) | Gestão de Perfil do Usuário | Permite consultar e atualizar bio, foto (`urlPhoto`), username e slug de URL do perfil (`slugUrl`). |
| **RF-003** | `identity` (`apis`) | Conexão OAuth 2.0 com Provedores Externos (Google) | Registra conexões de API externa (`Api`) mantendo escopos concedidos, expiração (`startTime`, `endTime`) e estado de ativação. |
| **RF-004** | `identity` (`apis`) | Revogação de Conexão Externa | A revogação interrompe imediatamente a sincronização de dados e habilita a remoção dos dados importados conforme a política de privacidade. |
| **RF-005** | `finance` | Gestão de Instituições Bancárias e Contas (`Bank`) | Cadastro e listagem de bancos/contas por perfil com saldo inicial armazenado com precisão decimal exata (`Numeric(10,2)`). |
| **RF-006** | `finance` | Registro de Lançamentos Financeiros (`Finance`) | Permite criar lançamentos de Entrada (`Inflow`), Saída (`Outflow`) e Transferência (`Transfer`), vinculados a um banco, valor, moeda ISO 4217 e categoria (`Tag`). |
| **RF-007** | `finance` | Transferências entre Contas Bancárias | Processa transferências afetando as duas pontas (origem/destino) de forma atômica sem duplicar receitas ou despesas nas estatísticas. |
| **RF-008** | `tasks` | Gestão de Tarefas e Agendamentos (`Task`) | Criação, edição e exclusão de tarefas contendo título, observações, prioridade (API pública: `low`, `medium`, `high`, `archived`; traduzida no banco para `Low`, `Medium`, `Urgent`, `Archived`), estado de conclusão (`done`) e data agendada (`scheduledAt`). |
| **RF-009** | `tasks` | Categorização e Associação N:N de Tags | Permite vincular múltiplas tags a tarefas através da junção explícita `tasks_tags` e filtrar tarefas por tags ativas. |
| **RF-010** | `calendar` | Sincronização e Espelhamento do Google Calendar (`Event`) | Espelha eventos utilizando `googleCalendarId`, `googleEventId`, `etag`, datas/instantes (`startAt`, `endAt`, `startDate`, `endDate`), fuso horário e eventos de dia inteiro (`allDay`). |
| **RF-011** | `calendar` | Processamento Idempotente de Eventos | A recepção repetida da mesma notificação ou evento do Google não gera duplicatas nem corrompe os dados existentes. |
| **RF-012** | `audit` | Trilha Imutável de Auditoria (`AuditLog`) | Registra o autor (`authorId`), a ação (`name`), a descrição sanitizada das alterações (`whatChanged`) e a data/hora (`changedAt`). |

---

## 2. Requisitos Não-Funcionais (RNF)

Os requisitos não-funcionais estabelecem restrições de qualidade, arquitetura, segurança, integridade e testabilidade da aplicação.

| Código | Módulo Afetado | Categoria | Descrição | Critérios de Aceite |
| --- | --- | --- | --- | --- |
| **RNF-001** | `core` | **Arquitetura** | Isolamento da Camada de Domínio | Entidades de domínio e casos de uso não possuem dependências diretas de Express, Prisma ORM, Zod ou SDKs externos. |
| **RNF-002** | `finance` | **Integridade** | Precisão Numérica Monetária | Valores monetários devem obrigatoriamente usar `Decimal` (`Numeric(10,2)`) e moeda ISO 4217 (ex: `BRL`). Uso de `float` ou `double` é estritamente proibido. |
| **RNF-003** | `audit` | **Segurança** | Sanitização e Omisão de Segredos | Senhas, tokens de acesso/refresh OAuth, cabeçalhos de autorização e dados financeiros confidenciais nunca são gravados em plain-text em logs técnicos ou no `AuditLog`. |
| **RNF-004** | `core` | **Padrão HTTP** | Formatação de Datas em ISO 8601 | Todas as respostas de APIs e DTOs de transporte representam instantes no padrão ISO 8601 UTC/Offset. |
| **RNF-005** | `core` | **Segurança** | Autenticação e Propriedade de Dados | Toda operação em entidades de perfil (`Profile`) exige validação de propriedade do usuário autenticado (`userId`). |
| **RNF-006** | `audit` | **Persistência** | Imutabilidade dos Registros de Auditoria | A tabela `audit_logs` é operacionalmente *append-only*. Registros de auditoria não podem ser alterados ou apagados por fluxos normais de aplicação. |
| **RNF-007** | `core` | **Qualidade** | Testes Unitários de Casos de Uso | Todo caso de uso crítico (serviço) deve possuir testes unitários cobrindo o caminho feliz, erros de validação, falta de autorização e falhas de infraestrutura. |
| **RNF-008** | `core` | **Governança** | Validação Estática Pré-Commit | Código de produção só é integrado após aprovação da checagem estática de tipos (`npm run check`) e emissão de contratos (`npm run contract:emit`). |

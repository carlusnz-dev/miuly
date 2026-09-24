# Revisão do modelo de dados

Validação realizada em 2026-09-21 sobre
`backend/src/prisma/contract.prisma`, usando Prisma ORM `8.0.0-rc.15`.

## Resultado atual

O contrato é compilável. `npm run contract:emit` gerou `contract.json` e
`contract.d.ts` sem diagnósticos, e `npm run check` concluiu sem erros. O contrato
emitido possui os modelos `User`, `Profile`, `Api`, `Task`, `Tag`, `TaskTag`,
`Bank`, `Finance`, `Event` e `AuditLog`.

## Correções consolidadas

- tipos PostgreSQL usam a grafia do Prisma 8, como `VarChar` e `Numeric(10, 2)`;
- IDs inteiros usam `autoincrement()` e IDs UUID usam `uuid()`;
- `TaskTag` possui FKs, relações e chave primária composta;
- títulos de tarefas e APIs são únicos dentro do perfil, não globalmente;
- tags pertencem a um perfil e possuem nome/slug únicos nesse escopo;
- campos booleanos com padrão não são anuláveis;
- artefatos gerados acompanham o contrato atual;
- o projeto TypeScript inclui o `contract.json` importado pelo cliente.

## Finanças

`Finance` representa um lançamento associado a perfil, banco e categoria
opcional. O valor usa decimal exato, e a moeda é persistida como código de três
caracteres. `TypeFinance` diferencia entrada, saída e transferência.

`Bank` resolve a relação anteriormente inexistente e mantém os lançamentos
separados por perfil. Antes de evoluir o módulo, deve ser decidido se `Bank`
representará uma conta concreta ou apenas a instituição; o segundo caso exige um
modelo adicional de conta financeira.

## Google Calendar

`Event` mantém os identificadores externos do calendário e do evento, `etag`,
link, status, recorrência e participantes. A chave única
`profileId + googleCalendarId + googleEventId` permite sincronização idempotente.

Eventos temporizados usam `startAt`/`endAt`; eventos de dia inteiro usam
`startDate`/`endDate`. A aplicação deve garantir que apenas o par correspondente a
`allDay` seja preenchido e lembrar que a data final de eventos de dia inteiro do
Google Calendar é exclusiva.

Participantes podem conter dados pessoais. A aplicação deve limitar escopos OAuth,
controlar acesso por perfil e evitar copiar participantes, descrições ou links para
logs técnicos sem necessidade.

## Auditoria

`AuditLog` contém ID, nome da ação, autor, descrição textual da alteração e
instante. Os índices atendem consultas por autor/data e ação/data. O modelo não
possui `updatedAt`: registros devem ser append-only.

`whatChanged` deve conter uma descrição sanitizada. Senhas, tokens OAuth, cookies,
headers de autorização e dados financeiros sensíveis não podem ser registrados.
Se auditoria estrutural for necessária no futuro, prefira campos explícitos para
tipo/ID da entidade e JSON sanitizado em vez de concatenar objetos completos.

## Decisões pendentes

- definir exclusão em cascata ou restritiva para cada relação;
- garantir na aplicação que banco, tag, tarefa e lançamento pertencem ao mesmo
  perfil, até que essa invariável seja reforçada por constraints compostas;
- decidir a política de resolução de conflitos e retenção dos eventos importados;
- definir retenção e autorização de leitura dos registros de auditoria;
- decidir se `Profile.email` continuará duplicando o e-mail de `User`.

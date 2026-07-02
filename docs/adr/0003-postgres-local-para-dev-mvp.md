# ADR-0003: Postgres local para desenvolvimento no MVP (Supabase entra depois)

- **Status:** Aceito
- **Data:** 2026-07-01
- **Decisores:** Carlos (Arquiteto)

## Contexto

Antes de rodar a primeira migration do schema Prisma (ADR-0002), era preciso decidir
contra qual banco desenvolver. O `plano_mvp.md`/`CLAUDE.md` já previa Supabase
(PostgreSQL gerenciado) como banco do projeto, mas isso levantou uma dúvida prática:
Supabase expõe API keys (`anon`, `service_role`) para sua API REST/GraphQL
autogerada (PostgREST) — e não ficava claro se conectar via Prisma exigiria lidar
com essas keys.

Na prática, Prisma não usa a API do Supabase — ele conecta direto no Postgres por
trás, via `connection string` padrão (usuário/senha/host/porta/banco), sem nenhuma
API key envolvida. Ainda assim, developing contra um banco gerenciado remoto desde o
primeiro dia traz custo desnecessário nesta fase: depende de rede, adiciona latência
em cada migration/teste, e mistura dado de desenvolvimento com o ambiente que
futuramente seria de produção/staging. O projeto já tem um serviço `db` (Postgres
17.10) definido no `docker-compose.yml` (ver ADR anterior sobre a config de Docker),
pronto pra uso local sem nenhuma configuração adicional de rede.

## Decisão

Desenvolvimento do MVP usa **Postgres local**, rodando via o serviço `db` do
`docker-compose.yml` (porta `5432` publicada no host). O Prisma conecta a esse banco
através de `DATABASE_URL` em `backend/.env`, apontando para `localhost:5432` — já
que as migrations e o desenvolvimento são executados diretamente na máquina local,
não de dentro do container do backend.

Supabase fica reservado para uma fase futura: quando o projeto precisar de um banco
compartilhado/acessível remotamente (staging, deploy real, ou colaboração com mais
alguém), ou quando features específicas do Supabase (Auth gerenciado, Row Level
Security, Storage) entrarem em uso.

## Alternativas consideradas

- **Conectar direto ao Supabase desde o início do MVP.** Evita ter que rodar
  Postgres localmente, mas adiciona dependência de rede/latência em todo ciclo de
  desenvolvimento e migration, sem nenhum ganho concreto nesta fase. Rejeitada.
- **Postgres local via instalação nativa na máquina (sem Docker).** Funciona, mas
  duplica configuração que já existe no `docker-compose.yml` e foge do que já foi
  decidido para o ambiente de deploy (self-hosted via Docker, ADR-0001). Rejeitada.
- **Postgres local via Docker Compose (escolhida).** Reaproveita a configuração já
  existente no projeto, sem custo de setup adicional, com paridade maior com o
  ambiente de deploy. Escolhida.

## Consequências

- **Positivas:**
  - Desenvolvimento e migrations não dependem de rede externa nem de
    disponibilidade do Supabase.
  - Dado de desenvolvimento fica isolado de qualquer ambiente futuro de
    staging/produção.
  - Reaproveita a configuração de Docker já validada no projeto.
- **Negativas / trade-offs:**
  - `DATABASE_URL` local usa `localhost` como host, o que só funciona para
    processos rodando **fora** do container do backend (ex.: `npx prisma migrate
    dev` direto na máquina). Se o backend rodar containerizado futuramente, a
    connection string usada *dentro* do container precisará apontar para o nome
    do serviço (`db`), não `localhost` — são duas URLs diferentes para dois
    contextos diferentes.
  - Ambiente local não tem features específicas do Supabase (Auth gerenciado,
    RLS, Storage) — caso o projeto passe a depender delas, o dev local deixa de
    ter paridade total com produção.
- **Follow-ups:**
  - Ao decidir migrar para Supabase, documentar a transição (nova `DATABASE_URL`,
    possível necessidade de `pgbouncer=true` se usar o connection pooler do
    Supabase) — pode virar um ADR próprio ou uma revisão deste.

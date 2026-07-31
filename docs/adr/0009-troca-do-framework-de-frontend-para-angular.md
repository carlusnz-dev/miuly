# ADR-0009: Troca do framework de front-end de Next.js para Angular

- **Status:** Proposto
- **Data:** 2026-07-31
- **Decisores:** Carlos (Arquiteto)

## Contexto

O front-end do Miuly foi definido como **Next.js (React)** desde os documentos iniciais
(`CLAUDE.md`, `plano-mvp.md`) e é premissa da [ADR-0001](0001-topologia-de-deploy.md),
que coloca o front na Vercel e o back-end self-hosted no Raspberry Pi.

Forças que tornam a decisão necessária **agora**:

1. **O front ainda não começou.** O diretório `frontend/` tem apenas o scaffold do
   `create-next-app` (configs, `next.config.ts`, `eslint.config.mjs`) — nenhuma página,
   componente ou chamada à API foi escrita. O custo de troca é o mais baixo que jamais
   será.
2. **Objetivo educacional do projeto.** Carlos usa **Angular na empresa onde estagia**.
   Usar o mesmo framework no projeto pessoal transforma cada hora de Miuly em prática
   direta da stack do trabalho, e vice-versa — o aprendizado dos dois lados se soma em
   vez de competir.
3. **Preferência por framework opinativo.** O Angular impõe estrutura (módulos/standalone
   components, DI, services, roteamento, HTTP client, formulários) em vez de deixar a
   escolha para o desenvolvedor. Para quem está aprendendo arquitetura de front-end, ser
   guiado por convenções explícitas é uma vantagem, não uma limitação — é o mesmo
   raciocínio que já orienta o back-end em camadas (Clean Architecture).

O back-end (Express + Prisma) é uma **API REST desacoplada**, consumida por HTTP com
cookie de sessão (`SESSIONID`). Nenhuma decisão de back-end depende do framework de
front-end.

## Decisão

O front-end do Miuly passa a ser escrito em **Angular**, substituindo o Next.js (React).

- O scaffold atual de Next.js em `frontend/` é descartado e substituído por um projeto
  Angular novo (Angular CLI).
- A comunicação com o back-end continua sendo **REST sobre HTTP**, com o cookie
  `httpOnly` de sessão definido na [ADR-0006](0006-estrategia-de-jwt.md) — o front não
  lê nem armazena o JWT.
- O Miuly passa a ser uma **SPA** (client-side rendering). Não há requisito de SEO ou de
  renderização no servidor: é uma aplicação pessoal atrás de login.

## Alternativas consideradas

- **Manter Next.js (React)** — já está definido nos docs, tem o scaffold pronto e SSR/
  SEO de graça. Mas nenhum desses ganhos importa para uma aplicação pessoal autenticada,
  e o React exige decidir por conta própria estrutura de pastas, gerência de estado e
  data fetching — decisões que consomem tempo de aprendizado sem relação com o trabalho.
  Rejeitada.
- **Angular (escolhida)** — opinativo, alinhado à stack usada profissionalmente pelo
  Carlos, com estrutura de services/DI que espelha o raciocínio de camadas já aplicado
  no back-end. Vence por somar aprendizado de trabalho e de projeto pessoal, ao custo de
  descartar um scaffold que ainda não tem código de negócio.
- **Adiar a decisão e começar o front em Next.js mesmo assim** — evitaria retrabalho de
  configuração, mas o custo de migrar cresce a cada tela escrita. Como o front está em
  zero, adiar só aumenta o preço. Rejeitada.

## Consequências

- **Positivas:** alinhamento com a stack profissional do Carlos (reforço mútuo de
  aprendizado); estrutura imposta pelo framework reduz decisões de arquitetura de front;
  bateria completa incluída (HttpClient, Router, Forms, DI) sem escolher bibliotecas de
  terceiros; custo de troca praticamente zero por o front não ter começado.
- **Negativas / trade-offs:**
  - **Framer Motion sai da stack** — é uma biblioteca React. A camada de animação do
    front (prevista em `CLAUDE.md`) precisa de substituto no ecossistema Angular
    (Angular Animations ou equivalente); decisão em aberto.
  - **Perda de SSR/SSG** — aceitável (app pessoal atrás de login, sem SEO), mas o
    carregamento inicial de uma SPA é maior. Impacta o RNF006 (resposta em até 1,5 s),
    que passa a depender de build otimizado.
  - **Curva de aprendizado maior** — Angular tem mais conceitos de entrada (DI,
    decorators, RxJS, change detection) do que React. É custo assumido conscientemente:
    faz parte do objetivo.
  - **Documentação do projeto desatualizada** — `CLAUDE.md`, `plano-mvp.md`,
    `docs/README.md` e o agente `.claude/agents/frontend-explorer.md` citam Next.js/React
    e precisam ser revisados.
- **Follow-ups:**
  - Revisar a [ADR-0001](0001-topologia-de-deploy.md): ela pressupõe front Next.js na
    Vercel. Uma SPA Angular gera build estático — continua deployável na Vercel, mas o
    ponto precisa ser confirmado (ou virar novo ADR se a hospedagem do front mudar).
  - Substituir o scaffold em `frontend/` por um projeto Angular CLI.
  - Definir a estratégia de CORS/cookie entre o front hospedado e a API no Raspberry Pi
    (domínios distintos + cookie `httpOnly` exigem `SameSite`/`credentials` corretos) —
    forte candidato a ADR próprio.
  - Escolher a biblioteca de animação e, se houver, de componentes de UI.
  - Atualizar `CLAUDE.md`, `plano-mvp.md` e `.claude/agents/frontend-explorer.md`.

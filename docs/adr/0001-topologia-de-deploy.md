# ADR-0001: Topologia de deploy (Vercel + Raspberry Pi)

- **Status:** Aceito
- **Data:** 2026-07-01
- **Decisores:** Carlos (Arquiteto)

## Contexto

O Miuly tem front-end em Next.js e back-end em Express (Node.js + TypeScript). Havia uma
contradição nos documentos iniciais: o `plano_mvp.md` previa deploy do back-end na Vercel,
enquanto o `README.md` e o `ROADMAP.md` previam um Raspberry Pi self-hosted.

Duas forças tornam a decisão necessária agora, antes de escrever as rotas:

1. **Acesso ao File System local.** Um requisito de roadmap (integração com o Obsidian,
   RF003.1) exige ler arquivos `.md` do cofre local via `fs`. Isso só é possível em um
   processo com acesso ao disco onde o cofre vive.
2. **Processo long-running.** O back-end precisará de tarefas em background (relatórios
   mensais RF005, futuras notificações RF004), incompatíveis com o modelo serverless
   efêmero da Vercel.
3. **Custo.** O projeto é pessoal; manter um servidor Node pago não se justifica.

## Decisão

Vamos adotar uma topologia **híbrida**:

- **Front-end (Next.js):** deploy na **Vercel**.
- **Back-end (Express):** **self-hosted em um Raspberry Pi**, como processo long-running
  com acesso ao File System local.
- **Banco de dados:** **Supabase (PostgreSQL gerenciado)** na nuvem, acessado por ambos.

## Alternativas consideradas

- **Tudo na Vercel (front + back serverless).** Simples de operar e com CI/CD nativo, mas
  **inviabiliza** o acesso ao FS do Obsidian e as tarefas em background. Rejeitada.
- **Back-end como API do próprio Supabase (sem Express).** Menos código de infraestrutura,
  porém contraria o objetivo de estudo (aprender a configurar um framework leve na mão) e
  também não resolve o acesso ao FS local. Rejeitada.
- **Back-end em Raspberry Pi + Front na Vercel (escolhida).** Custo zero de servidor,
  atende FS local e background jobs, e mantém o front com deploy simples e CDN. Escolhida.

## Consequências

- **Positivas:**
  - Viabiliza a leitura do cofre do Obsidian e tarefas em background.
  - Custo de servidor zero; front-end com deploy e CDN triviais.
  - Aprendizado real de self-hosting, rede e exposição de serviço.
- **Negativas / trade-offs:**
  - Exige configurar acesso externo ao Raspberry Pi (DDNS/Ngrok/túnel) e HTTPS.
  - Disponibilidade do back-end depende da minha rede doméstica.
  - CI/CD do back-end é mais trabalhoso que o deploy automático da Vercel.
  - É preciso configurar CORS entre o domínio da Vercel e o back-end self-hosted.
- **Follow-ups:**
  - ADR futuro sobre estratégia de exposição do Raspberry Pi (DDNS vs. túnel).
  - ADR futuro sobre escolha do ORM (Prisma vs. Drizzle) — pendente.

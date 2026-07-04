# ADR-0004: Estratégia de autenticação (hash de senha, exposição de dados, validação de RN)

- **Status:** Aceito
- **Data:** 2026-07-04
- **Decisores:** Carlos (Arquiteto)

## Contexto

O MVP (RF006) exige login por e-mail/senha, além de Google OAuth (reaproveitado
depois para o RF008/Calendar). O `schema.prisma` atual não tem nenhum campo para
guardar credencial no model `User` — só `id, email, username, role, created_at,
updated_at`. Antes de implementar o fluxo repository → service → controller →
router para criação/autenticação de usuário, era preciso decidir:

1. Como a senha é armazenada (texto puro é descartado por padrão de segurança).
2. Em qual camada o hash é gerado, e o que cada camada (repository/service)
   recebe e devolve.
3. O que a API expõe no corpo da resposta sobre um usuário.
4. Como rotas autenticadas vão validar sessão/identidade.
5. Onde mora a validação de regra de negócio (RN): só no backend, só no banco, ou
   nos dois.
6. O schema também carrega um typo pendente desde o ADR-0002 (`Finaces`/`Finace`
   em vez de `Finance`), que precisa ser corrigido antes de se espalhar por
   controllers/services novos.

## Decisão

- **Senha é armazenada como hash, usando bcrypt.** Nunca em texto puro, em
  nenhuma camada.
- **O Service gera o hash antes de persistir.** O Repository só recebe e grava o
  hash (não lida com texto puro, não decide algoritmo, não tem lógica de
  hashing).
- **O corpo de resposta da API nunca expõe o hash da senha** — somente campos
  públicos do usuário são retornados pelo Service/Controller.
- **Rotas protegidas usam um middleware de verificação de JWT.** Detalhes de
  implementação (expiração, refresh, algoritmo de assinatura) ainda serão
  pesquisados por Carlos antes de codar.
- **Validação de regra de negócio (RN) acontece em duas camadas
  complementares:**
  - No backend (Service), para regras que o Postgres não consegue expressar.
  - No Postgres, via constraints (`UNIQUE`, `NOT NULL`, `DISTINCT` etc.), para
    tudo que for possível garantir como constraint de banco.
- **Correções de schema decorrentes desta decisão** (a serem aplicadas por
  Carlos, com migration própria):
  - Adicionar ao `User` o campo de senha hasheada.
  - Corrigir o typo `Finace`/`Finaces` para `Finance` no schema.

## Alternativas consideradas

- **Hash com bcrypt (escolhida)** — padrão de indústria, bem documentado,
  suportado nativamente por libs maduras do Node. Outros algoritmos (ex.:
  Argon2) não foram avaliados nesta sessão — se isso mudar, atualizar este ADR
  ou abrir um novo.
- **Repository gerando o próprio hash** — rejeitada: misturaria lógica de
  segurança (que é regra de negócio) na camada que deveria só persistir dados,
  quebrando a separação Controller → Service → Repository já adotada no
  projeto.
- **Validar RN só no backend, sem constraints no Postgres** — rejeitada:
  deixaria de aproveitar garantias que o próprio banco pode enforçar de forma
  mais barata e à prova de bypass (ex.: uma segunda instância da aplicação
  escrevendo direto no banco).

## Consequências

- **Positivas:**
  - Senha nunca trafega nem fica persistida em texto puro.
  - Separação clara de responsabilidade: Service decide *como* proteger o dado,
    Repository só persiste o resultado.
  - Reduz risco de exposição acidental de dado sensível (hash) em respostas de
    API.
  - Regras de banco (unique/not null) continuam garantidas mesmo se alguma
    regra do Service for esquecida ou tiver bug.
- **Negativas / trade-offs:**
  - Estratégia de JWT ainda não está definida (expiração, refresh, algoritmo) —
    até isso ser pesquisado e decidido, rotas protegidas não têm enforcement
    real.
  - Ainda não foi especificado, regra por regra, quais RN viram constraint de
    Postgres e quais ficam só no Service — decisão caso a caso conforme os
    módulos forem implementados.
- **Follow-ups:**
  - Pesquisar e documentar a estratégia de JWT (expiração, refresh token,
    algoritmo de assinatura) — pode virar um ADR próprio quando definida.
  - Migration para adicionar o campo de senha hasheada ao `User` e renomear
    `Finace`/`Finaces` → `Finance` no schema (a cargo de Carlos).
  - Conforme cada módulo for escrito, registrar aqui (ou em ADR novo) quais RN
    específicas ganharam constraint no Postgres.

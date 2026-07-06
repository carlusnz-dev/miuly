# ADR-0006: Estratégia de JWT (stateless, cookie httpOnly, login e logout)

- **Status:** Aceito
- **Data:** 2026-07-06
- **Decisores:** Carlos (Arquiteto)

## Contexto

O [ADR-0004](0004-estrategia-de-autenticacao.md) (Aceito) definiu que a senha é
guardada como hash bcrypt e que **rotas protegidas usam um middleware de verificação
de JWT**, mas deixou como follow-up explícito os detalhes do token: expiração, refresh,
algoritmo de assinatura e transporte. Com o CRUD do `User` concluído, o RF006
(autenticação) é o desbloqueador dos módulos Financeiro (RF002) e To-do (RF001) — que
precisam do `userId` vindo de um token verificado, não do corpo da requisição.

Antes de codar o módulo `auth` (login/logout + middleware de verificação), é preciso
fechar: como o token é emitido, por onde trafega, quanto dura, como o login identifica
o usuário, o que a API responde em falha, e o que "logout" significa nesse modelo.

## Decisão

- **Autenticação via JWT assinado e _stateless_** — o servidor não guarda sessão; a
  validade e a identidade vivem dentro do próprio token.
- **Transporte por cookie `httpOnly`** (com `secure` e `sameSite`), **não** em
  `localStorage` nem em header `Authorization` — reduz superfície de roubo de token via
  XSS (JS do browser não lê o cookie).
- **Login por e-mail _ou_ username + senha**, verificando a senha com `bcrypt.compare`
  (nunca re-hasheando a senha da requisição para comparar).
- **Falha de login devolve resposta genérica `401`** (mesma mensagem para "usuário não
  encontrado" e "senha incorreta") para evitar _user enumeration_. A distinção fica
  apenas em log interno.
- **`JWT_SECRET` e o tempo de expiração vêm de variáveis de ambiente**, nunca
  hardcoded/commitados. Expiração: **24h em produção, 5 min em teste**.
- **Logout = `res.clearCookie`** do cookie do token. Assume-se a limitação do modelo
  stateless: o token permanece tecnicamente válido até expirar (sem blocklist no MVP).
- **Verificação:** middleware que lê o cookie, valida o JWT (`jwt.verify`) e injeta o
  `userId` no request; token ausente/inválido responde `401`.
- **Estrutura de arquivos:** `auth.service.ts`, `auth.controller.ts`, `auth.route.ts`
  seguindo o padrão por-camada já vigente; sem repositório próprio — reusa
  `user.repository`.

## Alternativas consideradas

- **JWT stateless em cookie httpOnly (escolhida)** — sem estado no servidor (simples e
  escalável para o self-hosted no Raspberry Pi); cookie httpOnly protege de XSS. Contra:
  logout não invalida o token de imediato; revogação real exigiria estado.
- **Token em `localStorage` + header `Authorization: Bearer`** — rejeitada: fica exposto
  a roubo via XSS e não traz benefício sobre o cookie httpOnly para este caso.
- **Sessão _stateful_ no servidor (session store)** — rejeitada para o MVP: permite
  logout/revogação imediatos, mas reintroduz estado e infraestrutura (store de sessão)
  que fogem do escopo atual.

## Consequências

- **Positivas:**
  - Sem estado de sessão no servidor — mais simples de operar no Raspberry Pi.
  - Cookie httpOnly reduz risco de roubo de token via XSS.
  - Resposta de login genérica fecha a brecha de enumeração de usuários.
  - Segredo e expiração fora do código (env) — troca de chave sem recompilar, sem
    vazar em commit.
- **Negativas / trade-offs:**
  - Logout não invalida o token no servidor; ele vale até `exp`. Revogação imediata
    exigiria blocklist (estado), fora do MVP.
  - Cookie httpOnly + `sameSite` exige atenção a CORS/CSRF quando o front (Vercel) e o
    back (Raspberry Pi) estiverem em origens diferentes.
- **Follow-ups:**
  - **Não decidido nesta ADR:** algoritmo de assinatura (o uso de `JWT_SECRET`
    simétrico aponta para HS256, mas não foi batido o martelo) e **refresh token** —
    registrar quando definidos.
  - Definir nomes/flags exatos do cookie e política de CORS entre Vercel e Raspberry Pi.
  - Escrever os testes unitários do módulo `auth` (senha curta, usuário não encontrado,
    mapeamento da req) após a implementação.

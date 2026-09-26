# ADR 0002: Autenticação com access token JWT e refresh token rotativo

## Metadata da Decisão

| Campo | Valor |
| --- | --- |
| **Título** | ADR-0002: Autenticação com access token JWT e refresh token rotativo |
| **Data** | 2026-09-24 |
| **Autor** | Carlos Antunes `<carlosantunes.dev@gmail.com>` |
| **LLM Utilizada** | Claude Code |
| **Modelo** | Claude Opus 5.5 (`claude-opus-5-5`) |
| **Status** | Aceita |

---

## 1. Contexto

O Miuly terá uma SPA Angular consumindo a API Express. O primeiro corte do backend
(`auth`, `users`, `tasks`, `apis`) precisa identificar o usuário em cada requisição
para cumprir o RNF-005 (toda operação sobre dados do perfil valida a propriedade).
Hoje `GET /users/:id` responde sem autenticação e o repositório é público.

As forças em jogo são:

- o front precisa de uma forma simples de enviar credenciais;
- tokens guardados em `localStorage` ficam expostos a XSS;
- o usuário precisa poder encerrar sessões (logout, troca de senha) antes de o
  token expirar;
- o projeto é um MVP com um desenvolvedor, então a solução deve ser pequena.

## 2. Decisão

- **Access token:** JWT assinado com HS256, validade de 15 minutos, com as claims
  `sub` (id do usuário), `pid` (id do perfil), `iat` e `exp`. É devolvido no corpo
  das respostas de `register`, `login` e `refresh`. A SPA guarda o token **só em
  memória** e o envia em `Authorization: Bearer <token>`.
- **Refresh token:** valor opaco e aleatório (32 bytes, base64url), com validade de
  7 dias, enviado **somente** no cookie `miuly_refresh` com `HttpOnly`,
  `SameSite=Strict`, `Path=/auth` e `Secure` fora de desenvolvimento. O banco guarda
  apenas o hash SHA-256 do refresh token, nunca o valor.
- **Rotação:** cada `POST /auth/refresh` emite um token novo cujo
  `previousTokenId` aponta para o token usado. Esse campo é único, então cada token
  tem no máximo um sucessor, e um token com sucessor já foi usado.
  - **Janela de tolerância:** várias abas podem renovar ao mesmo tempo com o mesmo
    cookie. Se o sucessor foi criado há no máximo 30 segundos, a API responde 409,
    sem emitir token nem revogar nada. O navegador já recebeu o cookie novo, e o
    front repete o refresh uma vez.
  - **Detecção de reuso:** fora dessa janela, a reapresentação de um token usado
    revoga todas as sessões do usuário (`revokedReason = reuse`) e responde 401.
- **Logout e troca de senha:** o logout revoga a sessão atual
  (`revokedReason = logout`); a troca de senha revoga todas as sessões do usuário
  (`revokedReason = password`). O access token já emitido continua
  válido até expirar, então o front descarta o token da memória ao concluir
  qualquer um dos dois.
- **Limpeza:** a cada login do usuário, são apagadas de forma oportunista as
  sessões revogadas há mais de 7 dias e as sessões cujo token atual expirou há
  mais de 7 dias. Um job periódico fica para quando houver agendador.
- **Senhas:** hash com `scrypt` de `node:crypto`, com os parâmetros
  `N=2^15`, `r=8`, `p=1`, chave de 64 bytes e `maxmem` de 64 MiB. O salt é
  aleatório (16 bytes) por senha, e a comparação é feita em tempo constante
  (`timingSafeEqual`). O hash armazenado inclui os parâmetros, para permitir
  aumentar o custo no futuro. Não há dependência nativa.
- **Erros:** falha de login responde 401 com mensagem única ("E-mail ou senha
  inválidos"), sem revelar se o e-mail existe.
- **Persistência:** duas tabelas no contrato Prisma:
  - `sessions` tem uma linha por login, com o usuário e a revogação (instante e
    motivo);
  - `refresh_tokens` tem uma linha por token emitido, com a sessão, o usuário, o
    token anterior (`previousTokenId`, único), o hash, a expiração e a data de
    criação.

  A migração depende de autorização separada, conforme o `AGENTS.md`.

## 3. Consequências

### Positivas
- O access token não fica em armazenamento persistente do navegador, o que reduz o
  impacto de XSS.
- O cookie `SameSite=Strict` restrito a `/auth` limita o uso do refresh token por CSRF.
- As sessões podem ser revogadas individualmente ou todas de uma vez.
- O `pid` no token evita uma consulta extra ao banco para descobrir o perfil em cada
  requisição.

### Negativas e Riscos
- Um access token vazado continua válido por até 15 minutos. **Mitigação:** a
  validade é curta, e a troca de senha revoga todas as sessões.
- Exige duas tabelas e uma migração, e a cadeia de tokens cresce com o uso.
  **Mitigação:** o modelo é isolado do domínio, e a limpeza oportunista remove
  sessões encerradas.
- A SPA e a API precisam estar no mesmo site para `SameSite=Strict`. Em
  desenvolvimento, isso vale para `localhost:4200` e `localhost:8080`; a API deve
  habilitar CORS com `credentials` só para a origem configurada.
- Se a resposta de um refresh se perder na rede, o navegador fica com o cookie
  antigo, que já tem sucessor. Nos 30 s seguintes as tentativas recebem 409, e
  depois disso a reapresentação conta como reuso e revoga todas as sessões do
  usuário, que precisa entrar de novo. **Mitigação:** a validade curta do access
  token e a repetição única do front tornam o caso raro. Recuperar o token
  perdido exigiria guardar o valor em claro ou permitir mais de um sucessor, e as
  duas opções enfraquecem a detecção de reuso.
- O scrypt custa CPU e memória a cada login, e o corte 1 ainda não limita
  tentativas. **Mitigação:** antes de deploy público, `POST /auth/login` limita
  cada IP a 20 tentativas por 15 minutos e cada e-mail normalizado a 5 falhas por
  15 minutos; um login bem-sucedido limpa as falhas daquele e-mail.
  `POST /auth/register` limita cada IP a 5 tentativas por hora. O excesso retorna
  429 com `Retry-After` e mensagem genérica. Os contadores são mantidos em memória:
  funcionam somente em instância única e zeram ao reiniciar. Atrás de proxy
  reverso, `trust proxy` precisa ser configurado para `req.ip` representar o IP
  real; ele não é habilitado por padrão.
- Um segredo JWT fraco compromete tudo. **Mitigação:** `JWT_SECRET` é validado no
  `env.ts` com pelo menos 32 caracteres.

## 4. Alternativas Consideradas

### JWT apenas em cookie httpOnly
- **Descrição:** um único JWT de longa duração em cookie, sem tabela.
- **Razão para Rejeição:** não permite revogar a sessão antes de expirar; o logout
  apenas apaga o cookie do navegador.

### Sessão no servidor
- **Descrição:** cookie com ID de sessão, e a sessão consultada no banco a cada requisição.
- **Razão para Rejeição:** exige uma consulta por requisição e acopla toda a API a
  estado no servidor, sem ganho relevante sobre a rotação de refresh tokens.

### Access token em `localStorage`
- **Descrição:** o front persiste o JWT e o envia como Bearer.
- **Razão para Rejeição:** fica exposto a qualquer XSS e não é revogável.

## 5. Referências

- [`AGENTS.md`](../../AGENTS.md)
- [Arquitetura](../architecture.md)
- [Requisitos](../requirements.md): RF-001 e RNF-003, RNF-005
- [Plano do corte 1](../plano-corte-1-backend.md)

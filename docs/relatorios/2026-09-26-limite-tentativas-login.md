# Relatório de limite de tentativas de autenticação

## Metadata da Sessão

| Campo                  | Valor                                    |
| ---------------------- | ---------------------------------------- |
| **Título**             | Limite de tentativas em login e cadastro |
| **Data**               | 2026-09-26 09:49:59 -03                  |
| **Autor**              | Codex                                    |
| **LLM Utilizada**      | OpenAI                                   |
| **Modelo**             | GPT-6                                    |
| **Reasoning Effort**   | N/A                                      |
| **Branch de Trabalho** | `feature/limite-tentativas-login`        |

## 1. Resumo Executivo

Implementado rate limiting em memória para `POST /auth/login` e
`POST /auth/register`, conforme decisão de 26/09/2026 e ADR 0002. O login limita
por IP a 20 tentativas em 15 minutos e por e-mail normalizado a 5 falhas em 15
minutos. O cadastro limita por IP a 5 tentativas por hora. Excesso retorna 429,
envelope padrão genérico e `Retry-After`. Não houve alteração de contrato Prisma,
migração, acesso ao banco, dependência npm ou push.

## 2. Detalhamento das Alterações Realizadas

- Criada a porta `RateLimiter` e `InMemoryRateLimiter`, com relógio injetável,
  janelas, reset de contadores, e remoção de chaves expiradas nas operações.
- Adicionado `TooManyRequestsError` na hierarquia `ApiError`; o middleware global
  inclui `Retry-After` e mantém o envelope padrão.
- As rotas de login/cadastro aplicam limites por `req.ip`. O service normaliza o
  e-mail, conta apenas falhas, bloqueia antes da verificação de senha depois de
  cinco falhas, e limpa o contador após login bem-sucedido.
- Atualizados ADR 0002 e plano do corte 1 com valores, estado em memória,
  instância única, reset no reinício e configuração futura de `trust proxy`.
- Testes cobrem 6ª tentativa por e-mail, 21ª tentativa por IP, 6ª tentativa de
  cadastro, header e envelope de 429, expiração, isolamento entre chaves,
  liberação de contador por sucesso e ausência de chamada do hasher quando
  bloqueado.

### Commits Criados

- `169d594865ed7dd0aa4d12e518df521b8755510b` — `feat(auth): limita tentativas de login e cadastro`
- `db9a58d420eeac57f198ec8e3faa7c64544ed3f6` — `docs(auth): registra limite de tentativas`
- `ce95663` — `docs(auth): registra hash do relatório`
- `4a49eab91b81a66680393e871d28e1b5b1c32f62` — `fix(auth): reserva tentativas e limita limpeza`

### Revisão de segurança e correções

- Reservada cada tentativa de e-mail com `consume` antes de consultar credenciais
  e executar scrypt, tornando o limite síncrono frente a logins concorrentes.
- As reservas por e-mail acontecem de forma síncrona antes do verify: chamadas
  concorrentes excedentes recebem 429 antes do scrypt. Um login bem-sucedido
  apaga as reservas do e-mail.
- A limpeza global de expirados ocorre no máximo a cada 60 segundos; o mapa tem
  teto de 50.000 chaves e remove expirados e, se necessário, as chaves mais
  antigas por ordem de inserção.
- A porta de rate limiter usa `consume`, `check` e `reset`; somente o middleware
  global define `Retry-After`.
- O ADR registra o risco de lockout do e-mail provocado por terceiros e sua
  mitigação pela janela de 15 minutos.
- Teste de concorrência: 10 logins paralelos com verify de 50 ms produzem no
  máximo 5 verificações, 5 erros 401 e 5 erros 429.

### Validações Executadas

- `npm ci`: dependências declaradas instaladas; sem alterações em manifest ou
  lockfile. O npm reportou vulnerabilidades no conjunto de dependências instalado.
- `npm run check`: aprovado após a revisão de segurança.
- `npm test`: 35 arquivos e 238 testes aprovados após a revisão de segurança.
- `npx prettier --check` nos arquivos tocados: aprovado.
- `git diff --check`: aprovado.
- Nenhum comando de banco de dados foi executado.

## 3. Observações, Riscos e Próximos Passos

- **Riscos Residuais:** contadores em memória funcionam em uma única instância e
  zeram ao reiniciar. Atrás de proxy reverso, `trust proxy` deve ser configurado
  para `req.ip` representar o IP do cliente.
- **Pendências:** revisão de segurança por Claude antes do PR, conforme solicitado.
- **Próximos Passos:** revisar a branch e abrir PR para `develop` após a revisão;
  não foi feito push nem aberto PR nesta tarefa.

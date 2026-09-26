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
- `HASH_RELATORIO` — `docs(auth): registra limite de tentativas`

### Validações Executadas

- `npm ci`: dependências declaradas instaladas; sem alterações em manifest ou
  lockfile. O npm reportou vulnerabilidades no conjunto de dependências instalado.
- `npm run check`: aprovado.
- `npm test`: 35 arquivos e 237 testes aprovados.
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

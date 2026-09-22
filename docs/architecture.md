# Arquitetura

## Objetivo

Permitir que finanças, tarefas, calendário e auditoria evoluam de forma
independente, mantendo regras de negócio testáveis e integrações substituíveis.

## Limites

```text
Angular SPA -> HTTP/Express -> casos de uso -> domínio
                                      |-> persistência/Prisma
                                      |-> Google Calendar/Gmail
                                      |-> auditoria e observabilidade
```

- **Domínio:** entidades, valores e invariantes sem dependências de frameworks.
- **Aplicação:** casos de uso e portas para persistência, relógio e provedores.
- **Adaptadores:** controllers Express, repositórios Prisma e clientes Google.
- **Composição:** configuração, injeção de dependências e ciclo do servidor.

Integrações externas devem ser idempotentes, observáveis e tolerantes a retry.
O identificador do provedor não substitui o identificador interno. Datas são
persistidas com fuso/offset quando representam um instante; eventos de dia
inteiro preservam sua semântica de data.

## Decisões pendentes

- estratégia de autenticação e propriedade dos dados;
- armazenamento e rotação segura de tokens OAuth;
- política de sincronização incremental e resolução de conflitos;
- moeda base, contas compartilhadas e recorrência financeira;
- retenção, mascaramento e acesso aos registros de auditoria.

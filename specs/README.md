# Especificações

Reúne requisitos verificáveis antes da implementação. Cada especificação deve
indicar contexto, regra, critérios de aceite, cenários de erro, dependências e
riscos de segurança, sem acoplar o comportamento a Express, Prisma ou Angular.

## Domínios previstos

- `identity`: usuário, perfil, autenticação e conexões OAuth;
- `tasks`: tarefas, prioridades, agenda e tags;
- `finance`: contas, categorias, lançamentos e recorrências;
- `calendar`: espelhamento e sincronização do Google Calendar;
- `audit`: trilha imutável de ações e mudanças relevantes;
- `notifications`: lembretes e comunicações, quando priorizados.

Uma especificação só está pronta quando seus critérios podem ser convertidos em
testes. Mudanças de escopo devem atualizar também
[`docs/requirements.md`](../docs/requirements.md).

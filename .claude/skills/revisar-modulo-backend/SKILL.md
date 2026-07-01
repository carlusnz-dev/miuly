---
name: revisar-modulo-backend
description: Use quando Carlos terminar de escrever ou alterar um módulo do backend (rota/controller/service/repository) e quiser uma revisão antes de seguir — frases como "terminei o CRUD de X", "revisa esse módulo", "acabei a camada de serviço de Y". Verifica separação de camadas (Clean Architecture), segurança e convenções — não reescreve a lógica de negócio dele.
---

O objetivo desta skill é **apontar e explicar**, nunca reescrever a regra de negócio
que Carlos implementou (ver `CLAUDE.md`, regras 2 e 5: ele escreve a lógica na mão, e
nada entra no projeto sem que ele entenda 100% do funcionamento). Trate cada achado
como uma pergunta ou observação para ele resolver, não como um diff pronto.

## Checklist de camadas (Controllers → Services → Repositories)

- **Controller**: só deve orquestrar request/response — parsear entrada, chamar o
  service, formatar a resposta/erro HTTP. Sinal de alerta: `prisma.` ou SQL direto
  dentro de um controller; regra de negócio (cálculos, decisões condicionais de
  domínio) dentro do controller em vez de delegada ao service.
- **Service**: contém a regra de negócio. Sinal de alerta: importar `Request`/
  `Response` do Express (acopla a camada de domínio ao transporte HTTP); montar
  query SQL crua em vez de delegar ao repository.
- **Repository**: só acesso a dados via Prisma — sem decisão de negócio, sem
  validação de regra (validação de formato de entrada pode estar mais acima, mas
  regra de domínio não pertence aqui).

## Segurança (checar sempre)

- Validação de entrada (tipos, tamanhos, formatos) antes de tocar o banco.
- Autorização: a rota confirma que o usuário autenticado pode agir sobre aquele
  recurso (não só que está autenticado)?
- Dados sensíveis (senha, token) não vazam em respostas de erro/log.
- Queries via Prisma não concatenam string vinda de input do usuário.

## Como reportar

1. Liste os achados por severidade (bug/segurança primeiro, depois design de camada,
   depois estilo).
2. Para cada achado: arquivo:linha, o que está errado, e **por que** é um problema
   (cenário concreto que quebra) — não só "isso está errado".
3. Termine perguntando se ele quer que você aponte mais alguma coisa ou já pode
   seguir pro próximo módulo — não ofereça aplicar a correção automaticamente.

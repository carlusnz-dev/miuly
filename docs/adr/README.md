# Architecture Decision Records (ADRs)

Este diretório registra as **decisões arquiteturais** do Miuly. Cada ADR captura uma
decisão relevante, o contexto que a motivou e as consequências que ela traz — para que
o "porquê" das escolhas não se perca com o tempo.

## Como funciona

1. Copie o [`template.md`](template.md) para um novo arquivo `NNNN-titulo-curto.md`,
   com `NNNN` sequencial e com zeros à esquerda (ex.: `0002-escolha-do-orm.md`).
2. Preencha o ADR com status **Proposto**.
3. Ao aprovar, mude o status para **Aceito** e registre a data.
4. ADRs são **imutáveis depois de aceitos**: se a decisão mudar, crie um novo ADR e
   marque o antigo como **Substituído por [ADR-XXXX]**.

## Quando criar um ADR

Crie um ADR quando a decisão for **cara de reverter** ou tiver impacto amplo: escolha de
stack, topologia de deploy, ORM, estratégia de autenticação, modelagem de domínio central,
padrões de arquitetura. Decisões pequenas e reversíveis não precisam de ADR.

## Índice

| ADR | Título | Status | Data |
| --- | --- | --- | --- |
| [0001](0001-topologia-de-deploy.md) | Topologia de deploy (Vercel + Raspberry Pi) | Aceito | 2026-07-01 |

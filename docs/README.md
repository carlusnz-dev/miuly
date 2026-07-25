# Documentação — Miuly

> Mapa geral dos documentos do projeto. Todos seguem o
> [padrão de arquivos Markdown](padrao-markdown.md).

## Tipos de documento

| Tipo | Pasta | O que é |
|------|-------|---------|
| **ADR** | [`adr/`](adr/README.md) | Decisões arquiteturais (caras de reverter). Imutáveis após aceitas. |
| **Relatório** | [`relatorios/`](relatorios/README.md) | Memória de cada sessão de estudo/implementação. |
| **Plano** | [`planos/`](planos/README.md) | Planos de trabalho e workflows operacionais. |
| **Doc de projeto** | `./` | Documentos vivos de escopo e status (abaixo). |

## Documentos de projeto

| Documento | Descrição |
|-----------|-----------|
| [`plano-mvp.md`](plano-mvp.md) | Conceito, escopo, requisitos e cronograma do MVP (prazo 16/jul/2026). |
| [`rastreabilidade-requisitos.md`](rastreabilidade-requisitos.md) | Matriz requisito ↔ implementação ↔ status. Fonte de verdade do que está feito. |
| [`padrao-markdown.md`](padrao-markdown.md) | Convenção de nomenclatura e estrutura dos docs. |

## Estrutura de pastas

```
docs/
├── README.md                    este índice
├── padrao-markdown.md           convenção dos documentos
├── plano-mvp.md                 escopo e cronograma do MVP
├── rastreabilidade-requisitos.md  matriz de requisitos
├── adr/                         Architecture Decision Records
├── relatorios/                  memória de sessões
└── planos/                      planos e workflows
```

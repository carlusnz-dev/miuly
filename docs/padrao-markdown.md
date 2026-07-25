---
titulo: Padrão de arquivos Markdown do Miuly
data: 2026-07-15
tipo: referencia
status: ativo
---

# Padrão de arquivos Markdown — Miuly

> Convenção de como nomear, estruturar e versionar os documentos Markdown do projeto.
> Objetivo: manter a documentação consultável (por humano e por IA) e consistente,
> alinhada ao fluxo "documentação-first" do `CLAUDE.md`.

## 1. Nomenclatura por tipo

Regra única de nome: **kebab-case** — só minúsculas, palavras separadas por `-`,
**sem `_`, sem acento, sem espaço**.

| Tipo | Local | Padrão de nome | Exemplo |
|------|-------|----------------|---------|
| ADR | `docs/adr/` | `NNNN-titulo-kebab.md` | `0006-estrategia-de-jwt.md` |
| Relatório | `docs/relatorios/` | `YYYY-MM-DD-assunto.md` | `2026-07-15-code-review-mvp.md` |
| Plano | `docs/planos/` | `assunto-kebab.md` | `workflow-mcp-agy-bridge.md` |
| Doc de projeto | `docs/` | `assunto-kebab.md` | `plano-mvp.md`, `rastreabilidade-requisitos.md` |

- **ADR** usa prefixo numérico sequencial (`0001`, `0002`, …) porque a ordem de decisão
  importa e o número vira identificador estável (referenciável como "ADR-0006").
- **Relatório** usa prefixo de data (`YYYY-MM-DD`) porque a ordenação cronológica é o
  que interessa: o sistema de arquivos já ordena sozinho.

## 2. Frontmatter (metadados)

Frontmatter YAML **opcional**, usado onde agrega valor de consulta (relatórios, planos,
docs de projeto). Deixa o documento filtrável por metadado sem abrir o corpo — mesmo
princípio das *properties* do Obsidian.

```yaml
---
titulo: Code-review do MVP
data: 2026-07-15
tipo: relatorio        # adr | relatorio | plano | requisitos | referencia
status: rascunho       # rascunho | ativo | concluido | descontinuado
rf_relacionados: [RF002, RF006]   # opcional, quando o doc trata de requisitos
---
```

> ADRs seguem o próprio `template.md` (que já tem cabeçalho de Status/Contexto/Decisão)
> e não precisam replicar este frontmatter.

## 3. Cabeçalho do corpo

Todo documento começa com:

1. `# Título` (um só `h1`, no topo).
2. Um `> blockquote` de **uma linha** dizendo *o que é o documento e para que serve*.

Exemplo (este próprio arquivo). O blockquote é a "primeira frase" que orienta quem abre
o doc — e a IA usa para decidir relevância.

## 4. Índices por pasta

Cada pasta de tipo tem um `README.md` que serve de índice do que existe ali:

- `docs/README.md` — mapa geral dos tipos de documento (raiz de `docs/`).
- `docs/adr/README.md` — índice dos ADRs (já existente).
- `docs/relatorios/README.md` — índice dos relatórios.
- `docs/planos/README.md` — índice dos planos.

## 5. Idioma e estilo

- Idioma: **português (pt-BR)**, conforme convenção do projeto.
- Preferir linhas de até ~90 colunas para diffs legíveis (não é regra rígida).
- Tabelas para dados comparáveis; listas para passos/itens; blockquote para notas.

## Referências externas úteis

- [Diátaxis](https://diataxis.fr/) — como classificar tipos de documentação.
- [Arc42](https://arc42.org/overview) — estrutura de documentação de arquitetura.
- [Documenting Architecture Decisions (Michael Nygard)](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions) — origem do formato ADR.

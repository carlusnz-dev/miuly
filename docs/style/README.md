# Direção visual para dashboards Miuly

**Atualizado em 24/09/2026.** Direção visual do frontend Angular 22 para autenticação e shell. Não cria requisitos funcionais para finanças, tarefas, calendário ou identidade. A base global fica em `frontend/src/styles.scss` e os estilos locais junto de cada componente; veja [arquitetura do frontend](../frontend-architecture.md).

## Decisões aplicáveis

1. **Escuro com verde como primária:** fundo `#101612`, superfície `#18211b`, texto principal `#f2f7f2` e primária `#91dfaa`. Evitar azul em qualquer estado.
2. **Hierarquia calma:** título da página, resumo, ação principal e conteúdo em ordem de leitura. Cabeçalho e navegação lateral somente quando houver função. Limitar a largura de leitura a `80rem` e usar espaço entre grupos antes de acrescentar cartões. O [Primer Layout](https://primer.style/product/getting-started/foundations/layout/) recomenda regiões claras e simplificação de colunas em telas estreitas.
3. **Bordas finas:** 1 px para separar superfícies; `#2b3a30` é divisória decorativa. Para campos, usar `#698371` sobre `#1b261f` (contraste calculado de ~3,78:1). Bordas do menu lateral são suaves.
4. **Tipografia:** fonte de sistema, título entre `1.5rem` e `2rem`, corpo `1rem`, metadados no mínimo `0.875rem` quando legíveis. Usar tabulares (`font-variant-numeric: tabular-nums`) em valores alinhados. Reservar negrito para títulos, totais e ação principal.
5. **Movimento:** transições de `180ms` em controles. O mesh decorativo pode se mover lentamente; `prefers-reduced-motion: reduce` o torna estático e remove transições não essenciais ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/%40media/prefers-reduced-motion)).
6. **Tokens semânticos:** nomes como `--miuly-surface` e `--miuly-text-muted` em vez de `--gray-900`. [Primer Color Usage](https://primer.style/product/getting-started/foundations/color-usage/) usa tokens por função para manter coerência entre estados e temas. Sass `@use` serve para mixins e constantes de compilação, enquanto propriedades CSS permitem trocar valores em tempo de execução ([Sass](https://sass-lang.com/documentation/at-rules/use/)).

## Referências visuais e decisão de uso

As referências específicas desta remodelação e suas limitações estão em
[referencias/README.md](referencias/README.md). As imagens fornecidas pelo
produto ainda não estavam disponíveis na pasta na implementação inicial.

### Tokens e componentes desta remodelação

| Token                                                     | Uso                                                |
| --------------------------------------------------------- | -------------------------------------------------- |
| `--miuly-bg`, `--miuly-surface`, `--miuly-surface-raised` | Fundo único e níveis discretos de superfície.      |
| `--miuly-field`, `--miuly-control-border`                 | Campo de baixo contraste com limite identificável. |
| `--miuly-text`, `--miuly-text-muted`                      | Texto principal e apoio.                           |
| `--miuly-primary`, `--miuly-primary-hover`                | Ação, foco, seleção e links.                       |
| `--miuly-error`, `--miuly-error-border`                   | Mensagem e foco de campo inválido.                 |

O campo reutilizável põe a label dentro do input e a move quando ele recebe
foco ou tem valor. A mensagem de erro cresce abaixo do campo com deslocamento
vertical e preserva `aria-invalid` e `aria-describedby`; dicas permanecem
associadas. O botão reutilizável é um `button` real, desabilitado quando o
formulário é inválido ou está enviando, com brilho radial sob o ponteiro,
transição de entrada e saída, press com escala discreta e brilho concentrado,
e foco visível. Links de entrada e cadastro não
têm sublinhado; no hover, ficam mais claros.

Login e cadastro ocupam a viewport sem cabeçalho ou rodapé. O painel esquerdo
usa gradientes verdes e textura granulada, com margem pequena e todos os cantos
arredondados. Ele permanece montado ao alternar login e cadastro, enquanto
eyebrow, título, introdução, campos, botão e link entram em sequência com
deslocamento vertical e opacidade. Movimento reduzido mostra esses elementos
imediatamente, sem deslocamento. O formulário de login não tem card.
Cadastro usa duas colunas no desktop e uma em telas estreitas. O shell principal
usa menu lateral arredondado com oito áreas previstas, todas desabilitadas, e
cabeçalho no conteúdo com a ação de sair e seu erro. As páginas entram por rota
na área de conteúdo. O shell ainda não representa dados reais das áreas futuras.

| Fonte primária                                                                                                                                           | O que observar                                                                            | Aplicação no Miuly                                                                                                                 | Imagem local                                                                                              |
| -------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| [Orca IDE — site oficial](https://www.onorca.dev/)                                                                                                       | Áreas de trabalho em painéis, navegação densa, superfícies escuras e divisórias discretas | Manter contexto e ações visíveis sem sobrecarregar o painel principal. É inspiração de composição, não identidade visual a copiar. | Capturas oficiais não foram copiadas: a página não oferece licença de redistribuição explícita para elas. |
| [Primer — Layout](https://primer.style/product/getting-started/foundations/layout/) e [PageLayout](https://primer.style/product/components/page-layout/) | Cabeçalho, conteúdo, painel auxiliar e separação por linhas                               | Usar painel lateral só com finalidade clara; empilhar em telas estreitas.                                                          | Não copiadas; licença das imagens não foi confirmada.                                                     |
| [Primer — Color usage](https://primer.style/product/getting-started/foundations/color-usage/)                                                            | Tema escuro com cores semânticas                                                          | Mapear texto, superfície, borda e estados por função.                                                                              | Não copiadas; licença das imagens não foi confirmada.                                                     |

Os exemplos de interface no site Orca são materiais promocionais e podem mudar. Registrar a URL e a data, sem extrair cores exatas por captura. A ilustração [`wireframe-dashboard.svg`](wireframe-dashboard.svg) é desenho **original desta pesquisa**, inspirado apenas na ideia geral de painéis; não contém imagem nem marca de terceiros. Pode ser usada no projeto Miuly, sujeita à licença do repositório.

![Esquema original: navegação, cabeçalho, métricas e conteúdo principal em tema escuro](wireframe-dashboard.svg)

## Responsividade

- Projetar primeiro para 320 CSS px e verificar reflow sem rolagem horizontal da página; tabelas e gráficos complexos podem ter rolagem própria, com indicação visível. Isso segue [WCAG 1.4.10](https://www.w3.org/WAI/WCAG21/Understanding/reflow).
- Em `<= 48rem`, transformar duas colunas em uma; navegação lateral vira menu acionável com rótulo. Não ocultar conteúdo essencial apenas com `display: none` ([Primer Layout](https://primer.style/product/getting-started/foundations/layout/)).
- Cards usam `minmax(min(100%, 16rem), 1fr)` para evitar overflow. Texto longo recebe `overflow-wrap: anywhere` apenas quando necessário; números não podem ser cortados sem alternativa de leitura.
- Testar 320, 375, 768, 1280 e 1440 CSS px, zoom 200% e texto ampliado. A escolha de breakpoint deve seguir a largura real do conteúdo.

## Acessibilidade e estados

- **Contraste:** texto normal >= 4,5:1, texto grande >= 3:1 e indicadores visuais essenciais de controle/estado >= 3:1, conforme [WCAG 2.2](https://www.w3.org/TR/wcag/). Pares calculados: `#f2f7f2`/`#101612` ~16,90:1, `#b5c4b7`/`#18211b` ~9,07:1, `#91dfaa`/`#18211b` ~10,49:1, `#698371`/`#1b261f` ~3,78:1.
- **Foco:** aplicar `:focus-visible` com contorno sólido de 2 px e afastamento de 2 px; preservar a visibilidade com cabeçalhos fixos e rolagem. [WCAG 2.4.11](https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/) exige que foco não fique totalmente oculto; [WCAG 2.4.13](https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance) é nível AAA e orienta o tamanho do indicador. Nunca usar `outline: none` sem substituto.
- **Alvos:** preferir área interativa >= 44×44 CSS px no móvel; o mínimo do [WCAG 2.5.8 AA](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum) é 24×24 CSS px ou uma exceção aplicável. Ícone sozinho precisa de nome acessível.
- **Loading:** reservar altura da região para evitar salto; mostrar texto “Carregando…” em `role="status"` ou região `aria-live="polite"`. Skeleton é decorativo; não animar sem fim em movimento reduzido. Desabilitar só a ação que não pode ser repetida; manter navegação disponível.
- **Vazio:** diferenciar “sem dados” de erro e carregamento; dizer qual filtro ou período está ativo e oferecer uma ação pertinente quando existir.
- **Erro:** mensagem concreta, sem sumir automaticamente; manter dados já exibidos quando possível e incluir botão “Tentar novamente”. Usar `role="alert"` somente para erro urgente, pois interrompe a leitura ([MDN](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/alert_role)). Para mensagens ordinárias, `role="status"` ([W3C](https://www.w3.org/WAI/WCAG21/Techniques/aria/ARIA22)).
- **Seleção e dados:** não depender só da cor; combinar texto, ícone ou padrão. Gráficos precisam de título e resumo textual dos valores principais. Definir estados hover, foco, ativo, desabilitado, loading, vazio e erro antes de aprovar um componente.

## Bons e maus exemplos

| Fazer                                                              | Evitar                                                       | Motivo                                     |
| ------------------------------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------ |
| Um título, resumo curto e ação principal identificável             | Cinco cartões com igual peso visual e ações concorrentes     | Leitura e prioridade ficam claras.         |
| Divisória sutil entre regiões e contorno contrastante em campos    | Usar o mesmo cinza escuro em todas as bordas                 | Campo precisa ser percebido como controle. |
| Botão com texto “Atualizar dados” e foco visível                   | Ícone sem rótulo e `outline: none`                           | Navegação por teclado e leitor de tela.    |
| Região de conteúdo estável com `Carregando…`, depois dados ou erro | Spinner isolado que substitui a página e nunca explica falha | Evita salto e estados ambíguos.            |
| Cards fluídos e tabela com rolagem local identificada              | `width: 1200px` na página toda                               | Evita overflow em 320 CSS px.              |

## Exemplo executável de Sass

O arquivo [`exemplo-dashboard.scss`](exemplo-dashboard.scss) é um **trecho de referência**, não conectado ao build. Ele contém tokens, grid fluído, foco, estados e movimento reduzido. Copiar apenas após adequar aos componentes existentes. Um HTML mínimo para visualizar o exemplo também está em [`exemplo-dashboard.html`](exemplo-dashboard.html); nenhum deles integra o aplicativo.

## Checklist de prevenção de bugs de UI

- [ ] Tela funciona com strings longas, valor zero, erro de rede, lista vazia e loading tardio.
- [ ] Não há overflow horizontal da página em 320 CSS px e zoom 200%; tabelas têm região de rolagem própria.
- [ ] Foco percorre controles em ordem lógica, aparece inteiro e volta ao acionador ao fechar modal/menu.
- [ ] Loading/erro/vazio são distinguíveis em texto; requisição repetida não duplica ação.
- [ ] Cores contrastam nos estados normal, hover, foco, desabilitado e em dados de gráficos.
- [ ] Mudança de tema ou estado não introduz layout shift, flash de cor ou transição quando movimento reduzido.
- [ ] Campos e filtros preservam valor ao receber erro; ação de tentar novamente é alcançável por teclado.
- [ ] Valores monetários têm unidade, separadores e sinal claros; não dependem apenas de cor para positivo/negativo.

# ADR-0010: PrimeNG como biblioteca de componentes de UI

- **Status:** Substituído por [ADR-0011](0011-taiga-ui-como-biblioteca-de-ui.md)
- **Data:** 2026-07-31
- **Decisores:** Carlos (Arquiteto)

## Contexto

O front-end recomeçou do zero em Angular pela [ADR-0009](0009-troca-do-framework-de-frontend-para-angular.md).
O backend já está completo (auth, finanças, contas, categorias e tarefas), então o
front é hoje o único bloqueio do MVP — cujo prazo original (16/jul/2026) já venceu.

Restrições que pesam na escolha:

1. **Tempo.** O MVP está atrasado e o front precisa de várias telas de CRUD
   (formulários, tabelas, selects, date pickers, diálogos de confirmação). Construir
   esses componentes na mão consome o tempo que resta.
2. **Perfil do desenvolvedor.** O foco de aprendizado do projeto é back-end e
   arquitetura; Angular é novo para o Carlos. Reimplementar componentes de UI de uso
   comum não é o aprendizado que ele busca aqui.
3. **O scaffold já tem Tailwind 4** (`@tailwindcss/postcss` + `tailwindcss` em
   `frontend/package.json`), então qualquer biblioteca escolhida precisa conviver com
   ele sem guerra de CSS.

## Decisão

Vamos usar **PrimeNG** como biblioteca de componentes de UI do front-end do Miuly.

- Versão **22.x**, que acompanha o Angular 22 do projeto (`primeng@22.0.0` declara peer
  de `@angular/core ^22.0.0`).
- Traz junto a dependência **`@angular/cdk ^22.0.0`**, exigida como peer.
- Tematização pelo pacote de temas do PrimeNG (`@primeuix/themes`), configurada via
  `providePrimeNG()` em `app.config.ts`.
- **Tailwind permanece** para layout e espaçamento; PrimeNG cobre os componentes
  (tabela, formulários, diálogos, toasts). A divisão de responsabilidade entre os dois
  precisa ser acertada na configuração — ver follow-ups.

## Alternativas consideradas

- **PrimeNG (escolhida)** — catálogo grande (DataTable com paginação e ordenação
  prontas, formulários, date picker, diálogos), tematização centralizada e versionamento
  alinhado ao Angular. Vence pelo critério decisivo: **velocidade de entrega**.
- **Angular Material** — biblioteca oficial do time Angular, integração garantida e
  acessibilidade forte. Catálogo menor em componentes de dados (a tabela exige mais
  montagem manual) e visual fortemente amarrado ao Material Design, que exige trabalho
  para descaracterizar.
- **Sem biblioteca, só Tailwind** — controle total do visual e zero dependência nova,
  mas transfere para o Carlos a construção de cada componente. Contraria diretamente a
  restrição de tempo. Rejeitada.

## Consequências

- **Positivas:** telas de CRUD saem muito mais rápido; comportamentos difíceis de
  acertar na mão (acessibilidade, foco em diálogo, navegação por teclado, paginação)
  vêm resolvidos; visual consistente entre telas sem precisar desenhar um design system.
- **Negativas / trade-offs:**
  - **Dependência de terceiro no caminho crítico da UI.** Atualização de major do
    Angular passa a depender também do release correspondente do PrimeNG.
  - **Peso no bundle.** Impacta o RNF006 (resposta em até 1,5 s), já pressionado por a
    aplicação ser SPA sem SSR. Mitigável com import por componente (standalone) em vez
    de importar tudo.
  - **Menos aprendizado de CSS/componentização.** É uma troca consciente: o objetivo
    educacional do projeto está no back-end e na arquitetura.
  - **Duas fontes de estilo** (PrimeNG + Tailwind) exigem definir ordem de camadas de
    CSS para não haver conflito de especificidade.
- **Follow-ups:**
  - Instalar `primeng`, `@primeuix/themes` e `@angular/cdk`, e configurar
    `providePrimeNG()` em `frontend/src/app/app.config.ts`.
  - **Verificar na documentação oficial a integração PrimeNG + Tailwind 4** (ordem de
    `@layer` e o plugin de integração) antes de escrever a primeira tela — é o ponto de
    atrito mais provável e o mais chato de corrigir depois.
  - Definir a divisão de responsabilidade: Tailwind para layout/espaçamento, PrimeNG
    para componentes. Registrar a convenção no `CLAUDE.md`.
  - Escolher o tema base e decidir se haverá customização de cores do Miuly.
  - A biblioteca de animação (pendência aberta desde a ADR-0009) pode ser dispensável
    se as animações do PrimeNG cobrirem a necessidade — avaliar antes de adicionar
    outra dependência.

# ADR-0011: Taiga UI como biblioteca de componentes de UI

- **Status:** Proposto
- **Data:** 2026-07-31
- **Decisores:** Carlos (Arquiteto)
- **Substitui:** [ADR-0010](0010-primeng-como-biblioteca-de-ui.md)

## Contexto

A [ADR-0010](0010-primeng-como-biblioteca-de-ui.md) registrou **PrimeNG** como
biblioteca de componentes de UI, com status *Proposto* e sem nenhuma linha de código
escrita a partir dela. Nenhum dos seus follow-ups chegou a ser executado: `primeng` e
`@primeuix/themes` nunca foram instalados e `providePrimeNG()` nunca foi configurado.

O que existe hoje no repositório é **Taiga UI**, já instalado e parcialmente ligado:

- `frontend/package.json` declara `@taiga-ui/core`, `@taiga-ui/kit`, `@taiga-ui/cdk`,
  `@taiga-ui/layout`, `@taiga-ui/icons`, `@taiga-ui/addon-table` e
  `@taiga-ui/addon-charts` na versão `^5.17.0`, além de `@angular/cdk ^22.0.0`.
- `frontend/src/app/app.config.ts` já chama `provideTaiga()`.
- `frontend/src/app/app.ts` já importa `TuiRoot`.

Ou seja: a documentação e o código divergem, e a divergência precisa ser resolvida
**antes** da primeira tela — o módulo de autenticação do front é o próximo item do
caminho crítico do MVP, cujo prazo original (16/jul/2026) já venceu.

As restrições que motivaram a ADR-0010 continuam valendo: tempo curto, Angular novo
para o Carlos, foco de aprendizado no back-end, e Tailwind 4 já presente no scaffold.

## Decisão

Vamos usar **Taiga UI** como biblioteca de componentes de UI do front-end do Miuly,
substituindo a decisão da ADR-0010.

- Versão **5.x** (`^5.17.0`), já instalada.
- Configuração por `provideTaiga()` em `frontend/src/app/app.config.ts` e o wrapper
  `TuiRoot` no componente raiz — ambos já presentes.
- Pacotes adotados: `core` e `kit` (componentes), `cdk` (primitivas), `layout`,
  `icons`, e os addons `table` e `charts` para as telas de finanças.
- **Tailwind permanece** para layout e espaçamento; Taiga UI cobre os componentes
  (formulários, inputs, tabela, diálogos, notificações).
- Consequência direta: `primeng` e `@primeuix/themes` **não** entram no projeto.

**Critério do Carlos:** dois motivos, nesta ordem — (1) o Taiga UI **já está instalado
e ligado**, então adotá-lo custa zero e não atrasa a tela de login, enquanto voltar ao
PrimeNG custaria desinstalação, instalação e configuração; (2) **preferência pela API**,
que ele considera mais limpa que a do PrimeNG.

> **Nota de verificação (2026-07-31).** A decisão também considerou a hipótese de que o
> PrimeNG teria passado a ser pago. **A hipótese não se confirmou:** o pacote npm
> `primeng` é **MIT** e o core segue gratuito, inclusive para uso comercial. O que é
> comercial são produtos periféricos da PrimeTek — PrimeBlocks, os templates de
> dashboard e o **LTS** para versões EOL. Licenciamento, portanto, **não** é critério
> válido nesta decisão, e os dois motivos acima sustentam a escolha sozinhos.
> Para simetria: o Taiga UI é **Apache-2.0**, originado no Tinkoff e mantido hoje pelo
> coletivo `taiga-family`. Ambas as licenças são permissivas e nenhuma restringe o uso
> no Miuly.

## Alternativas consideradas

- **Taiga UI (escolhida)** — biblioteca open-source de componentes Angular, com
  catálogo amplo (formulários, tabela via `addon-table`, gráficos via `addon-charts`),
  tematização por CSS custom properties e API pensada para componentes standalone.
  Licença **Apache-2.0**. Vence por dois motivos: **já está instalada e ligada**, então
  o custo de adotá-la agora é zero, e o Carlos considera sua **API mais limpa**.
- **PrimeNG** — decisão anterior (ADR-0010). Catálogo grande, versionamento alinhado
  ao Angular e licença **MIT** (o core é gratuito; só PrimeBlocks, templates e LTS são
  comerciais). Perde por representar hoje **trabalho a mais**: desinstalar o Taiga,
  instalar `primeng` + `@primeuix/themes`, configurar `providePrimeNG()` e resolver a
  convivência com o Tailwind 4 — tudo antes de escrever a primeira tela.
- **Angular Material** — oficial do time Angular, acessibilidade forte, mas catálogo
  menor em componentes de dados e visual amarrado ao Material Design. Já havia sido
  descartada na ADR-0010, pelos mesmos motivos.
- **Sem biblioteca, só Tailwind** — controle total, zero dependência nova, mas
  transfere a construção de cada componente para o Carlos. Contraria a restrição de
  tempo. Rejeitada, como na ADR-0010.

## Consequências

- **Positivas:**
  - Elimina a divergência entre documentação e código, que é dívida ativa.
  - Custo de adoção zero: os pacotes já estão instalados e o `provideTaiga()` já está
    no `app.config.ts`. Nada bloqueia a tela de login.
  - Componentes de formulário e tabela prontos, incluindo comportamentos caros de
    acertar na mão (acessibilidade, foco em diálogo, navegação por teclado, paginação).
- **Negativas / trade-offs:**
  - **Dependência de terceiro no caminho crítico da UI.** Atualização de major do
    Angular passa a depender também do release correspondente do Taiga UI. O risco é
    o mesmo que a ADR-0010 já aceitava, apenas com outro fornecedor.
  - **Comunidade e material em português menores que os do PrimeNG e do Angular
    Material.** Em caso de dúvida, a fonte prática será a documentação oficial e o
    repositório, não tutoriais em vídeo.
  - **Peso no bundle**, pressionando o RNF006 (resposta em até 1,5 s) numa SPA sem
    SSR. Mitigável importando componente a componente (standalone), nunca em bloco.
  - **Duas fontes de estilo** (Taiga UI + Tailwind) exigem definir a ordem de camadas
    de CSS para evitar conflito de especificidade. O problema não desapareceu com a
    troca de biblioteca — apenas mudou de nome.
  - **Menos aprendizado de CSS/componentização.** Troca consciente, herdada da
    ADR-0010: o objetivo educacional do projeto está no back-end e na arquitetura.
- **Follow-ups:**
  - Marcar a [ADR-0010](0010-primeng-como-biblioteca-de-ui.md) como *Substituída por
    ADR-0011* e atualizar o índice em [README.md](README.md).
  - Atualizar o `CLAUDE.md` da raiz, que ainda aponta a ADR-0010/PrimeNG.
  - **Verificar na documentação oficial a importação dos estilos do Taiga UI e a
    convivência com o Tailwind 4** (ordem de `@layer`) antes da primeira tela — é o
    ponto de atrito mais provável e o mais chato de corrigir depois.
  - Limpar o `TuiRoot` duplicado no array `imports` de `frontend/src/app/app.ts`.
  - Definir e registrar a convenção: Tailwind para layout/espaçamento, Taiga UI para
    componentes.
  - Escolher o tema base e decidir se haverá customização de cores do Miuly.
  - A biblioteca de animação (pendência aberta desde a ADR-0009) pode ser dispensável
    se as animações do Taiga UI cobrirem a necessidade — avaliar antes de adicionar
    outra dependência.

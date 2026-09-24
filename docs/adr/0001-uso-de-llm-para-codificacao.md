# ADR 0001: Uso de LLM para codificação

- **Status:** Aceita
- **Data:** 2026-09-23

## Contexto

A governança inicial do Miuly limitava agentes baseados em LLM a inspeção,
diagnóstico, testes e documentação. Código de produção deveria ser implementado
exclusivamente por uma pessoa, com exceção dos contratos Prisma expressamente
autorizados.

O volume de projetos e a evolução das ferramentas de desenvolvimento assistido
tornaram essa restrição incompatível com a velocidade de entrega pretendida. Ao
mesmo tempo, conceder autonomia irrestrita introduziria riscos de ampliação de
escopo, regressões, alterações inseguras e perda de rastreabilidade.

## Decisão

LLMs podem implementar e alterar código de produção do backend e do frontend
quando o usuário solicitar explicitamente a mudança e seu escopo estiver claro.

A implementação assistida deve:

- limitar-se aos arquivos e efeitos necessários ao pedido;
- preservar mudanças preexistentes e trabalho paralelo;
- manter requisitos, contratos, testes e documentação coerentes;
- executar validações proporcionais ao risco e relatar limitações;
- interromper a implementação quando faltar uma decisão material de produto,
  dados, segurança ou compatibilidade;
- manter revisões formais em modo somente leitura;
- exigir autorização separada para migrações e comandos que leiam ou alterem
  bancos de dados.

A responsabilidade pela aceitação da mudança continua humana. Código produzido
por LLM segue o mesmo fluxo Git, critérios de qualidade e revisão aplicados a
código produzido manualmente.

## Consequências

### Positivas

- maior velocidade para criar e manter múltiplos projetos;
- possibilidade de delegar implementação, testes e documentação no mesmo fluxo;
- decisões e validações permanecem rastreáveis no repositório.

### Negativas e riscos

- revisão humana passa a exigir atenção a código plausível, mas incorreto;
- tarefas com escopo ambíguo podem gerar implementação divergente;
- o ganho de velocidade pode aumentar débito técnico sem testes e limites
  arquiteturais consistentes.

Os controles desta decisão reduzem esses riscos, mas não substituem revisão,
testes nem responsabilidade sobre a entrega.

## Alternativas consideradas

### Manter LLMs somente para inspeção

Rejeitada porque preservaria controle elevado, mas não atenderia à necessidade de
escalar a implementação de vários projetos.

### Autorizar implementação irrestrita

Rejeitada porque removeria controles de escopo, banco de dados, revisão e
rastreabilidade necessários ao projeto.

## Referências

- [`AGENTS.md`](../../AGENTS.md)
- [Arquitetura](../architecture.md)
- [Contribuição e versionamento](../contributing.md)

# cto-mcp

Base oficial de automacao do ecossistema `ControleOnline` para agents que rodam no GitHub.

## Organizacao

Este repositorio passa a concentrar tambem a biblioteca de skills operacionais usada pelos agents.

Com isso:

- wrappers podem ficar finos
- instrucoes compartilhadas vivem em `skills/`
- materiais exclusivos do CTO ficam separados dos compartilhados
- memoria continua fora do repositorio, como apoio persistente

## Estrutura principal

- `skills/README.md`: mapa da biblioteca
- `skills/shared/README.md`: politicas e evidencias compartilhadas
- `skills/agents/*/README.md`: orientacao por tipo de agent
- `skills/runners/README.md`: mapa dos workflows, entry points e trilhas reais
- `agents/agent/*/agent.md`: entradas canonicas por agent
- `.github/agents/*.agent.md`: wrappers finos

# agents-mcp

Base oficial de automacao do ecossistema `ControleOnline` para agents que rodam no GitHub.

## Organizacao

Este repositorio concentra a biblioteca central de skills operacionais usada pelos agents.

Com isso:

- wrappers ficam finos
- instrucoes compartilhadas vivem em `skills/`
- conhecimentos por agent vivem em `skills/agents/`
- mapas de runtime vivem em `skills/runners/`
- materiais exclusivos do CTO ficam separados dos compartilhados
- memoria continua fora do repositorio, como apoio persistente

## Estrutura principal

- `skills/README.md`: mapa da biblioteca
- `skills/shared/README.md`: politicas, governanca e evidencias compartilhadas
- `skills/agents/*/README.md`: orientacao por tipo de agent
- `skills/runners/README.md`: mapa dos workflows, entry points e trilhas reais
- `agents/agent/*/agent.md`: entradas canonicas por agent
- `.github/agents/*.agent.md`: wrappers finos
- `scripts/sync-copilot-agents.mjs`: sincronizacao dos wrappers locais

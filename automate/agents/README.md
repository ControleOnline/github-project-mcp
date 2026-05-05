# Agents

Esta pasta organiza os pontos de entrada e a documentação operacional por agent.

## Estrutura

- `developer/dispatch.mjs`: entrada operacional do despacho do `Developer`
- `qa/dispatch.mjs`: entrada operacional do despacho do `Quality Assurance`
- `qa/review.mjs`: entrada de compatibilidade para a revisão de `Quality Assurance`
- `security/dispatch.mjs`: entrada operacional do despacho do `Security`
- `security/review.mjs`: entrada de compatibilidade para a revisão de `Security`

## Regra de ownership

- o runner do GitHub deve preferir executar a entrada do agent dentro de `automate/agents/<agent>/`
- os arquivos legados em `automate/scripts/` permanecem apenas como base compartilhada ou compatibilidade de caminho
- a política funcional continua documentada nos arquivos `.md` já existentes em `automate/`

Com isso, a árvore deixa explícito onde começa cada fluxo de agent, sem quebrar os workflows já publicados.

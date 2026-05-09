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

## Override manual ativo

- issue com `agent:*`, assignee humano e sem assignee técnico conhecido do Copilot deve ser lida como `override manual ativo`
- esse estado prova atividade operacional do fluxo, mas não prova captura first-party do Copilot cloud agent
- enquanto o bloqueio repo-local continuar materialmente o mesmo, a higiene operacional não deve remover esse assignee humano apenas para “limpar a fila”
- se o owner humano for liberado sem novo delta técnico verificável, o dispatcher pode reatribuir a mesma issue e republicar comentário de início do agent, reabrindo ruído sem progresso real
- só vale soltar o override manual quando houver mudança concreta de trilha, como novo PR, novo head SHA, novo review, mudança de label/status ou encerramento explícito do bloqueio

Com isso, a árvore deixa explícito onde começa cada fluxo de agent, sem quebrar os workflows já publicados.

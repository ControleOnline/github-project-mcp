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

## Gates repo-locais e checks externos

- PR com `Scrutinizer` em `error` ou `failure`, sem `workflow_run` local observável no head atual, deve ser lido como bloqueio repo-local de composição, onboarding ou automação, e não como simples fila nova do agent
- PR com run local em `action_required`, mesmo sem jobs consumíveis na API atual, continua sendo bloqueio real do repositório alvo até surgir nova evidência do próprio repositório
- enquanto esse tipo de gate continuar sem delta técnico verificável, a trilha correta é preservar o ownership atual ou o estado de override já ativo, e não reciclar a issue entre agents apenas para “andar a fila”
- quando o problema dominante estiver nesse gate repo-local, o encaminhamento correto do CTO é registrar a evidência, corrigir o núcleo `cto-mcp` se houver falha estrutural nele, e evitar leitura enganosa de progresso na issue consumidora

Com isso, a árvore deixa explícito onde começa cada fluxo de agent, sem quebrar os workflows já publicados.

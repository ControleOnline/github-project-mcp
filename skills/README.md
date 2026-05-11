# Skills Library

Esta pasta concentra as instrucoes reutilizaveis do `agents-mcp`.

## Camadas

- `shared/README.md`: mapa da camada compartilhada
- `shared/*.md`: skills operacionais, politicas e guardrails reutilizaveis
- `agents/<agent>/README.md`: papel, limites, ownership e handoff por tipo de agent
- `runners/README.md`: mapa dos workflows, entry points e scripts reais

## Regra de composicao

1. identifique o tipo de decisao, investigacao ou execucao
2. leia primeiro a area mais especifica para o caso
3. se a regra servir para mais de um agent, mova para `shared/`
4. mantenha `agents/agent/*/agent.md` apenas como ponto de entrada e papel
5. mantenha wrappers locais finos e sem biblioteca operacional duplicada
6. combine evidencia com mapa de runtime quando a duvida envolver comportamento real
7. use memoria apenas como apoio externo ao repositorio

## Biblioteca operacional compartilhada

As skills compartilhadas incluem, entre outras:

- `shared/agent-execution-baseline.md`
- `shared/agent-handoff-governance.md`
- `shared/agent-wrapper-contract.md`
- `shared/autonomous-operations.md`
- `shared/operational-security-guardrails.md`
- `shared/operational-source-of-truth.md`
- `shared/log-investigation-evidence.md`
- `shared/github-issue-handling.md`
- `shared/operational-github-workflow.md`
- `shared/email-reading-fallback.md`
- `shared/task-completion-criteria.md`

## Nota

Os materiais detalhados de execucao continuam em `automation/` e `automate/`. As skills organizam a governanca e o conhecimento reutilizavel por cima dessa base.

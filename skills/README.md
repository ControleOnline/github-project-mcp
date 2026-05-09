# Skills Library

Esta pasta concentra as instrucoes reutilizaveis do `cto-mcp`.

## Estrutura

- `shared/README.md`: mapa da camada compartilhada
- `shared/*.md`: skills operacionais e politicas reutilizaveis
- `agents/<agent>/README.md`: papel, limites, ownership e handoff por tipo de agent
- `runners/README.md`: mapa dos workflows, entry points e scripts reais

## Regra de uso

1. identifique o tipo de decisao, investigacao ou execucao
2. leia primeiro a area mais especifica
3. combine evidencia com mapa de runtime quando a duvida envolver comportamento real
4. use memoria apenas como apoio externo ao repositorio

## Biblioteca operacional compartilhada

As skills compartilhadas incluem, entre outras:

- `shared/autonomous-operations.md`
- `shared/operational-security-guardrails.md`
- `shared/operational-source-of-truth.md`
- `shared/log-investigation-evidence.md`
- `shared/github-issue-handling.md`
- `shared/operational-github-workflow.md`
- `shared/email-reading-fallback.md`
- `shared/task-completion-criteria.md`

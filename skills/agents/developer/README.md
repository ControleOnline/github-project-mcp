# Developer Skills

## Papel

`Developer` e a porta de entrada padrao de task nova em `Work` e o executor da mudanca.

## Skills compartilhadas essenciais

- `skills/shared/agent-execution-baseline.md`
- `skills/shared/agent-handoff-governance.md`
- `skills/shared/autonomous-operations.md`
- `skills/shared/task-completion-criteria.md`

## Ownership

- label oficial: `agent:developer`
- entrada padrao: task em `Work` sem `agent:*`
- handoff esperado: `Security`
- excecao operacional: conflito de merge em PR aberto vai para `DevOps`

## Regras de execucao

- investigacao que revelar acao segura dentro do proprio escopo deve virar implementacao e validacao na mesma rodada
- comentario isolado nao encerra etapa de `Developer` quando ainda existir correcao viavel no repositorio dono da mudanca
- handoff para `Security` exige evidencia concreta de entrega, nao apenas diagnostico

## Fontes principais

- `agents/agent/developer/agent.md`
- `automation/developer/base.md`
- `automate/developer/README.md`
- `.github/workflows/developer-runner.yml`

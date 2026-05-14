# Quality Assurance Skills

## Papel

`Quality Assurance` valida a trilha tecnica completa e decide entre mover para `In Review`, devolver para `Security` ou devolver para `Developer`.

## Skills compartilhadas essenciais

- `skills/shared/agent-execution-baseline.md`
- `skills/shared/agent-handoff-governance.md`

## Ownership

- label oficial: `agent:qa`
- tag de aprovacao desta etapa: `approved:qa`
- entrada valida: apenas issue marcada com `agent:qa` em `Work` ou `Working`
- etapa anterior esperada: `agent:security`
- proxima coluna esperada quando aprovado com verificacao humana adicional: `In Review`
- devolucoes permitidas: `agent:security` ou `agent:developer`
- `Quality Assurance` nao deve capturar labels fora dessa sequencia

## Handoff esperado

- ao aprovar tecnicamente, registrar `approved:qa`
- quando `approved:security` e `approved:qa` coexistirem e houver PR vinculado para `staging`, o runner separado de `CTO` pode aceitar esse PR e concluir a task em `Done`
- quando ainda existir validacao humana adicional, `Quality Assurance` continua podendo mover para `In Review`
- ao reprovar, remover `approved:qa` se existir e devolver para `agent:security` ou `agent:developer`

## Fontes principais

- `agents/agent/qa/agent.md`
- `automation/qa/base.md`
- `automate/quality-assurance.md`
- `automate/project-status.md`
- `automate/pull-request-review.md`
- `automate/staging-merge.md`

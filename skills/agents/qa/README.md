# Quality Assurance Skills

## Papel

`Quality Assurance` valida a trilha tecnica completa e decide entre mover para `In Review` ou devolver para `Security` ou `Developer`.

## Skills compartilhadas essenciais

- `skills/shared/agent-execution-baseline.md`
- `skills/shared/agent-handoff-governance.md`

## Ownership

- label oficial: `agent:qa`
- entrada valida: apenas issue marcada com `agent:qa` em `Work` ou `Working`
- etapa anterior esperada: `agent:security`
- proxima coluna esperada quando aprovado: `In Review`
- devolucoes permitidas: `agent:security` ou `agent:developer`
- `Quality Assurance` e o unico agent que conclui a trilha tecnica movendo para `In Review`
- a passagem de `In Review` para `Deploy` e decisao humana, fora da etapa do agent `qa`
- `Quality Assurance` nao deve capturar labels fora dessa sequencia

## Fontes principais

- `agents/agent/qa/agent.md`
- `automation/qa/base.md`
- `automate/quality-assurance.md`
- `automate/project-status.md`
- `automate/pull-request-review.md`
- `automate/staging-merge.md`

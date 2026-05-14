# Security Skills

## Papel

`Security` revisa entregas vindas de `Developer` e decide entre devolver para `Developer` ou passar para `Quality Assurance`.

## Skills compartilhadas essenciais

- `skills/shared/agent-execution-baseline.md`
- `skills/shared/agent-handoff-governance.md`

## Ownership

- label oficial: `agent:security`
- tag de aprovacao desta etapa: `approved:security`
- entrada valida: apenas issue marcada com `agent:security` em `Work` ou `Working`
- etapa anterior esperada: `agent:developer`
- proxima etapa esperada: `agent:qa`
- devolucao permitida: `agent:developer`
- `Security` nao deve capturar labels fora dessa sequencia

## Handoff esperado

- ao aprovar, registrar `approved:security` e repassar para `agent:qa`
- ao reprovar, remover `approved:security` se existir e devolver para `agent:developer`
- a tarefa so fica pronta para o runner de `CTO` quando `approved:security` coexistir com `approved:qa`

## Fontes principais

- `agents/agent/security/agent.md`
- `automation/security/base.md`
- `automate/security-review.md`
- `automate/security-project-status.md`
- `automate/security-pull-request-review.md`

# Quality Assurance Skills

## Papel

`Quality Assurance` analisa PRs abertas do `Developer` e decide entre aceitar ou recusar a PR por label, sem publicar review de aprovacao e sem finalizar a task.

## Skills compartilhadas essenciais

- `skills/shared/agent-execution-baseline.md`
- `skills/shared/agent-handoff-governance.md`

## Ownership

- label oficial de aceite no PR: `qa:accepted`
- label oficial de recusa no PR: `qa:rejected`
- entrada valida: PR aberta do developer para `staging` ainda sem decisao de `QA`
- comentario obrigatorio na issue apenas quando houver recusa
- `Quality Assurance` nao publica `APPROVE` ou `REQUEST_CHANGES` no GitHub Review
- `Quality Assurance` nao finaliza a task

## Handoff esperado

- ao aceitar, registrar `qa:accepted` na PR
- ao recusar, registrar `qa:rejected` na PR e comentar a issue de forma direta e explicativa
- quando `qa:accepted` coexistir com `security:accepted`, a PR fica pronta para aprovacao exclusiva do `CTO`

## Fontes principais

- `agents/agent/qa/agent.md`
- `automation/qa/base.md`
- `automate/quality-assurance.md`
- `automate/project-status.md`
- `automate/pull-request-review.md`
- `automate/staging-merge.md`

# Security Skills

## Papel

`Security` analisa PRs abertas do `Developer` e decide entre aceitar ou recusar a PR por label, sem publicar review de aprovacao e sem finalizar a task.

## Skills compartilhadas essenciais

- `skills/shared/agent-execution-baseline.md`
- `skills/shared/agent-handoff-governance.md`

## Ownership

- label oficial de aceite no PR: `security:accepted`
- label oficial de recusa no PR: `security:rejected`
- entrada valida: PR aberta do developer para `staging` ainda sem decisao de `Security`
- comentario obrigatorio na issue apenas quando houver recusa
- `Security` nao publica `APPROVE` ou `REQUEST_CHANGES` no GitHub Review
- `Security` nao finaliza a task

## Handoff esperado

- ao aceitar, registrar `security:accepted` na PR
- ao recusar, registrar `security:rejected` na PR e comentar a issue de forma direta e explicativa
- quando `security:accepted` coexistir com `qa:accepted`, a PR fica pronta para aprovacao exclusiva do `CTO`

## Fontes principais

- `agents/agent/security/agent.md`
- `automation/security/base.md`
- `automate/security-review.md`
- `automate/security-project-status.md`
- `automate/security-pull-request-review.md`

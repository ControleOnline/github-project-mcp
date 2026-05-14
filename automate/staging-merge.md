# Staging Merge Rules

## Regra geral

No fluxo normal de task, somente o runner de `CTO` pode aprovar a PR do developer e promover a mudanca para `staging`.

## Quando a aprovacao exclusiva do CTO e obrigatoria

Quando o runner de `CTO` encontrar simultaneamente na mesma PR:

- `qa:accepted`
- `security:accepted`
- base em `staging`
- branch contendo o numero da issue

nessa situacao ele deve:

- aprovar a PR no GitHub Review
- promover a mudanca para `staging`
- mover a task correspondente para `In Review` no ProjectV2

## Bloqueios

Trate como bloqueio operacional quando:

- faltar uma das duas aprovacoes por label
- existir `qa:rejected` ou `security:rejected`
- a PR nao apontar para `staging`
- a branch nao estiver vinculada ao numero da issue
- a PR estiver em draft
- a PR estiver com conflito de merge

## Restricao de ownership

- `Developer`, `Security`, `QA`, `DevOps` e `GitHub Manager` nao podem aprovar a PR do fluxo normal
- somente `CTO` faz a aprovacao final e o movimento para `In Review`

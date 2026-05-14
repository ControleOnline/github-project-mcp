# Quality Assurance Automation

## Objetivo

Centralizar a logica operacional de `Quality Assurance` para revisar PRs do `Developer` e registrar a decisao em labels no proprio PR.

## Escopo

Esta logica cobre:

- localizar issue aberta criada por membro da equipe com PR aberta do `Developer`
- validar a disciplina operacional de branch e destino do PR
- decidir entre `qa:accepted` e `qa:rejected`
- comentar a issue apenas quando houver recusa
- deixar a aprovacao final da PR e o movimento da task para `CTO`

## Regras centrais

`QA` deve agir apenas sobre PRs do `Developer` e nao sobre coluna do projeto.

Ao revisar:

- confirme que a PR aponta para `staging`
- confirme que a branch do developer contem o numero da issue
- confirme que o developer nao trabalhou diretamente em branch proibida
- confirme que a PR nao esta em draft
- confirme que a PR nao esta com conflito de merge

## Saidas validas

- `qa:accepted`
- `qa:rejected`

## Restricoes

- `QA` nao publica `APPROVE` ou `REQUEST_CHANGES` no GitHub Review
- `QA` nao move task no projeto
- `QA` nao finaliza a task
- somente `CTO` aprova a PR e move a task para `In Review`

## Comentario de recusa

Quando a PR for recusada, a issue deve receber comentario direto contendo:

- a PR recusada
- os motivos objetivos da recusa
- a orientacao para que o `Developer` corrija a branch da tarefa e siga com nova PR para `staging`

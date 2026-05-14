# QA Routing Rules

## Fonte de verdade

A leitura operacional de `QA` agora acontece pela PR aberta do `Developer`, nao por coluna do projeto.

## Entrada de QA

A automacao de `QA` so pode capturar uma PR quando:

- a issue vinculada continua aberta
- a issue foi criada por membro da equipe
- existe PR aberta do `Developer` para `staging`
- essa PR ainda nao recebeu `qa:accepted` nem `qa:rejected`

## Saidas validas

As unicas saidas validas ao final da revisao de `QA` sao:

- `qa:accepted`
- `qa:rejected`

## Regras de transicao

### `QA` -> `qa:rejected`

Use quando houver qualquer desvio operacional objetivo, incluindo:

- PR fora de `staging`
- branch da tarefa sem o numero da issue
- uso direto de branch proibida
- PR em draft
- PR com conflito de merge

Ao recusar:

- registre `qa:rejected` na PR
- comente a issue de forma direta para orientar a proxima execucao do `Developer`

### `QA` -> `qa:accepted`

Use quando a PR estiver operacionalmente valida para seguir no fluxo.

Ao aceitar:

- registre `qa:accepted` na PR
- nao publique review de aprovacao no GitHub

## Restricoes

- `QA` nao aprova PR no GitHub Review
- `QA` nao move task no projeto
- `QA` nao finaliza task
- somente `CTO` pode aprovar a PR e mover a task para `In Review`

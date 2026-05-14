# Security Routing Rules

## Fonte de verdade

A leitura operacional de `Security` agora acontece pela PR aberta do `Developer`, nao por coluna do projeto.

## Entrada de Security

A automacao de `Security` so pode capturar uma PR quando:

- a issue vinculada continua aberta
- a issue foi criada por membro da equipe
- existe PR aberta do `Developer` para `staging`
- essa PR ainda nao recebeu `security:accepted` nem `security:rejected`

## Saidas validas

As unicas saidas validas ao final da revisao sao:

- `security:accepted`
- `security:rejected`

## Regras de transicao

### `Security` -> `security:rejected`

Use quando houver qualquer desvio operacional objetivo, incluindo:

- PR fora de `staging`
- branch da tarefa sem o numero da issue
- uso direto de branch proibida
- PR em draft
- PR com conflito de merge

Ao recusar:

- registre `security:rejected` na PR
- comente a issue de forma direta para orientar a proxima execucao do `Developer`

### `Security` -> `security:accepted`

Use quando a PR estiver operacionalmente valida para seguir no fluxo.

Ao aceitar:

- registre `security:accepted` na PR
- nao publique review de aprovacao no GitHub

## Restricoes

- `Security` nao aprova PR no GitHub Review
- `Security` nao move task no projeto
- `Security` nao finaliza task
- somente `CTO` pode aprovar a PR e mover a task para `In Review`

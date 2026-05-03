# Staging Merge Rules

## Regra geral

A promocao tecnica de `DevOps` so se conclui quando os merges obrigatorios em `staging` puderem ser executados com seguranca.

## Quando o merge e obrigatorio

Ao receber uma task de `Quality Assurance`:

- atualizar a task branch com o `origin/master` atual
- atualizar o branch `staging` com o `origin/master` atual
- fazer merge em `staging` no modulo dono da alteracao
- fazer merge em `staging` no projeto principal quando ele compuser a entrega

## Criacao de branch

Se `staging` nao existir em repositorio obrigatorio:

- criar `staging` a partir de `master`

## Bloqueios

Trate como bloqueio operacional quando:

- faltar branch de composicao no projeto principal
- faltar PR agregador obrigatorio
- a cadeia de repositorios nao estiver completa
- a task branch nao puder ser atualizada com `master`
- o branch `staging` nao puder ser atualizado com `master`
- o merge obrigatorio nao puder ser executado com seguranca

## Saida esperada

A automacao deve registrar:

- quais branches foram atualizados com `master`
- quais repositorios foram mesclados
- quais branches `staging` precisaram ser criados
- quais merges ficaram bloqueados e por que
- quando a coluna foi movida para `In Review`

# Staging Merge Rules

## Regra geral

A aprovacao de QA so se conclui quando os merges obrigatorios em `staging` puderem ser executados com seguranca.

## Quando o merge e obrigatorio

Ao aprovar uma task:

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
- o merge obrigatorio nao puder ser executado com seguranca

## Saida esperada

A automacao deve registrar:

- quais repositorios foram mesclados
- quais branches `staging` precisaram ser criados
- quais merges ficaram bloqueados e por que

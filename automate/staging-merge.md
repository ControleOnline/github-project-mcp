# Staging Merge Rules

## Regra geral

A promocao tecnica de `DevOps` so se conclui quando os merges obrigatorios em `staging` puderem ser executados com seguranca.

## Quando o merge e obrigatorio

Ao receber uma task de `Quality Assurance`:

- atualizar a task branch com o `origin/master` atual
- atualizar o branch `staging` com o `origin/master` atual
- fazer merge em `staging` no modulo dono da alteracao
- fazer merge em `staging` no projeto principal quando ele compuser a entrega

## Quando conflito pertence a DevOps

Trate conflito de merge como ownership de `DevOps` apenas quando existir PR aberto com conflito no mesmo repositório que compoe a etapa atual da issue.

Exemplos:

- issue no projeto principal com PR agregador aberto e conflitante no mesmo projeto: `DevOps`
- issue em modulo com PR aberto e conflitante no proprio modulo: `DevOps`
- issue no projeto principal com conflito apenas em submodulo e sem PR agregador aberto no proprio projeto: ainda nao e trilha de `DevOps`; o correto e devolver para `Developer` republicar a composicao ou a trilha tecnica faltante

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

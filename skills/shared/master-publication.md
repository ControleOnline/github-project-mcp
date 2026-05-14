# Master Publication

## Overview

Use esta skill quando `DevOps` ou `Sysadmin` receber pedido explicito para publicar um repositorio em `master`.

## Workflow

1. confirme o repositorio principal e se existem subprojetos em `.gitmodules`
2. trate `staging` como branch de origem da publicacao para `master`, salvo instrucao explicita diferente
3. se houver subprojetos, publique primeiro cada subprojeto obrigatorio e so depois o projeto principal
4. para cada repositorio com delta real entre `staging` e `master`, abra ou reutilize PR `staging` -> `master`
5. faca merge somente quando o PR estiver sem conflito e com a promocao autorizada
6. depois do merge, confirme que `master` recebeu o commit esperado e que o push remoto aconteceu
7. registre quais repositorios foram promovidos e quais ficaram bloqueados
8. se o projeto principal ficar com conflito, nao force update nem reescreva `master`; registre o bloqueio e pare na fronteira segura

## Front Rule

Quando o pedido for "publicar o front":

- trate o projeto principal como `app-community`, salvo contexto local mais especifico
- descubra os subprojetos em `.gitmodules`
- publique os subprojetos do front antes do projeto principal
- valide que os gitlinks do projeto principal apontam para commits ja publicados nos subprojetos

## Output Contract

Ao concluir, informe:

- quais repositorios foram publicados em `master`
- quais PRs de `staging` -> `master` foram criados, reutilizados ou mesclados
- quais repositorios ficaram bloqueados e por que
- qual foi a confirmacao final de push remoto em cada promocao concluida

## Quality Bar

- nao faca push direto em `master` quando PR de promocao for viavel
- nao pule subprojetos obrigatorios
- nao publique o projeto principal antes dos subprojetos
- nao force ref em `master` para contornar conflito

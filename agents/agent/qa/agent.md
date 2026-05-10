# Quality Assurance Agent

Este e o ponto de entrada canonico do agent `qa` para todo o ecossistema `ControleOnline`.

## Como usar

Todo wrapper local de `qa` deve apontar para este arquivo.

Ao iniciar uma revisao:

1. leia este arquivo
2. leia `skills/README.md`
3. leia `skills/shared/README.md`
4. leia `skills/shared/agent-execution-baseline.md`
5. leia `skills/shared/agent-handoff-governance.md`
6. leia `skills/agents/qa/README.md`
7. leia `automation/qa/base.md`
8. leia o `AGENTS.md` local mais especifico do escopo alterado

## Papel

O agent `qa` revisa entregas recebidas de `Security`, valida evidencias tecnicas e decide entre devolver para `Developer`, devolver para `Security` ou mover a tarefa para `In Review`.

## Regras especificas

- use `automation/qa/base.md` como regra-base obrigatoria
- consulte tambem `automate/quality-assurance.md`, `automate/project-status.md`, `automate/pull-request-review.md` e `automate/staging-merge.md`
- nao aprove entrega por aproximacao textual
- `Q.A.` e o unico agent que pode concluir a etapa tecnica movendo a task para `In Review`
- depois de `In Review`, a verificacao final e humana; somente apos aprovacao humana a task deve seguir para `Deploy`
- nao promova para `DevOps` como saida normal da revisao de conteudo
- trate composicoes cross-repo de forma explicita
- nao publique review formal em PR cuja autoria coincida com a credencial ativa; nesse caso, deixe comentario rastreavel e siga a decisao real da task

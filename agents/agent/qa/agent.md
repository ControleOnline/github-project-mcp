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

O agent `qa` executa Quality Assurance sobre PRs do `Developer`, valida comportamento, evidencias tecnicas e aderencia aos requisitos da issue, e registra aprovacao ou recusa por label.

## Regras especificas

- use `automation/qa/base.md` como regra-base obrigatoria
- consulte tambem `automate/quality-assurance.md`, `automate/project-status.md` e `automate/pull-request-review.md`
- a revisao normal de QA acontece sobre PR vinculada a uma issue criada por membro da equipe
- qualquer tarefa, aberta ou finalizada, vinculada a PR e sem label `approved:qa` ou `rejected:qa` deve entrar na fila de QA
- ao aprovar, registre `approved:qa` na issue e na PR
- ao recusar, registre `rejected:qa`, comente diretamente na issue os motivos objetivos e remova aprovacoes anteriores quando a tarefa voltar ao Developer
- labels de aprovacao devem permanecer em tarefas finalizadas para conferencia futura
- nao aprove entrega por aproximacao textual
- `Quality Assurance` nao move task para `In Review`, nao conclui tarefa, nao aprova formalmente PR no GitHub e nao mescla PR
- somente `Technical Lead` pode aprovar formalmente a PR, mesclar em `staging`, marcar a task como concluida e mover o item do projeto para `In Review`
- depois de `In Review`, a verificacao final e humana; somente apos aprovacao humana a task deve seguir para `Deploy`
- nao promova para `DevOps` como saida normal da revisao de conteudo
- trate composicoes cross-repo de forma explicita
- nao publique review formal em PR cuja autoria coincida com a credencial ativa; nesse caso, deixe comentario rastreavel e siga a decisao real da task

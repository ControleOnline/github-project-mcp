# Developer Skills

## Papel

`Developer` e o executor da mudanca e so atua sobre issues abertas criadas por membro da equipe sem PR pendente de decisao por `QA` e `Security`.

## Skills compartilhadas essenciais

- `skills/shared/agent-execution-baseline.md`
- `skills/shared/agent-handoff-governance.md`
- `skills/shared/autonomous-operations.md`
- `skills/shared/task-completion-criteria.md`

## Ownership

- leitura de backlog: apenas issue aberta de membro da equipe sem PR aberta pendente de `qa:accepted|qa:rejected` e `security:accepted|security:rejected`
- branch permitida: apenas a branch da propria tarefa, contendo o numero da issue
- branch alvo obrigatoria de PR: `staging`
- branches proibidas para trabalho direto: `master`, `main`, `staging` e qualquer branch fora da branch da tarefa

## Regras de execucao

- investigacao que revelar acao segura dentro do proprio escopo deve virar implementacao e validacao na mesma rodada
- comentario isolado nao encerra etapa de `Developer` quando ainda existir correcao viavel no repositorio dono da mudanca
- o handoff operacional acontece pela PR do developer, nao por mudanca de coluna
- quando `QA` ou `Security` recusarem a PR, o `Developer` deve corrigir e seguir com uma nova PR para `staging`

## Fontes principais

- `agents/agent/developer/agent.md`
- `automation/developer/base.md`
- `automate/developer/README.md`
- `.github/workflows/developer-runner.yml`

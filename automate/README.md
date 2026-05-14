# Automate

Esta pasta concentra a politica e a base executavel dos runners operacionais do ecossistema `ControleOnline`.

## Agentes cobertos

- `Developer`: seleciona issue aberta de membro da equipe sem PR pendente de `QA` e `Security`
- `Security`: analisa PR aberta do developer e registra `security:accepted` ou `security:rejected`
- `Quality Assurance`: analisa PR aberta do developer e registra `qa:accepted` ou `qa:rejected`
- `CTO`: supervisiona o ecossistema e, quando a PR estiver pronta, aprova a PR e move a task para `In Review`
- `DevOps`: continua com a fila propria de deploy
- `GitHub Operations Runner`: executa mutacoes de GitHub a partir do proprio GitHub Actions quando o runtime local dos agents nao consegue concluir a operacao

## Arquivos principais

- `scripts/developer-pr-dispatch.mjs`: selecao do backlog do `Developer`
- `scripts/pr-label-review-runner.mjs`: review runner compartilhado entre `Security` e `Quality Assurance`
- `scripts/cto-project-supervisor.mjs`: auditoria estrutural do CTO
- `scripts/cto-pr-finalizer.mjs`: aprovacao exclusiva do CTO e movimento para `In Review`
- `scripts/github-operations.mjs`: executor genérico de mutações REST, GraphQL e mudanças de coluna no GitHub
- `pull-request-review.md`: politica atual de review de `QA`
- `security-pull-request-review.md`: politica atual de review de `Security`
- `staging-merge.md`: regra de aprovacao e promocao exclusiva do `CTO`

## Objetivo

Permitir que o GitHub execute o fluxo padronizado:

1. `Developer` le apenas issue aberta criada por membro da equipe sem PR pendente de `QA` e `Security`
2. `Developer` trabalha somente na propria branch da tarefa, contendo o numero da issue
3. `Developer` abre PR apenas para `staging`
4. `Security` marca a PR com `security:accepted` ou `security:rejected`
5. `QA` marca a PR com `qa:accepted` ou `qa:rejected`
6. quando houver recusa, o runner comenta a issue de forma direta para orientar a proxima execucao do `Developer`
7. somente `CTO` aprova a PR no GitHub e move a task para `In Review`

## Observacoes

- `Security` e `QA` nao publicam `APPROVE` ou `REQUEST_CHANGES` no GitHub Review.
- `Security` e `QA` nao finalizam task.
- coluna do projeto nao participa mais da captura de backlog de `Developer`, `Security` e `QA`.
- somente `CTO` faz a aprovacao final da PR do fluxo normal.
- quando houver conflito entre script e politica, siga os arquivos `.md` desta pasta.

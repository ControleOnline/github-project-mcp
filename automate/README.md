# QA Automation

Esta pasta concentra a politica e a base executavel da automacao de Quality Assurance para o ecossistema `ControleOnline`.

## Arquivos

- `quality-assurance.md`: politica central de QA
- `project-status.md`: regras de transicao no ProjectV2
- `pull-request-review.md`: criterio para `APPROVE` ou `REQUEST_CHANGES`
- `staging-merge.md`: regra de merge obrigatorio em `staging`
- `scripts/qa-project-review.mjs`: esqueleto executavel da revisao automatizada
- `workflows/qa-project-review.yml`: workflow base para GitHub Actions

## Objetivo

Permitir que o GitHub execute o fluxo de QA de forma padronizada:

1. localizar tasks em `Quality Assurance`
2. encontrar issue, PRs e checks relacionados
3. decidir entre `Developer`, `Security` e `Staging`
4. aprovar ou reprovar PRs
5. mover o item no ProjectV2
6. preparar merges obrigatorios em `staging`

## Secrets esperados

O workflow base foi escrito para usar:

- `TOKEN_PROJECTS`: token com permissao para review, issues, contents e projects

## Parametros padrao do projeto

Esta base ja esta apontada para:

- organizacao: `ControleOnline`
- projeto: `https://github.com/orgs/ControleOnline/projects/1`
- numero do ProjectV2: `1`

## Variaveis opcionais

- `QA_DRY_RUN`: quando `true`, apenas gera snapshot e previsao das decisoes. Padrao: `true`
- `QA_SECURITY_APPROVERS`: lista separada por virgula com os logins aceitos como aprovadores de seguranca
- `QA_MERGE_TARGETS`: branches alvo de promocao operacional. Use `all` para considerar todos os branches

## Observacoes

- A leitura e escrita do ProjectV2 devem continuar preferindo GraphQL.
- O script atual ja consegue:
- ler os cards em `Quality Assurance`
- localizar PRs vinculados pela timeline da issue
- avaliar checks publicados no commit atual
- decidir entre `Developer`, `Security` e `Staging` com regra conservadora
- comentar na issue, revisar PR e mover o card quando `QA_DRY_RUN=false`
- registrar a intencao operacional de promocao com `QA_MERGE_TARGETS`, inclusive quando estiver em modo `all`
- A politica manda mais do que a automacao. Se houver conflito, siga os arquivos `.md` desta pasta.

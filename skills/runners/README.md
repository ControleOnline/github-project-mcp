# Runner Skills

Este arquivo passa a mapear um unico runner oficial para execucao remota no GitHub.

## Estado atual

O workflow oficial do ecossistema agora e:

- `.github/workflows/github-operations.yml`

Com isso:

- a automacao recorrente de coluna, labels e manutencao do ProjectV2 acontece em um unico runner gerencial
- comandos remotos de mutacao no GitHub tambem passam pelo mesmo runner
- os demais workflows antigos deixam de ser a trilha oficial
- a logica real fica em `automate/scripts/github-operations.mjs`

## GitHub Manager Runner

- workflow ativo: `.github/workflows/github-operations.yml`
- logica final: `automate/scripts/github-operations.mjs`
- guia operacional: `automate/github-operations.md`

Responsabilidades de referencia:

- auditar tasks em `Work` ou `Working`
- mover para `In Review` tasks aprovadas por `Security` e `Q.A.` que ficaram na coluna errada
- remover labels `agent:*` residuais
- limpar assignees tecnicos quando a governanca depender apenas de coluna e labels
- executar mutacoes REST ou GraphQL autorizadas por comando
- servir como runner com mais acesso para manutencao geral no GitHub

## Legado

Os workflows por papel e os sincronizadores antigos deixam de ser runners oficiais. Quando ainda existirem scripts ou wrappers historicos no repositorio, trate-os apenas como referencia legada ate serem removidos ou absorvidos pelo runner gerencial.

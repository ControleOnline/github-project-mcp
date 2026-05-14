# Runner Skills

Este arquivo mapeia o modelo atual de execucao do ecossistema sem misturar o papel dos agents pares no ChatGPT com o papel do runner gerencial no GitHub.

## Estado atual

Hoje existem duas trilhas oficiais e complementares:

- os agents pares no ChatGPT sao o canal oficial para execucao normal por papel, investigacao, correcao de codigo, revisao tecnica e handoff operacional;
- o workflow `.github/workflows/github-operations.yml` e o canal oficial para mutacoes remotas no GitHub e manutencao recorrente dentro do proprio GitHub.

Com isso:

- `Developer`, `Security`, `Quality Assurance`, `DevOps` e `CTO` continuam tendo comportamento real definido pelos entry points em `src/`, wrappers em `automate/agents/` e scripts em `automate/scripts/`;
- `Security`, `Quality Assurance` e `CTO` seguem com runners separados, cada um com seu proprio entry point em `src/`;
- o `GitHub Manager Runner` concentra auditoria gerencial, correcoes de coluna, labels, assignees, comentarios, reviews e outras mutacoes remotas quando a sessao local nao deve fingir escrita no GitHub;
- os workflows antigos por papel deixam de ser a trilha oficial de execucao recorrente, mas continuam como referencia historica e ponto explicito de desligamento do canal anterior.

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

## Runners por papel

Os entry points de papel continuam sendo a referencia de comportamento do ecossistema:

- `src/developer-runner.js`
- `src/security-runner.js`
- `src/qa-runner.js`
- `src/devops-runner.js`
- `src/cto-runner.js`
- `src/agent-dispatch-runner.js`
- `automate/scripts/agent-project-dispatch.mjs`
- `automate/scripts/cto-project-supervisor.mjs`
- `automate/scripts/cto-staging-promotion.mjs`

Quando a duvida envolver ownership, fila, selecao por labels/coluna ou leitura operacional do papel, use esses entry points e scripts junto com `skills/shared/README.md` e `automate/agents/runner-map.md`.

## Legado

Os workflows por papel e os sincronizadores antigos nao sao mais a trilha oficial de execucao recorrente. Quando ainda existirem wrappers ou scripts historicos no repositorio, trate-os como referencia legada ate remocao ou consolidacao completa no modelo atual.

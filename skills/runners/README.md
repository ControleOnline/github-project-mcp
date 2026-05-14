# Runner Skills

Este arquivo mapeia o modelo atual de execucao do ecossistema sem misturar o papel dos agents pares no ChatGPT com o papel do runner gerencial no GitHub.

## Estado atual

Hoje existem duas trilhas oficiais e complementares:

- os agents pares no ChatGPT sao o canal oficial para execucao normal por papel, investigacao, correcao de codigo, revisao tecnica e handoff operacional;
- o workflow `.github/workflows/github-operations.yml` e o canal oficial para mutacoes remotas no GitHub e manutencao recorrente dentro do proprio GitHub.

Com isso:

- `Developer`, `Security`, `Quality Assurance`, `DevOps` e `CTO` continuam tendo comportamento real definido pelos entry points em `src/` e scripts em `automate/scripts/`;
- `Developer`, `Security`, `Quality Assurance` e `CTO` seguem com runners separados e independentes;
- `Security` e `Quality Assurance` agora atuam sobre PRs do `Developer`, registrando labels de aceite ou recusa na propria PR;
- somente `CTO` aprova PR no GitHub e move a task para `In Review`.

## GitHub Manager Runner

- workflow ativo: `.github/workflows/github-operations.yml`
- logica final: `automate/scripts/github-operations.mjs`
- guia operacional: `automate/github-operations.md`

## Runners por papel

- `src/developer-runner.js` -> `automate/scripts/developer-pr-dispatch.mjs`
- `src/security-runner.js` -> `automate/scripts/pr-label-review-runner.mjs` com `PR_REVIEW_ROLE=security`
- `src/qa-runner.js` -> `automate/scripts/pr-label-review-runner.mjs` com `PR_REVIEW_ROLE=qa`
- `src/cto-runner.js` -> `automate/scripts/cto-project-supervisor.mjs` e `automate/scripts/cto-pr-finalizer.mjs`
- `src/devops-runner.js` permanece como trilha separada para a fila propria de deploy

## Regra de leitura

Quando a duvida envolver ownership, fila ou runtime:

1. confira primeiro os entry points reais em `src/*-runner.js`
2. confira a logica final em `automate/scripts/`
3. trate `agent-project-dispatch.mjs`, `qa-project-review.mjs` e `security-project-review.mjs` como trilha legada quando nao estiverem no caminho real do entry point atual

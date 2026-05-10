# Runner Skills

Este arquivo mapeia a trilha real de execucao dos runners do ecossistema.

## Estado atual

Os workflows em `.github/workflows/` voltaram a ser o canal oficial de execucao operacional do ecossistema, com apoio dos runtimes em `src/` e da logica final em `automate/`.

Com isso:

- os workflows em `.github/workflows/` sao a superficie oficial de execucao remota no GitHub
- os runtimes em `src/` seguem como entry points oficiais dos runners
- os scripts em `automate/` continuam sendo a logica final compartilhada
- os agents pares no ChatGPT devem preferir os runners oficiais quando a trilha exigir mutacoes reais no GitHub, execucao remota, ou continuidade sem bloqueio de rede local
- o `GitHub Operations Runner` passa a ser o fallback oficial para mutacoes especificas de coluna, label, comentario, review e assignee quando isso for mais direto que reencenar a etapa inteira

## Uso operacional esperado

Quando um agent par precisar agir:

- prefira a trilha oficial descrita neste arquivo antes de improvisar fluxo paralelo
- use o workflow ativo correspondente quando a execucao remota for a forma mais confiavel de concluir a etapa
- use o wrapper em `automate/agents/` quando ele existir para o papel atual
- use o runtime em `src/` e a logica final em `automate/scripts/` como fonte de comportamento real
- use o `GitHub Operations Runner` para mutacoes pontuais no GitHub quando nao for necessario acionar o runner completo da etapa

## Developer

- workflow ativo: `.github/workflows/developer-runner.yml`
- runtime de referencia: `src/developer-runner.js`
- runner comum: `src/agent-dispatch-runner.js`
- wrapper: `automate/agents/developer/dispatch.mjs`
- logica final: `automate/scripts/agent-project-dispatch.mjs`

## Security

- workflow ativo: `.github/workflows/security-runner.yml`
- runtime de referencia: `src/security-runner.js`
- runner comum: `src/agent-dispatch-runner.js`
- wrapper: `automate/agents/security/dispatch.mjs`
- logica final: `automate/scripts/agent-project-dispatch.mjs`

## Quality Assurance

- workflow ativo: `.github/workflows/qa-runner.yml`
- runtime de referencia: `src/qa-runner.js`
- runner comum: `src/agent-dispatch-runner.js`
- wrapper: `automate/agents/qa/dispatch.mjs`
- logica final: `automate/scripts/agent-project-dispatch.mjs` e `automate/scripts/qa-project-review.mjs`

## DevOps

- workflow ativo: `.github/workflows/devops-runner.yml`
- runtime de referencia: `src/devops-runner.js`
- runner comum: `src/agent-dispatch-runner.js`
- papel resolvido por `AGENT_DISPATCH_ROLE=devops`
- logica final: `automate/scripts/agent-project-dispatch.mjs`

## Agent Flow Sync

- workflow ativo: `.github/workflows/agent-flow-sync.yml`
- runtime de referencia: `src/agent-flow-sync-runner.js`
- logica final: `automate/scripts/agent-flow-sync.mjs`

Responsabilidades de referencia:

- semear `agent:developer` em task nova sem label
- desviar conflito de merge para `DevOps`
- limpar `agent:*` ao chegar em `In Review`

## GitHub Operations Runner

- workflow ativo: `.github/workflows/github-operations.yml`
- logica final: `automate/scripts/github-operations.mjs`
- guia operacional: `automate/github-operations.md`

Responsabilidades de referencia:

- mover coluna no ProjectV2
- comentar em issue ou PR
- trocar labels
- ajustar assignees
- publicar reviews
- executar mutacoes REST ou GraphQL autorizadas

## CTO Supervisor

- workflow desativado: `.github/workflows/cto-runner.yml`
- runtime de referencia: `src/cto-runner.js`
- logica final: `automate/scripts/cto-project-supervisor.mjs`

## Direct Push Ingest

- workflow desativado: `.github/workflows/direct-push-ingest.yml`
- runtime de referencia: `src/direct-push-ingest-runner.js`
- logica final: `automate/devops/direct-push-ingest.mjs`

# Runner Skills

Este arquivo mapeia a trilha real de execucao dos runners do ecossistema.

## Estado atual

Os workflows em `.github/workflows/` foram desativados como canal de execucao operacional.

A execucao oficial agora pertence aos agentes pares no ChatGPT.

Com isso:

- os arquivos de workflow permanecem apenas como trilha historica e ponto de desligamento explicito
- os runtimes em `src/` e os scripts em `automate/` seguem como referencia tecnica do fluxo
- nenhuma automacao operacional deve voltar a depender de `push` ou `schedule` nesses runners sem decisao estrutural explicita
- os agentes pares devem usar seus runners, wrappers e scripts oficiais sempre que isso ajudar a executar, validar ou destravar a trilha operacional
- o fato de o workflow do GitHub estar desativado nao desautoriza o runner; o runner continua sendo a referencia oficial de execucao para os agentes pares
- o uso dos runners pelos agentes pares e encorajado, inclusive para inspecao, dispatch, validacao e handoff tecnico

## Uso operacional esperado

Quando um agent par precisar agir:

- prefira a trilha oficial descrita neste arquivo antes de improvisar fluxo paralelo
- use o wrapper em `automate/agents/` quando ele existir para o papel atual
- use o runtime em `src/` e a logica final em `automate/scripts/` como fonte de comportamento real
- trate `workflow_dispatch` nos workflows desativados apenas como trilha historica e ponto explicito de desligamento do canal antigo
- nao trate a ausencia de `schedule` ou `push` nesses workflows como motivo para evitar o uso do runner correspondente pelo agent par

## Developer

- workflow desativado: `.github/workflows/developer-runner.yml`
- runtime de referencia: `src/developer-runner.js`
- runner comum: `src/agent-dispatch-runner.js`
- wrapper: `automate/agents/developer/dispatch.mjs`
- logica final: `automate/scripts/agent-project-dispatch.mjs`

## Security

- workflow desativado: `.github/workflows/security-runner.yml`
- runtime de referencia: `src/security-runner.js`
- runner comum: `src/agent-dispatch-runner.js`
- wrapper: `automate/agents/security/dispatch.mjs`
- logica final: `automate/scripts/agent-project-dispatch.mjs`

## Quality Assurance

- workflow desativado: `.github/workflows/qa-runner.yml`
- runtime de referencia: `src/qa-runner.js`
- runner comum: `src/agent-dispatch-runner.js`
- wrapper: `automate/agents/qa/dispatch.mjs`
- logica final: `automate/scripts/agent-project-dispatch.mjs`

## DevOps

- workflow desativado: `.github/workflows/devops-runner.yml`
- runtime de referencia: `src/devops-runner.js`
- runner comum: `src/agent-dispatch-runner.js`
- papel resolvido por `AGENT_DISPATCH_ROLE=devops`
- logica final: `automate/scripts/agent-project-dispatch.mjs`

## Agent Flow Sync

- workflow desativado: `.github/workflows/agent-flow-sync.yml`
- runtime de referencia: `src/agent-flow-sync-runner.js`
- logica final: `automate/scripts/agent-flow-sync.mjs`

Responsabilidades de referencia:

- semear `agent:developer` em task nova sem label
- desviar conflito de merge para `DevOps`
- limpar `agent:*` ao chegar em `In Review`

## CTO Supervisor

- workflow desativado: `.github/workflows/cto-runner.yml`
- runtime de referencia: `src/cto-runner.js`
- logica final: `automate/scripts/cto-project-supervisor.mjs`

## Direct Push Ingest

- workflow desativado: `.github/workflows/direct-push-ingest.yml`
- runtime de referencia: `src/direct-push-ingest-runner.js`
- logica final: `src/direct-push-ingest.js`

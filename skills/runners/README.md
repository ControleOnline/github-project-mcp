# Runner Skills

Este arquivo mapeia a trilha real de execucao dos runners do ecossistema.

## Developer

- workflow: `.github/workflows/developer-runner.yml`
- runtime: `src/developer-runner.js`
- runner comum: `src/agent-dispatch-runner.js`
- wrapper: `automate/agents/developer/dispatch.mjs`
- logica final: `automate/scripts/agent-project-dispatch.mjs`

## Security

- workflow: `.github/workflows/security-runner.yml`
- runtime: `src/security-runner.js`
- runner comum: `src/agent-dispatch-runner.js`
- wrapper: `automate/agents/security/dispatch.mjs`
- logica final: `automate/scripts/agent-project-dispatch.mjs`

## Quality Assurance

- workflow: `.github/workflows/qa-runner.yml`
- runtime: `src/qa-runner.js`
- runner comum: `src/agent-dispatch-runner.js`
- wrapper: `automate/agents/qa/dispatch.mjs`
- logica final: `automate/scripts/agent-project-dispatch.mjs`

## DevOps

- workflow: `.github/workflows/devops-runner.yml`
- runtime: `src/devops-runner.js`
- runner comum: `src/agent-dispatch-runner.js`
- papel resolvido por `AGENT_DISPATCH_ROLE=devops`
- logica final: `automate/scripts/agent-project-dispatch.mjs`

## Agent Flow Sync

- workflow: `.github/workflows/agent-flow-sync.yml`
- runtime: `src/agent-flow-sync-runner.js`
- logica final: `automate/scripts/agent-flow-sync.mjs`

Responsabilidades:

- semear `agent:developer` em task nova sem label
- desviar conflito de merge para `DevOps`
- limpar `agent:*` ao chegar em `In Review`

## CTO Supervisor

- workflow: `.github/workflows/cto-runner.yml`
- runtime: `src/cto-runner.js`
- logica final: `automate/scripts/cto-project-supervisor.mjs`

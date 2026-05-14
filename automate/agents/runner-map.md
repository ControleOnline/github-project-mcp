# Runner Map

Este arquivo existe para eliminar ambiguidade entre o runtime atual do `agents-mcp`, o runner gerencial de mutacoes no GitHub e os workflows historicos que ainda permanecem no repositorio.

## Cadeia oficial atual

Hoje a execucao operacional oficial do ecossistema combina duas trilhas complementares:

- os agents pares no ChatGPT executam a trilha normal por papel, incluindo descoberta, implementacao, revisao tecnica e handoff;
- o `GitHub Manager Runner` executa a trilha oficial de mutacoes remotas no GitHub e de manutencao recorrente dentro do proprio GitHub.

## Referencias por papel

### Developer

- workflow desativado: `.github/workflows/developer-runner.yml`
- entry point de runtime: `src/developer-runner.js`
- logica final atual: `automate/scripts/developer-pr-dispatch.mjs`
- criterio de captura: issue aberta de membro da equipe sem PR pendente de decisao por `QA` e `Security`

### Quality Assurance

- workflow desativado: `.github/workflows/qa-runner.yml`
- entry point de runtime: `src/qa-runner.js`
- logica final atual: `automate/scripts/pr-label-review-runner.mjs`
- papel atual: registrar `qa:accepted` ou `qa:rejected` em PR do developer

### Security

- workflow desativado: `.github/workflows/security-runner.yml`
- entry point de runtime: `src/security-runner.js`
- logica final atual: `automate/scripts/pr-label-review-runner.mjs`
- papel atual: registrar `security:accepted` ou `security:rejected` em PR do developer

### CTO

- workflow desativado: `.github/workflows/cto-runner.yml`
- entry point de runtime: `src/cto-runner.js`
- logica final de supervisao: `automate/scripts/cto-project-supervisor.mjs`
- logica final de aprovacao exclusiva: `automate/scripts/cto-pr-finalizer.mjs`
- papel atual: aprovar PR pronta para `staging` e mover a task para `In Review`

### DevOps

- workflow desativado: `.github/workflows/devops-runner.yml`
- entry point de runtime: `src/devops-runner.js`
- papel atual: fila propria de deploy, sem aprovar PR de task do fluxo normal

### GitHub Manager

- workflow ativo: `.github/workflows/github-operations.yml`
- logica final: `automate/scripts/github-operations.mjs`
- papel: manutencao gerencial, correcoes de coluna, labels e mutacoes autorizadas no GitHub

## Regra de auditoria

Ao revisar funcionamento, incidentes, ownership ou backlog do ecossistema:

1. confirme primeiro qual runner e script realmente implementam o papel ou a mutacao exigida hoje
2. trate os workflows YAML por papel apenas como trilha historica, salvo reativacao explicita e documentada
3. trate `agent-project-dispatch.mjs`, `qa-project-review.mjs` e `security-project-review.mjs` como legado quando nao forem o caminho real do entry point atual
4. somente o runner de `CTO` pode aprovar PR e mover a task para `In Review`

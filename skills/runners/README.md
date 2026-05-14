# Runner Skills

Este arquivo mapeia o modelo atual de execucao do ecossistema sem misturar o papel dos agents pares no ChatGPT com o papel do runner gerencial no GitHub.

## Estado atual

Hoje existem duas trilhas oficiais e complementares:

- os agents pares no ChatGPT sao o canal oficial para execucao normal por papel, investigacao, correcao de codigo, revisao tecnica e handoff operacional
- o workflow `.github/workflows/github-operations.yml` e o canal oficial para mutacoes remotas no GitHub e manutencao recorrente dentro do proprio GitHub

Com isso:

- `Developer`, `Security`, `Quality Assurance`, `DevOps` e `CTO` continuam tendo comportamento real definido pelos entry points em `src/` e pelos scripts em `automate/scripts/`
- `Security` e `Quality Assurance` atuam sobre PRs do `Developer`, registrando labels de aprovacao ou recusa na propria issue e na propria PR
- os labels canonicos atuais sao `qa:accepted`, `qa:rejected`, `security:accepted` e `security:rejected`
- durante a transicao, os runners ainda devem reconhecer tambem os labels legados `approved:*` e `rejected:*` quando encontrarem trilhas antigas
- somente o `CTO` aprova formalmente a PR no GitHub, promove em `staging` e move a task para `In Review`
- `DevOps` permanece responsavel pela fila propria de deploy e pela reconciliacao operacional quando houver conflito de merge ou bloqueio repo-local de publicacao

## GitHub Manager Runner

- workflow ativo: `.github/workflows/github-operations.yml`
- logica final: `automate/scripts/github-operations.mjs`
- guia operacional: `automate/github-operations.md`

## Runners por papel

- `src/developer-runner.js` -> `automate/scripts/developer-pr-dispatch.mjs`
- `src/security-runner.js` -> `automate/scripts/pr-label-review-runner.mjs` com `PR_REVIEW_ROLE=security`
- `src/qa-runner.js` -> `automate/scripts/pr-label-review-runner.mjs` com `PR_REVIEW_ROLE=qa`
- `src/devops-runner.js` -> `src/agent-dispatch-runner.js` com `AGENT_DISPATCH_ROLE=devops`
- `src/cto-runner.js` -> `automate/scripts/cto-project-supervisor.mjs`
- `automate/scripts/cto-pr-finalizer.mjs` -> aprovacao exclusiva do CTO para trilhas prontas

## Legado

Arquivos historicos ainda podem existir no repositorio, mas nao representam a trilha recorrente oficial quando houver divergencia com as skills compartilhadas e com os entry points atuais.

Exemplos de legado ou compatibilidade:

- `src/technical-lead-runner.js`
- `automate/scripts/technical-lead-pr-finalizer.mjs`
- workflows YAML antigos por papel quando nao houver reativacao explicita e documentada

## Regra de leitura

Quando a duvida envolver ownership, fila ou runtime:

1. confira primeiro os entry points reais em `src/*-runner.js`
2. confira a logica final em `automate/scripts/`
3. use `skills/shared/README.md` e `automate/agents/runner-map.md` como mapa de governanca
4. trate scripts ou workflows historicos fora desse caminho como legado ate reativacao explicita

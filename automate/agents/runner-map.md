# Runner Map

Este arquivo existe para eliminar ambiguidade entre o runtime atual do `agents-mcp`, o runner gerencial de mutacoes no GitHub e os workflows historicos que ainda permanecem no repositorio.

## Cadeia oficial atual

Hoje a execucao operacional oficial do ecossistema combina duas trilhas complementares:

- os agents pares no ChatGPT executam a trilha normal por papel, incluindo descoberta, implementacao, revisao tecnica e handoff;
- o `GitHub Manager Runner` executa a trilha oficial de mutacoes remotas no GitHub e de manutencao recorrente dentro do proprio GitHub.

Com isso:

- os workflows em `.github/workflows/` por papel permanecem como trilha historica e ponto explicito de desligamento do canal antigo;
- os entry points em `src/` e os scripts em `automate/` continuam sendo a referencia real de comportamento por papel;
- o workflow `.github/workflows/github-operations.yml` continua sendo o canal oficial quando a etapa depender de coluna, label, comentario, review, assignee ou outra escrita remota no GitHub.

## Referencias por papel

### Developer

- workflow desativado: `.github/workflows/developer-runner.yml`
- entry point de runtime: `src/developer-runner.js`
- runner comum: `src/agent-dispatch-runner.js`
- wrapper do papel: `automate/agents/developer/dispatch.mjs`
- logica compartilhada final: `automate/scripts/agent-project-dispatch.mjs`

### Quality Assurance

- workflow desativado: `.github/workflows/qa-runner.yml`
- entry point de runtime: `src/qa-runner.js`
- runner comum: `src/agent-dispatch-runner.js`
- wrapper do papel: `automate/agents/qa/dispatch.mjs`
- logica compartilhada final: `automate/scripts/agent-project-dispatch.mjs`

### Security

- workflow desativado: `.github/workflows/security-runner.yml`
- entry point de runtime: `src/security-runner.js`
- runner comum: `src/agent-dispatch-runner.js`
- wrapper do papel: `automate/agents/security/dispatch.mjs`
- logica compartilhada final: `automate/scripts/agent-project-dispatch.mjs`

### DevOps

- workflow desativado: `.github/workflows/devops-runner.yml`
- entry point de runtime: `src/devops-runner.js`
- runner comum: `src/agent-dispatch-runner.js`
- papel resolvido pela variavel `AGENT_DISPATCH_ROLE=devops`
- logica compartilhada final: `automate/scripts/agent-project-dispatch.mjs`

### CTO

- workflow desativado: `.github/workflows/cto-runner.yml`
- entry point de runtime: `src/cto-runner.js`
- logica final: `automate/scripts/cto-project-supervisor.mjs`

### GitHub Manager

- workflow ativo: `.github/workflows/github-operations.yml`
- logica final: `automate/scripts/github-operations.mjs`
- papel: manutencao gerencial, correcoes de coluna, limpeza de labels e mutacoes autorizadas no GitHub

## Entradas legadas ou de compatibilidade

Os arquivos abaixo continuam uteis como referencia historica, compatibilidade manual ou trilha de politica, mas nao representam a trilha principal de execucao recorrente:

- `src/index.js`
- `automate/scripts/qa-project-review.mjs`
- `automate/scripts/security-project-review.mjs`

Se houver divergencia entre arquivos legados, workflows desativados e a trilha atual, a leitura operacional correta deve priorizar:

1. `skills/runners/README.md`
2. `skills/shared/README.md`
3. os entry points reais em `src/*-runner.js`
4. os wrappers em `automate/agents/`, quando existirem
5. a logica final em `automate/scripts/`
6. o `GitHub Manager Runner` quando a etapa depender de mutacao remota no GitHub

## Regra de auditoria

Ao revisar funcionamento, incidentes, ownership ou backlog do ecossistema:

1. confirme primeiro qual runner e script realmente implementam o papel ou a mutacao exigida hoje
2. trate `workflow_dispatch` nos YAMLs por papel apenas como trilha historica, salvo reativacao explicita e documentada
3. so trate script legado como fonte principal quando ele ainda estiver no caminho real do runtime
4. quando a issue estiver em `override manual ativo`, preserve essa leitura ate surgir delta tecnico verificavel no repositorio alvo
5. quando houver PR com `Scrutinizer` em erro ou failure, sem `workflow_run` local observavel ou com run em `action_required`, leia isso primeiro como gate repo-local do repositorio alvo antes de reciclar a issue entre agents

## Regra de interpretacao de gargalo

Quando o bloqueio dominante estiver fora do nucleo `agents-mcp`, a sequencia correta de leitura e:

1. verificar se existe PR ou composicao aberta no proprio repositorio consumidor
2. verificar se o head atual publica check externo em erro ou failure
3. verificar se existe `workflow_run` local observavel para o mesmo head
4. se nao houver run local, ou se o run estiver em `action_required`, tratar a trilha como bloqueio repo-local material
5. so depois disso decidir se o problema e do nucleo, do repositorio consumidor ou apenas do gate externo

# Runner Map

Este arquivo existe para eliminar ambiguidade entre o runtime atual do `agents-mcp`, os workflows desativados do GitHub Actions e as entradas legadas que ainda permanecem no repositório.

## Cadeia oficial atual

Hoje a execução operacional oficial pertence aos agentes pares no ChatGPT.

Com isso:

- os workflows em `.github/workflows/` permanecem apenas como trilha histórica e ponto explícito de desligamento do canal antigo;
- os entry points em `src/` e os scripts em `automate/` continuam sendo a referência real de comportamento;
- a ausência de `schedule` ou `push` nos workflows desativados não desautoriza o runner correspondente.

## Referências por papel

### Developer

- Workflow desativado: `.github/workflows/developer-runner.yml`
- Entry point de runtime: `src/developer-runner.js`
- Runner comum: `src/agent-dispatch-runner.js`
- Wrapper do papel: `automate/agents/developer/dispatch.mjs`
- Lógica compartilhada final: `automate/scripts/agent-project-dispatch.mjs`

### Quality Assurance

- Workflow desativado: `.github/workflows/qa-runner.yml`
- Entry point de runtime: `src/qa-runner.js`
- Runner comum: `src/agent-dispatch-runner.js`
- Wrapper do papel: `automate/agents/qa/dispatch.mjs`
- Lógica compartilhada final: `automate/scripts/agent-project-dispatch.mjs`

### Security

- Workflow desativado: `.github/workflows/security-runner.yml`
- Entry point de runtime: `src/security-runner.js`
- Runner comum: `src/agent-dispatch-runner.js`
- Wrapper do papel: `automate/agents/security/dispatch.mjs`
- Lógica compartilhada final: `automate/scripts/agent-project-dispatch.mjs`

### DevOps

- Workflow desativado: `.github/workflows/devops-runner.yml`
- Entry point de runtime: `src/devops-runner.js`
- Runner comum: `src/agent-dispatch-runner.js`
- Papel resolvido pela variável `AGENT_DISPATCH_ROLE=devops`
- Lógica compartilhada final: `automate/scripts/agent-project-dispatch.mjs`

### Agent Flow Sync

- Workflow desativado: `.github/workflows/agent-flow-sync.yml`
- Entry point de runtime: `src/agent-flow-sync-runner.js`
- Lógica final: `automate/scripts/agent-flow-sync.mjs`

### CTO

- Workflow desativado: `.github/workflows/cto-runner.yml`
- Entry point de runtime: `src/cto-runner.js`
- Lógica final: `automate/scripts/cto-project-supervisor.mjs`

## Entradas legadas ou de compatibilidade

Os arquivos abaixo continuam úteis como referência histórica, compatibilidade manual ou trilha de política, mas não representam o canal operacional principal atual:

- `src/index.js`
- `automate/scripts/qa-project-review.mjs`
- `automate/scripts/security-project-review.mjs`

Se houver divergência entre arquivos legados, workflows desativados e a trilha atual, a leitura operacional correta deve priorizar:

1. a política canônica em `skills/runners/README.md`;
2. os entry points reais em `src/*-runner.js`;
3. os wrappers em `automate/agents/`, quando existirem;
4. a lógica final em `automate/scripts/`.

## Regra de auditoria

Ao revisar funcionamento, incidentes, ownership ou backlog do ecossistema:

1. confirme primeiro qual runner e script realmente implementam o papel hoje;
2. trate `workflow_dispatch` nos YAMLs desativados apenas como trilha histórica;
3. só trate script legado como fonte principal quando ele ainda estiver no caminho real do runtime;
4. quando a issue estiver em `override manual ativo`, preserve essa leitura até surgir delta técnico verificável no repositório alvo; não trate a simples remoção do owner humano como progresso nem como prova de fila limpa;
5. quando houver PR com `Scrutinizer` em erro ou failure, sem `workflow_run` local observável ou com run em `action_required`, leia isso primeiro como gate repo-local do repositório alvo antes de reciclar a issue entre agents.

## Regra de interpretação de gargalo

Quando o bloqueio dominante estiver fora do núcleo `agents-mcp`, a sequência correta de leitura é:

1. verificar se existe PR ou composição aberta no próprio repositório consumidor;
2. verificar se o head atual publica check externo em erro ou failure;
3. verificar se existe `workflow_run` local observável para o mesmo head;
4. se não houver run local, ou se o run estiver em `action_required`, tratar a trilha como bloqueio repo-local material;
5. só mover a issue entre `Developer`, `Security`, `Q.A.` e `DevOps` quando surgir delta técnico verificável, e não apenas porque a fila parece parada.

Isso evita falso diagnóstico, comentário incorreto em issue e documentação operacional desalinhada com o runtime.

# Runner Map

Este arquivo existe para eliminar ambiguidade entre os workflows ativos do `cto-mcp` e as entradas legadas de compatibilidade que ainda permanecem no repositório.

## Cadeia ativa dos runners

Quando a pergunta for "o que realmente roda hoje no GitHub Actions?", a resposta correta deve seguir primeiro os workflows em `.github/workflows/`, depois os arquivos de `src/` e só então as entradas de `automate/`.

### Developer

- Workflow ativo: `.github/workflows/developer-runner.yml`
- Entry point de runtime: `src/developer-runner.js`
- Runner comum: `src/agent-dispatch-runner.js`
- Wrapper do papel: `automate/agents/developer/dispatch.mjs`
- Lógica compartilhada final: `automate/scripts/agent-project-dispatch.mjs`

### Quality Assurance

- Workflow ativo: `.github/workflows/qa-runner.yml`
- Entry point de runtime: `src/qa-runner.js`
- Runner comum: `src/agent-dispatch-runner.js`
- Wrapper do papel: `automate/agents/qa/dispatch.mjs`
- Lógica compartilhada final: `automate/scripts/agent-project-dispatch.mjs`

### Security

- Workflow ativo: `.github/workflows/security-runner.yml`
- Entry point de runtime: `src/security-runner.js`
- Runner comum: `src/agent-dispatch-runner.js`
- Wrapper do papel: `automate/agents/security/dispatch.mjs`
- Lógica compartilhada final: `automate/scripts/agent-project-dispatch.mjs`

### DevOps

- Workflow ativo: `.github/workflows/devops-runner.yml`
- Entry point de runtime: `src/devops-runner.js`
- Runner comum: `src/agent-dispatch-runner.js`
- Papel resolvido pela variável `AGENT_DISPATCH_ROLE=devops`
- Lógica compartilhada final: `automate/scripts/agent-project-dispatch.mjs`

### CTO

- Workflow ativo: `.github/workflows/cto-runner.yml`
- Entry point de runtime: `src/cto-runner.js`
- Lógica final: `automate/scripts/cto-project-supervisor.mjs`

## Entradas legadas ou de compatibilidade

Os arquivos abaixo continuam úteis como referência histórica, compatibilidade manual ou trilha de política, mas não representam o caminho principal dos runners recorrentes atuais:

- `src/index.js`
- `automate/scripts/qa-project-review.mjs`
- `automate/scripts/security-project-review.mjs`

Se houver divergência entre esses arquivos legados e os workflows ativos, a leitura operacional correta deve priorizar os workflows ativos e a cadeia real de `src/*-runner.js` até `automate/scripts/agent-project-dispatch.mjs`.

## Regra de auditoria

Ao revisar funcionamento, incidentes, ownership ou backlog do ecossistema:

1. confirme primeiro qual workflow ativo dispara o papel;
2. confirme qual entry point de `src/` esse workflow executa hoje;
3. confirme se o papel cai no dispatcher comum ou num script dedicado;
4. só trate script legado como fonte principal quando ele ainda estiver no caminho real do workflow.

Isso evita falso diagnóstico, comentário incorreto em issue e documentação operacional desalinhada com o runtime.
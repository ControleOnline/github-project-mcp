# cto-mcp

Base oficial de automação do ecossistema `ControleOnline` para agents que rodam direto no GitHub.

O fluxo oficial agora é orientado por agente responsável, e não por coluna intermediária:

- `Developer` é a entrada padrão de task nova em `Work`
- `Developer` implementa e entrega para `Security`
- `Security` revisa e entrega para `Quality Assurance`, ou devolve para `Developer`
- `Quality Assurance` revisa e entrega para `DevOps`, ou devolve para `Developer` ou `Security`
- `DevOps` resolve conflitos operacionais, sincroniza `master`, promove para `staging` e move a coluna para `In Review`

## Como o agente responsável é representado

O papel atual da task é registrado por um label exclusivo:

- `agent:developer`
- `agent:security`
- `agent:qa`
- `agent:devops`

O assignee `Copilot` indica apenas que existe execução ativa do agent naquele momento.

Durante handoff:

- o agent atual troca o label para o próximo passo
- o agent atual remove o assignee `Copilot`
- assignees humanos permanecem
- a coluna segue em `Work` até o fim do ciclo
- `DevOps` é o único que move para `In Review`

As regras-base dos agents ficam em [`automation/`](./automation/) e a política operacional detalhada fica em [`automate/`](./automate/).

## Estrutura

- `automate/agents/README.md`: mapa de ownership operacional por agent
- `automate/agents/developer/dispatch.mjs`: entrada operacional do `Developer`
- `automate/agents/qa/dispatch.mjs`: entrada operacional do `Quality Assurance`
- `automate/agents/qa/review.mjs`: entrada de compatibilidade para a revisão de QA
- `automate/agents/security/dispatch.mjs`: entrada operacional do `Security`
- `automate/agents/security/review.mjs`: entrada de compatibilidade para a revisão de Security
- `automate/developer/README.md`: política operacional do runner de `Developer`
- `automate/scripts/agent-flow-sync.mjs`: sincronizador central de labels iniciais, conflitos e limpeza final
- `automate/scripts/agent-project-dispatch.mjs`: base compartilhada do despachante genérico de agents por label/Work
- `automate/quality-assurance.md`: política central do agente de QA
- `automate/security-review.md`: política central do analista de segurança
- `automate/project-status.md`: regras oficiais de roteamento para QA
- `automate/security-project-status.md`: regras oficiais de roteamento para Security
- `automate/pull-request-review.md`: regras de review para QA
- `automate/security-pull-request-review.md`: regras de review para Security
- `automate/staging-merge.md`: regras de promoção para `staging` via DevOps
- `automate/scripts/developer-project-dispatch.mjs`: entrada legada do despacho de `Developer`
- `automate/scripts/qa-project-review.mjs`: entrada legada da revisão de QA
- `automate/scripts/security-project-review.mjs`: entrada legada da revisão de Security
- `automate/workflows/developer-project-dispatch.yml`: workflow de `Developer`
- `automate/workflows/qa-project-review.yml`: workflow de QA
- `automate/workflows/security-project-review.yml`: workflow de Security
- `.github/workflows/agent-flow-sync.yml`: runner central de labels iniciais, conflitos e limpeza final

## Como os agentes rodam

Os agents são disparados por GitHub Actions e usam o GitHub como fonte de verdade operacional.

Fluxo esperado:

1. `Developer` pode capturar a próxima task parada em `Work`, desde que ela não esteja exclusivamente com pessoas e não exista outra execução ativa recente do próprio `Developer`.
2. Se existir uma issue ainda aberta com `agent:developer`, assignee de agent e sem atualização recente, o dispatcher tenta retomar essa execução antes de capturar uma task nova.
3. Task aberta em `Work` sem `agent:*` pertence inicialmente a `Developer`.
4. Ler a issue, PRs, reviews, comentários, commits, checks e arquivos alterados.
5. Confirmar qual é o agente responsável atual da tarefa.
6. Aplicar a política correspondente em `automation/` e `automate/`.
7. Registrar comentário rastreável.
8. Revisar PR quando aplicável.
9. Mudar o agente responsável para o próximo passo correto.
10. Se existir PR aberto com conflito no mesmo repositório da issue/composição atual, a responsabilidade operacional passa para `DevOps`.
11. Se o conflito existir apenas em submódulo ou repositório satélite, sem PR agregador aberto no repositório da issue, a task deve voltar para `Developer` para recompor a trilha correta.
12. Só usar coluna para o passo final de `DevOps` -> `In Review`.
13. Issue bloqueada por `ops:copilot-unavailable` que já tenha PR aberto vinculado não deve ser tratada como fila virgem de `Developer`; nesse caso a leitura correta passa a ser backlog de review ou composição até que a trilha de PR seja concluída ou descartada.
14. O supervisor do CTO audita os repositórios prioritários também pela saúde observável de GitHub Actions; se existir workflow versionado em `.github/workflows/`, mas o catálogo de Actions continuar vazio ou indisponível, o repositório deve ser tratado como bloqueio de plataforma ou onboarding.

A retomada automática evita lock indefinido da fila do `Developer` quando uma execução antiga fica parada ou quando a issue é devolvida manualmente sem limpeza operacional completa.

## Bloqueio por Copilot indisponível no repositório alvo

O dispatcher comum usado pelos runners de `Developer`, `Security` e `QA` trata como bloqueio operacional o caso em que o GitHub não expõe actor atribuível do Copilot para a issue alvo.

Quando a API responder que o Copilot agent não está habilitado no repositório alvo, a automação:

- adiciona o label `ops:copilot-unavailable` na issue afetada
- remove o label `agent:*` da tentativa atual para evitar looping automático cego
- registra um comentário rastreável explicando o bloqueio
- continua procurando a próxima task elegível em vez de encerrar a rodada como fila vazia

Esse estado indica limitação operacional do repositório de destino, e não falha do fluxo central do `cto-mcp`.

## Credenciais e secrets

Este repositório não deve documentar nem depender de caminhos antigos de secrets em arquivos locais.

O padrão atual é:

- no GitHub Actions, os runners devem preferir `GH_TOKEN` quando precisarem atribuir o Copilot agent entre repositórios do ecossistema
- `APP_ID`, `APP_INSTALLATION_ID` e `APP_PRIVATE_KEY` continuam como fallback para leitura/escrita operacional quando `GH_TOKEN` não estiver disponível
- quando o ambiente já fornecer token válido, os scripts aceitam `GITHUB_TOKEN` ou `GH_TOKEN`
- arquivos locais de credenciais não fazem parte do contrato do projeto

Não trate arquivos locais de secrets como contrato do projeto. O contrato oficial é o secret configurado no GitHub.

## Variáveis usuais

### Developer

```bash
DEVELOPER_PROJECT_ORG=ControleOnline
DEVELOPER_PROJECT_NUMBER=1
DEVELOPER_DRY_RUN=false
DEVELOPER_WORK_STATUS=Work
DEVELOPER_AGENT_LOGIN=copilot-swe-agent
DEVELOPER_AGENT_LOGINS=copilot-swe-agent
DEVELOPER_COPILOT_BASE_REF=master
DEVELOPER_COPILOT_MODEL=
DEVELOPER_OUTPUT_DIR=./.developer-output
AGENT_REDISPATCH_STALE_ACTIVE=true
AGENT_STALE_AFTER_MINUTES=30
```

- `AGENT_REDISPATCH_STALE_ACTIVE=true`: permite priorizar a retomada automatica de execucoes travadas do `Developer`.
- `AGENT_STALE_AFTER_MINUTES=30`: define em quantos minutos sem atualizacao uma issue ativa passa a ser tratada como travada para redispatch.

### QA

```bash
QA_PROJECT_ORG=ControleOnline
QA_PROJECT_NUMBER=1
QA_DRY_RUN=false
QA_MERGE_TARGETS=all
QA_OUTPUT_DIR=./.qa-output
```

### Security

```bash
SECURITY_PROJECT_ORG=ControleOnline
SECURITY_PROJECT_NUMBER=1
SECURITY_DRY_RUN=false
SECURITY_OUTPUT_DIR=./.security-output
SECURITY_ANALYST_LOGINS=login1,login2
SECURITY_USE_COPILOT=true
SECURITY_COPILOT_BASE_REF=master
SECURITY_COPILOT_MODEL=
```

### Flow Sync

```bash
FLOW_PROJECT_ORG=ControleOnline
FLOW_PROJECT_NUMBER=1
FLOW_DRY_RUN=false
FLOW_WORK_STATUS=Work
FLOW_IN_REVIEW_STATUS=In Review
FLOW_KNOWN_AGENT_LOGINS=copilot-swe-agent,copilot
FLOW_OUTPUT_DIR=./.flow-output
```

### Retry

```bash
GITHUB_RETRY_ATTEMPTS=3
GITHUB_RETRY_DELAY_MS=2000
GITHUB_RETRY_MAX_DELAY_MS=15000
WORKFLOW_RETRY_ATTEMPTS=3
WORKFLOW_RETRY_DELAY_MS=3000
WORKFLOW_RETRY_MAX_DELAY_MS=20000
```

## Execução local

Execute os scripts Node em `automate/scripts/` com `GITHUB_TOKEN` ou `GH_TOKEN`. Nos runners do GitHub Actions, `GH_TOKEN` deve ser preferido para atribuição do Copilot agent e o GitHub App fica como fallback.

Quando precisar validar o comportamento de redispatch do `Developer`, ajuste `AGENT_REDISPATCH_STALE_ACTIVE` e `AGENT_STALE_AFTER_MINUTES` no ambiente antes de rodar o dispatcher localmente.

## Copilot cloud agent no Security

Quando `SECURITY_USE_COPILOT=true`, o fluxo de Security tenta acionar o Copilot cloud agent nas issues que ainda não têm decisão estruturada do analista. A automação atribui a issue ao `copilot-swe-agent[bot]` com `agent_assignment`, define o repositório alvo, usa `SECURITY_COPILOT_BASE_REF` como branch base e envia instruções de revisão de segurança.

O Copilot é usado para aprofundar a investigação, não para pular a política do projeto. A transição oficial continua conservadora: a tarefa só sai de `Security` quando houver evidência estruturada com:

```text
SECURITY_DECISION: APPROVED|REJECTED
NEXT_AGENT: Quality Assurance|Developer
```

Na rodada seguinte, a automação lê essa evidência e aplica as regras de `automate/security-project-status.md` para repassar a tarefa para `Quality Assurance` ou `Developer`.

## Regras importantes

- ProjectV2 deve ser lido por GraphQL sempre que possível.
- Busca textual não substitui a associação real do agente responsável nem a coluna final real quando ela for usada.
- o label `agent:*` é a associação oficial do agent responsável atual
- task aberta em `Work` sem `agent:*` entra por padrão em `Developer`
- `Developer` não deve capturar tasks em `Work` que estejam exclusivamente atribuídas a pessoas.
- issue aberta com `agent:developer` e assignee de agent so deve bloquear a fila enquanto houver atividade recente; acima do limite configurado, a automação tenta retomar a execucao.
- conflito de merge em PR aberto no mesmo repositório da issue/composição deve ir para `DevOps`
- conflito apenas em submódulo ou repositório satélite, sem PR agregador aberto no repositório da issue, deve voltar para `Developer`
- issue com `ops:copilot-unavailable` e PR aberto vinculado deve ser tratada como backlog de review/composição, não como fila virgem de captura
- o supervisor do CTO deve tratar como bloqueio de plataforma os repositórios prioritários que já tenham workflow versionado, mas ainda não exponham catálogo observável de Actions
- falhas transitórias de GitHub, rede e autenticação devem usar retry automático antes de falhar a rodada
- Cada agent só pode concluir a task repassando para um próximo agent válido, ou para `In Review` no caso do DevOps.
- O fluxo de Security pode acionar o Copilot cloud agent para aprofundar a investigação antes da decisão final, quando configurado.
- Quando a automação for mais limitada do que a política, a política em `automate/*.md` prevalece.

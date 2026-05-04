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

- `automate/developer/README.md`: política operacional do runner de `Developer`
- `automate/scripts/agent-flow-sync.mjs`: sincronizador central de labels iniciais, conflitos e limpeza final
- `automate/scripts/agent-project-dispatch.mjs`: despachante genérico de agents por label/Work
- `automate/quality-assurance.md`: política central do agente de QA
- `automate/security-review.md`: política central do analista de segurança
- `automate/project-status.md`: regras oficiais de roteamento para QA
- `automate/security-project-status.md`: regras oficiais de roteamento para Security
- `automate/pull-request-review.md`: regras de review para QA
- `automate/security-pull-request-review.md`: regras de review para Security
- `automate/staging-merge.md`: regras de promoção para `staging` via DevOps
- `automate/scripts/developer-project-dispatch.mjs`: base executável do despacho de `Developer`
- `src/agent-flow-sync-runner.js`: wrapper do sincronizador central do fluxo
- `src/devops-runner.js`: wrapper do despachante de `DevOps`
- `automate/scripts/qa-project-review.mjs`: base executável do fluxo de QA
- `automate/scripts/security-project-review.mjs`: base executável do fluxo de Security
- `automate/workflows/developer-project-dispatch.yml`: workflow de `Developer`
- `automate/workflows/qa-project-review.yml`: workflow de QA
- `automate/workflows/security-project-review.yml`: workflow de Security
- `.github/workflows/agent-flow-sync.yml`: runner central de labels iniciais, conflitos e limpeza final

## Como os agentes rodam

Os agents são disparados por GitHub Actions e usam o GitHub como fonte de verdade operacional.

Fluxo esperado:

1. `Developer` pode capturar a próxima task parada em `Work`, desde que ela não tenha responsável humano e não exista outra execução ativa do próprio `Developer`.
2. Task aberta em `Work` sem `agent:*` pertence inicialmente a `Developer`.
3. Ler a issue, PRs, reviews, comentários, commits, checks e arquivos alterados.
4. Confirmar qual é o agente responsável atual da tarefa.
5. Aplicar a política correspondente em `automation/` e `automate/`.
6. Registrar comentário rastreável.
7. Revisar PR quando aplicável.
8. Mudar o agente responsável para o próximo passo correto.
9. Se houver PR com conflito de merge, a responsabilidade operacional passa para `DevOps`.
10. Só usar coluna para o passo final de `DevOps` -> `In Review`.

## Credenciais e secrets

Este repositório não deve documentar nem depender de caminhos antigos de secrets em arquivos locais.

O padrão atual é:

- no GitHub Actions, a credencial principal entra por `APP_ID`, `APP_INSTALLATION_ID` e `APP_PRIVATE_KEY`
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
```

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

## Execução local

Execute os scripts Node em `automate/scripts/` com `GITHUB_TOKEN` ou `GH_TOKEN`, ou pelos runners que montam o token a partir do GitHub App.

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
- `Developer` não deve capturar tasks em `Work` que estejam atribuídas a pessoas.
- conflito de merge em PR aberto deve ir para `DevOps`
- Cada agent só pode concluir a task repassando para um próximo agent válido, ou para `In Review` no caso do DevOps.
- O fluxo de Security pode acionar o Copilot cloud agent para aprofundar a investigação antes da decisão final, quando configurado.
- Quando a automação for mais limitada do que a política, a política em `automate/*.md` prevalece.

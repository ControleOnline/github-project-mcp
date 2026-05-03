# cto-mcp

Base oficial de automação do ecossistema `ControleOnline` para agents que rodam direto no GitHub.

O fluxo oficial agora é orientado por agente responsável, e não por coluna intermediária:

- `Developer` implementa e entrega para `Security`
- `Security` revisa e entrega para `Quality Assurance`, ou devolve para `Developer`
- `Quality Assurance` revisa e entrega para `DevOps`, ou devolve para `Developer` ou `Security`
- `DevOps` sincroniza `master`, promove para `staging` e move a coluna para `In Review`

As regras-base dos agents ficam em [`automation/`](./automation/) e a política operacional detalhada fica em [`automate/`](./automate/).

## Estrutura

- `automate/quality-assurance.md`: política central do agente de QA
- `automate/security-review.md`: política central do analista de segurança
- `automate/project-status.md`: regras oficiais de roteamento para QA
- `automate/security-project-status.md`: regras oficiais de roteamento para Security
- `automate/pull-request-review.md`: regras de review para QA
- `automate/security-pull-request-review.md`: regras de review para Security
- `automate/staging-merge.md`: regras de promoção para `staging` via DevOps
- `automate/scripts/qa-project-review.mjs`: base executável do fluxo de QA
- `automate/scripts/security-project-review.mjs`: base executável do fluxo de Security
- `automate/workflows/qa-project-review.yml`: workflow de QA
- `automate/workflows/security-project-review.yml`: workflow de Security

## Como os agentes rodam

Os agents são disparados por GitHub Actions e usam o GitHub como fonte de verdade operacional.

Fluxo esperado:

1. Ler a issue, PRs, reviews, comentários, commits, checks e arquivos alterados.
2. Confirmar qual é o agente responsável atual da tarefa.
3. Aplicar a política correspondente em `automation/` e `automate/`.
4. Registrar comentário rastreável.
5. Revisar PR quando aplicável.
6. Mudar o agente responsável para o próximo passo correto.
7. Só usar coluna para o passo final de `DevOps` -> `In Review`.

## Credenciais e secrets

Este repositório não deve documentar nem depender de caminhos antigos de secrets em arquivos locais.

O padrão atual é:

- no GitHub Actions, a credencial principal entra pelo secret `TOKEN_PROJECTS`
- localmente, os scripts leem a variável de ambiente `TOKEN_PROJECTS`
- `GITHUB_TOKEN` e `GH_TOKEN` podem servir apenas como fallback operacional local, quando disponíveis

Não trate arquivos locais de secrets como contrato do projeto. O contrato oficial é o secret configurado no GitHub.

## Variáveis usuais

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

## Execução local

Execute os scripts Node em `automate/scripts/` com a variável de ambiente `TOKEN_PROJECTS` configurada no terminal.

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
- Cada agent só pode concluir a task repassando para um próximo agent válido, ou para `In Review` no caso do DevOps.
- O fluxo de Security pode acionar o Copilot cloud agent para aprofundar a investigação antes da decisão final, quando configurado.
- Quando a automação for mais limitada do que a política, a política em `automate/*.md` prevalece.

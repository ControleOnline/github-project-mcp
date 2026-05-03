# cto-mcp

Base oficial de automação do ecossistema `ControleOnline` para agentes que rodam direto no GitHub.

Hoje o repositório concentra dois fluxos principais:

- `Quality Assurance`: revisão funcional, técnica e de composição entre PRs
- `Security`: revisão de autorização, exposição de dados e regras sensíveis de negócio

Toda a política operacional fica na pasta [`automate/`](./automate/), junto com os workflows e os scripts-base de execução.

## Estrutura

- `automate/quality-assurance.md`: política central do agente de QA
- `automate/security-review.md`: política central do analista de segurança
- `automate/project-status.md`: transições oficiais usadas por QA
- `automate/security-project-status.md`: transições oficiais usadas por Security
- `automate/pull-request-review.md`: regras de review para QA
- `automate/security-pull-request-review.md`: regras de review para Security
- `automate/staging-merge.md`: regras de promoção para `staging`
- `automate/scripts/qa-project-review.mjs`: base executável do fluxo de QA
- `automate/scripts/security-project-review.mjs`: base executável do fluxo de Security
- `automate/workflows/qa-project-review.yml`: workflow de QA
- `automate/workflows/security-project-review.yml`: workflow de Security

## Como os agentes rodam

Os agentes são disparados por GitHub Actions e usam o GitHub como fonte de verdade operacional.

Fluxo esperado:

1. Ler o ProjectV2 oficial da organização.
2. Selecionar apenas itens no status alvo.
3. Carregar issue, PRs, reviews, comentários, commits, checks e arquivos alterados.
4. Aplicar a política correspondente em `automate/`.
5. Registrar comentário rastreável.
6. Revisar PR quando aplicável.
7. Mover o item para a próxima coluna obrigatória.

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

O Copilot é usado para aprofundar a investigação, não para pular a política do projeto. A transição oficial continua conservadora: o item só sai de `Security` quando houver evidência estruturada com:

```text
SECURITY_DECISION: APPROVED|REJECTED
PROJECT_STATUS: Quality Assurance|Developer
```

Na rodada seguinte, o script lê essa evidência, aplica as regras de `automate/security-project-status.md` e move o item para `Quality Assurance` ou `Developer`.

## Regras importantes

- ProjectV2 deve ser lido por GraphQL sempre que possível.
- Busca textual não substitui o campo real `Status`.
- Cada agente só pode concluir a task movendo para um destino operacional válido.
- O fluxo de Security pode acionar o Copilot cloud agent para aprofundar a investigação antes da decisão final, quando configurado.
- Quando a automação for mais limitada do que a política, a política em `automate/*.md` prevalece.

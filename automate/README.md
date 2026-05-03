# Automate

Esta pasta concentra a política e a base executável dos agentes que rodam direto no GitHub no ecossistema `ControleOnline`.

## Agentes cobertos

- `Developer`: implementa e entrega para `Security`
- `Security`: valida autorização, `securityFilter`, exposição de dados e entrega para `Quality Assurance`
- `Quality Assurance`: valida entrega, checks, composição entre PRs e entrega para `DevOps`
- `DevOps`: sincroniza `master`, promove para `staging` e move a coluna para `In Review`

## Arquivos

- `developer/README.md`: política operacional do runner de `Developer`
- `quality-assurance.md`: política central de QA
- `security-review.md`: política central do analista de segurança
- `project-status.md`: regras de transição usadas por QA
- `security-project-status.md`: regras de transição usadas por Security
- `pull-request-review.md`: critérios de `APPROVE` ou `REQUEST_CHANGES` em QA
- `security-pull-request-review.md`: critérios de review em Security
- `staging-merge.md`: regra de merge obrigatório em `staging`
- `scripts/developer-project-dispatch.mjs`: despacha uma task parada em `Work` para o agent `Developer`
- `scripts/qa-project-review.mjs`: esqueleto executável da revisão de QA
- `scripts/security-project-review.mjs`: coletor de contexto e executor do fluxo de Security
- `workflows/developer-project-dispatch.yml`: workflow base para `Developer`
- `workflows/qa-project-review.yml`: workflow base para QA
- `workflows/security-project-review.yml`: workflow base para Security

## Objetivo

Permitir que o GitHub execute os fluxos de revisão de forma padronizada:

1. localizar tasks associadas ao agente responsável correto
2. encontrar issue, PRs, comentários, reviews, checks e arquivos relacionados
3. aplicar a política do agente dono da etapa
4. registrar evidência rastreável
5. revisar PR quando aplicável
6. repassar a tarefa para o próximo agente responsável correto
7. usar coluna apenas no passo final de `DevOps` -> `In Review`

## Secrets esperados

O padrão atual de credenciais é:

- `APP_ID`, `APP_INSTALLATION_ID` e `APP_PRIVATE_KEY`: padrão para montar o token do GitHub App dentro dos runners
- `GITHUB_TOKEN` ou `GH_TOKEN`: entrada operacional quando o token já vier pronto do ambiente

No GitHub Actions, a injeção esperada é:

- `${{ secrets.APP_ID }}`
- `${{ secrets.APP_INSTALLATION_ID }}`
- `${{ secrets.APP_PRIVATE_KEY }}`

Evite documentar caminhos antigos de arquivos locais de secret. Eles não são a fonte oficial de configuração deste projeto.

## Parâmetros padrão do projeto

Esta base está apontada para:

- organização: `ControleOnline`
- projeto: `https://github.com/orgs/ControleOnline/projects/1`
- número do ProjectV2: `1`

## Variáveis opcionais

### Developer

- `DEVELOPER_DRY_RUN`: quando `true`, apenas gera snapshot e previsão da próxima atribuição. Padrão: `true`
- `DEVELOPER_WORK_STATUS`: nome da coluna de entrada para despacho do `Developer`. Padrão: `Work`
- `DEVELOPER_AGENT_LOGIN`: login preferencial do agent a ser atribuído. Padrão: `copilot-swe-agent`
- `DEVELOPER_AGENT_LOGINS`: lista de logins tratados como agents pelo runner
- `DEVELOPER_COPILOT_BASE_REF`: branch base para a sessão do Copilot. Padrão: `master`
- `DEVELOPER_COPILOT_MODEL`: modelo opcional do Copilot cloud agent, quando suportado
- `DEVELOPER_OUTPUT_DIR`: diretório do artefato JSON da rodada

### QA

- `QA_DRY_RUN`: quando `true`, apenas gera snapshot e previsão das decisões. Padrão: `true`
- `QA_SECURITY_APPROVERS`: logins aceitos como aprovadores explícitos de segurança
- `QA_MERGE_TARGETS`: branches alvo de promoção operacional. Use `all` para considerar todos os branches
- `QA_OUTPUT_DIR`: diretório do artefato JSON da rodada

### Security

- `SECURITY_DRY_RUN`: quando `true`, só gera snapshot e decisão prevista
- `SECURITY_ANALYST_LOGINS`: logins autorizados a registrar a decisão final estruturada
- `SECURITY_OUTPUT_DIR`: diretório do artefato JSON da rodada
- `SECURITY_USE_COPILOT`: quando `true`, tenta acionar o Copilot cloud agent para apoiar a análise
- `SECURITY_COPILOT_BASE_REF`: branch base para a sessão do Copilot. Padrão: `master`
- `SECURITY_COPILOT_MODEL`: modelo opcional do Copilot cloud agent, quando suportado

## Observações

- GraphQL continua sendo o caminho preferencial para leitura e escrita do ProjectV2.
- O agente de Developer entra pela coluna `Work`, mas a execução real passa a ser controlada pela atribuição ao agent.
- O agente de QA decide entre `Developer`, `Security` e `DevOps`.
- O agente de Security decide entre `Developer` e `Quality Assurance`.
- O agente de DevOps é o único que deve mover a coluna para `In Review`.
- O fluxo de Security precisa ser conservador: ausência de evidência não vale como aprovação.
- O script de Security foi deixado como base executável conservadora, espera uma decisão estruturada do analista e pode delegar investigação ao Copilot cloud agent quando configurado.
- Quando houver conflito entre script e política, siga os arquivos `.md` desta pasta.

# Automate

Esta pasta concentra a política e a base executável dos agentes que rodam direto no GitHub no ecossistema `ControleOnline`.

## Agentes cobertos

- `Developer`: implementa e entrega para `Security`
- `Security`: valida autorizacao, `securityFilter`, exposicao de dados, registra `approved:security` quando aprovar e entrega para `Quality Assurance`
- `Quality Assurance`: valida entrega, checks, composicao entre PRs, registra `approved:qa` quando aprovar e decide entre devolucao, `In Review` ou handoff final para `CTO`
- `DevOps`: resolve conflitos operacionais, sincroniza ambientes e coloca em producao o que ja foi aprovado por humano e movido para `Deploy`
- `CTO`: supervisiona o ecossistema e, quando `approved:security` e `approved:qa` coexistirem, aceita o PR vinculado em `staging` e conclui a task em `Done`
- `GitHub Operations Runner`: executa mutações de GitHub a partir do próprio GitHub Actions quando o runtime local dos agents não consegue concluir a operação

## Arquivos

- `agents/README.md`: mapa de ownership operacional por agent
- `agents/developer/dispatch.mjs`: entrada operacional do despacho de `Developer`
- `agents/qa/dispatch.mjs`: entrada operacional do despacho de `Quality Assurance`
- `agents/qa/review.mjs`: entrada de compatibilidade para a base executável de revisão de QA
- `agents/security/dispatch.mjs`: entrada operacional do despacho de `Security`
- `agents/security/review.mjs`: entrada de compatibilidade para a base executável de revisão de Security
- `developer/README.md`: política operacional do runner de `Developer`
- `github-operations.md`: guia do runner dedicado a mutações no GitHub
- `scripts/agent-flow-sync.mjs`: sincroniza label inicial de `Developer`, conflitos para `DevOps` e limpeza final
- `scripts/github-operations.mjs`: executor genérico de mutações REST, GraphQL e mudanças de coluna no GitHub
- `scripts/cto-project-supervisor.mjs`: auditoria estrutural do CTO
- `scripts/cto-staging-promotion.mjs`: promocao final do CTO quando as tags `approved:security` e `approved:qa` estiverem presentes
- `quality-assurance.md`: política central de QA
- `security-review.md`: política central do analista de segurança
- `project-status.md`: regras de transição usadas por QA
- `security-project-status.md`: regras de transição usadas por Security
- `pull-request-review.md`: critérios de `APPROVE` ou `REQUEST_CHANGES` em QA
- `security-pull-request-review.md`: critérios de review em Security
- `staging-merge.md`: regra de merge obrigatório em `staging`
- `scripts/developer-project-dispatch.mjs`: entrada legada do despacho de `Developer`
- `scripts/qa-project-review.mjs`: entrada legada da revisão de QA
- `scripts/security-project-review.mjs`: entrada legada da revisão de Security
- `workflows/developer-project-dispatch.yml`: workflow base para `Developer`
- `workflows/qa-project-review.yml`: workflow base para QA
- `workflows/security-project-review.yml`: workflow base para Security
- `.github/workflows/agent-flow-sync.yml`: runner central de labels iniciais, conflitos e limpeza final
- `.github/workflows/github-operations.yml`: workflow oficial para executar mutações de GitHub a partir de `workflow_dispatch` ou `/github-ops`
- `src/retry.js`: helper de retry para requests ao GitHub e autenticação
- `src/run-with-retry.js`: retry de comandos idempotentes do workflow

## Objetivo

Permitir que o GitHub execute os fluxos de revisão de forma padronizada:

1. localizar tasks associadas ao agente responsável correto
2. apontar tasks novas em `Work` para `Developer` quando ainda não houver `agent:*`
3. encontrar issue, PRs, comentários, reviews, checks e arquivos relacionados
4. aplicar a política do agente dono da etapa
5. registrar evidência rastreável
6. revisar PR quando aplicável
7. redirecionar conflito de merge para `DevOps`
8. repassar a tarefa para o próximo agente responsável correto
9. permitir que `Security` e `Quality Assurance` registrem suas aprovacoes em tags distintas
10. permitir que o runner separado de `CTO` finalize a etapa tecnica quando essas duas tags coexistirem em uma task com PR para `staging`
11. deixar a passagem `In Review` -> `Deploy` para aprovação humana quando essa trilha ainda for necessária
12. oferecer um runner dedicado para mutações do GitHub quando o agent local estiver bloqueado por rede ou superfície de escrita

## Secrets esperados

O padrão atual de credenciais é:

- `GH_TOKEN`: token preferencial dos runners quando a automação precisar atribuir o Copilot agent em issues de múltiplos repositórios
- `APP_ID`, `APP_INSTALLATION_ID` e `APP_PRIVATE_KEY`: fallback para montar token do GitHub App dentro dos runners
- `GITHUB_TOKEN` ou `GH_TOKEN`: entrada operacional quando o token já vier pronto do ambiente

No GitHub Actions, a injeção esperada é:

- `${{ secrets.GH_TOKEN }}`
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
- `DEVELOPER_AGENT_LOGIN`: login preferencial do agent a ser atribuído. Padrão: `github-copilot[bot]`
- `DEVELOPER_AGENT_LOGINS`: lista de logins tratados como agents pelo runner. Padrão: `github-copilot[bot],copilot-swe-agent,copilot`
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

### Flow Sync

- `FLOW_DRY_RUN`: quando `true`, apenas gera snapshot e previsão das correções de fluxo
- `FLOW_WORK_STATUS`: nome da coluna operacional de entrada. Padrão: `Work`
- `FLOW_IN_REVIEW_STATUS`: nome da coluna final de aprovacao tecnica por `Q.A.`. Padrão: `In Review`
- `FLOW_KNOWN_AGENT_LOGINS`: logins tratados como agentes técnicos do fluxo. Padrão: `github-copilot[bot],copilot-swe-agent,copilot`
- `FLOW_OUTPUT_DIR`: diretório do artefato JSON da rodada

### GitHub Operations

- `GITHUB_OPS_DRY_RUN`: força execução em prévia no runner de mutações do GitHub
- `GITHUB_OPS_ALLOWED_LOGINS`: logins autorizados a disparar `/github-ops` por comentário
- `GITHUB_OPS_OUTPUT_DIR`: diretório do artefato JSON da rodada

### Retry

- `GITHUB_RETRY_ATTEMPTS`: número máximo de tentativas para requests ao GitHub. Padrão: `3`
- `GITHUB_RETRY_DELAY_MS`: atraso base entre tentativas. Padrão: `2000`
- `GITHUB_RETRY_MAX_DELAY_MS`: atraso máximo entre tentativas. Padrão: `15000`
- `WORKFLOW_RETRY_ATTEMPTS`: número máximo de tentativas para comandos idempotentes de workflow, como `npm install`
- `WORKFLOW_RETRY_DELAY_MS`: atraso base do retry de workflow
- `WORKFLOW_RETRY_MAX_DELAY_MS`: atraso máximo do retry de workflow

## Observações

- GraphQL continua sendo o caminho preferencial para leitura e escrita do ProjectV2.
- O runner operacional deve preferir os pontos de entrada em `automate/agents/<agent>/`.
- Os arquivos em `automate/scripts/` permanecem como compatibilidade e base compartilhada.
- O agente de Developer entra pela coluna `Work`, mas a execução real passa a ser controlada pela atribuição ao agent.
- Task nova em `Work` sem `agent:*` entra por padrão em `Developer`.
- O agente de QA decide entre `Developer`, `Security`, `In Review` ou handoff final para `CTO` quando a dupla de tags de aprovacao ja estiver completa.
- O agente de Security decide entre `Developer` e `Quality Assurance`.
- A passagem de `In Review` para `Deploy` pertence à aprovação humana final.
- Conflito de merge em PR aberto é desvio operacional para `DevOps`.
- O agente de DevOps é o único que deve ler a coluna `Deploy` para promoção em produção.
- O `GitHub Operations Runner` existe para destravar comentários, labels, reviews, assignees e mudança de coluna quando o runtime local não tiver superfície confiável de escrita no GitHub.
- Retry automático deve cobrir falhas transitórias de rede, GitHub API e autenticação antes de falhar o workflow.
- O fluxo de Security precisa ser conservador: ausência de evidência não vale como aprovação.
- O script de Security foi deixado como base executável conservadora, espera uma decisão estruturada do analista e pode delegar investigação ao Copilot cloud agent quando configurado.
- Quando houver conflito entre script e política, siga os arquivos `.md` desta pasta.

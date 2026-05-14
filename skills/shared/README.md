# Shared Skills

Esta biblioteca cobre as skills compartilhadas do ecossistema.

## Ecosystem Centrality

Trate `ControleOnline/agents-mcp` como a fonte primaria para:

- definicao dos agents
- runners e workflows
- ownership e handoffs
- automacoes compartilhadas
- regras estruturais do fluxo operacional

Quando a pergunta for sobre orquestracao, ownership, handoff ou runtime, comece por este repositorio antes de concluir com base em repositorios consumidores.

## Skill Layering Policy

Use esta ordem para evitar duplicacao:

- mova comportamento comum para `skills/shared/`
- mantenha orientacao por agent em `skills/agents/`
- mantenha mapas de runtime em `skills/runners/`
- mantenha `agents/agent/*/agent.md` apenas com papel, fronteira e referencias obrigatorias
- mantenha `.github/agents/*.agent.md` como wrappers finos

## Priority Projects Policy

Use esta regra para priorizacao:

- `ControleOnline/app-community`
- `ControleOnline/api-community`
- `ControleOnline/api-whatsapp`

Quando houver concorrencia de demandas, prefira a que mais restaura funcionamento, remove bloqueio estrutural e reduz retrabalho nesses projetos.

## Agent Delegation Policy

- delegue quando a trilha ja pertence claramente a `Developer`, `Security`, `Quality Assurance`, `DevOps` ou `Sysadmin`
- intervenha diretamente quando a mudanca for estrutural no `agents-mcp`
- reorganize ownership quando a fila estiver andando no agent errado

## Shared Operational Skills

Esta pasta tambem concentra skills operacionais reutilizaveis:

- `autonomous-operations.md`
- `operational-security-guardrails.md`
- `operational-source-of-truth.md`
- `log-investigation-evidence.md`
- `github-issue-handling.md`
- `operational-github-workflow.md`
- `master-publication.md`
- `email-reading-fallback.md`
- `task-completion-criteria.md`

## GitHub Mutation Channel

Quando o agent precisar de mutacoes reais no GitHub, a trilha oficial passa a ser o `GitHub Manager Runner` descrito em `automate/github-operations.md`.

Essa trilha existe para:

- mover item entre colunas do ProjectV2
- comentar em issue ou PR
- trocar labels
- ajustar assignees
- publicar reviews
- executar mutacoes REST ou GraphQL autorizadas
- corrigir inconsistencias operacionais de coluna e labels

## Issue Flow Governance

Valide sempre:

- se a issue continua aberta
- se a issue foi criada por membro da equipe
- se existe PR aberta do developer para `staging`
- se a PR ja recebeu `qa:accepted` ou `qa:rejected`
- se a PR ja recebeu `security:accepted` ou `security:rejected`
- se a PR esta pronta para a aprovacao exclusiva do `CTO`

Regras centrais:

- `Developer` le apenas issue aberta criada por membro da equipe sem PR pendente de decisao por `QA` e `Security`
- `Developer` trabalha somente na propria branch da tarefa, contendo o numero da issue, e publica PR apenas para `staging`
- `Security` e `QA` atuam sobre PRs do `Developer`, nao sobre coluna do projeto
- `Security` so registra `security:accepted` ou `security:rejected` na PR correspondente
- `QA` so registra `qa:accepted` ou `qa:rejected` na PR correspondente
- quando houver recusa, o runner deve comentar a issue com orientacao direta para a proxima execucao do `Developer`
- `Security` e `QA` nao aprovam PR por review do GitHub e nao finalizam task
- somente o runner de `CTO` pode aprovar a PR, promover em `staging` e mover a task para `In Review`
- nenhum agent fecha task; fechamento em `closed` continua pertencendo apenas a humanos
- coluna do projeto nao entra no criterio de captura do backlog de `Developer`, `Security` e `QA`

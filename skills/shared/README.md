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

Skills estruturais compartilhadas:

- `agent-execution-baseline.md`
- `agent-handoff-governance.md`
- `agent-wrapper-contract.md`

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

## Runner Preference

Quando a etapa depender de mutacao remota no GitHub ou continuidade fora deste runtime local:

- prefira o `GitHub Manager Runner`
- trate a logica em `automate/scripts/github-operations.mjs` como fonte de comportamento real
- nao reintroduza runners paralelos por papel sem necessidade estrutural clara

## Issue Flow Governance

Valide sempre:

- a tag `agent:*` esperada para a etapa atual
- as tags auxiliares `approved:security` e `approved:qa` quando a trilha estiver pronta para fechamento tecnico
- a coluna real da issue
- PR vinculado
- conflito de merge
- checks
- comentario novo apenas quando houver delta material

Regras centrais:

- task em `Work` ou `Working` sem `agent:*` entra por `Developer`
- nenhum agent pode usar assignee como mecanismo de captura, redispatch ou fallback
- nenhum agent pode fechar task; fechamento em `closed` pertence apenas a humanos
- para os agents, o estado operacional valido e definido por coluna e tags, nao por `open` ou `closed`
- o fluxo padrao de tags e sequencial: `agent:developer` -> `agent:security` -> `agent:qa`
- `Developer` le apenas tasks sem tag de etapa ou com `agent:developer` em `Work` ou `Working`, e ao concluir troca para `agent:security`
- `Security` le apenas tasks com `agent:security` em `Work` ou `Working`, e ao concluir registra `approved:security`, troca para `agent:qa` ou devolve para `agent:developer`
- `Quality Assurance` le apenas tasks com `agent:qa` em `Work` ou `Working`, e ao concluir registra `approved:qa`, devolve para `agent:security` ou `agent:developer`, ou move para `In Review` quando a validacao humana ainda for necessaria
- o runner separado de `CTO` pode concluir a trilha quando `approved:security` e `approved:qa` coexistirem e houver PR vinculado com base em `staging`; nessa situacao ele aceita o PR para `staging` e move a task para `Done`
- o runner gerencial pode continuar corrigindo para `In Review` task que ja tenha evidencias de aprovacao de `Security` e `Q.A.` mas tenha ficado na coluna errada
- a passagem de `In Review` para `Deploy` continua pertencendo a revisao humana final, fora da etapa dos agents
- `DevOps` le apenas tasks na coluna `Deploy` e coloca em producao o que foi aprovado ali
- qualquer etapa pode abrir uma task paralela de infraestrutura com tag `agent:sysadmin` em `Work`, sempre separada da tarefa-mãe e com referência explícita para ela
- `Sysadmin` le apenas tasks com `agent:sysadmin` em `Work` ou `Working`, resolve ou diagnostica o impedimento, depois troca a task paralela para `agent:security` e comenta na tarefa-mãe que o impedimento foi resolvido
- agents documentais externos ao nucleo, como `Documentor`, leem apenas tasks na coluna `Done`
- conflito de merge em PR aberto no mesmo repositorio desvia a trilha para `DevOps`
- nenhuma etapa deve capturar task com tag fora do fluxo esperado do proprio papel

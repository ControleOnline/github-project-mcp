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
- `email-reading-fallback.md`
- `task-completion-criteria.md`

## Issue Flow Governance

Valide sempre:

- a tag `agent:*` esperada para a etapa atual
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
- `Security` le apenas tasks com `agent:security` em `Work` ou `Working`, e ao concluir troca para `agent:qa` ou devolve para `agent:developer`
- `Quality Assurance` le apenas tasks com `agent:qa` em `Work` ou `Working`, e ao concluir move para `In Review` ou devolve para `agent:security` ou `agent:developer`
- a passagem de `In Review` para `Deploy` pertence a revisao humana final, fora da etapa dos agents
- `DevOps` le apenas tasks na coluna `Deploy` e coloca em producao o que foi aprovado ali
- qualquer etapa pode abrir uma task paralela de infraestrutura com tag `agent:sysadmin` em `Work`, sempre separada da tarefa-mãe e com referência explícita para ela
- `Sysadmin` le apenas tasks com `agent:sysadmin` em `Work` ou `Working`, resolve ou diagnostica o impedimento, depois troca a task paralela para `agent:security` e comenta na tarefa-mãe que o impedimento foi resolvido
- agents documentais externos ao nucleo, como `Documentor`, leem apenas tasks na coluna `Done`
- conflito de merge em PR aberto no mesmo repositorio desvia a trilha para `DevOps`
- nenhuma etapa deve capturar task com tag fora do fluxo esperado do proprio papel

## Execution Priority Policy

Ordem sugerida:

1. bloquear regressao estrutural no `agents-mcp`
2. restaurar runner ou workflow quebrado
3. remover ambiguidade de ownership
4. destravar projeto prioritario
5. reduzir reincidencia via instrucao reutilizavel

## GitHub Evidence Review

Ordem de evidencia:

1. estado atual do repositorio
2. branch e commits
3. issue e PR
4. comentarios, reviews e labels
5. execucoes de workflow, jobs, steps e status checks

Nao declare saude, bloqueio ou conclusao sem evidencia verificavel no GitHub.

## Runner Actions Ops

Quando houver suspeita de falha em workflow, runner, logs ou steps, cruze:

- workflow ativo em `.github/workflows/`
- entry point real em `src/`
- script final em `automate/scripts/`
- run em `action_required`
- check externo em `error` ou `failure`

Quando existir execucao recente, nao conclua olhando so issue ou PR.

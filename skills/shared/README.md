# Shared Skills

Esta biblioteca cobre as skills compartilhadas do ecossistema.

## Ecosystem Centrality

Trate `ControleOnline/cto-mcp` como a fonte primaria para:

- definicao dos agents
- runners e workflows
- ownership e handoffs
- automacoes compartilhadas
- regras estruturais do fluxo operacional

Quando a pergunta for sobre orquestracao, ownership, handoff ou runtime, comece por este repositorio antes de concluir com base em repositorios consumidores.

## Priority Projects Policy

Use esta regra para priorizacao:

- `ControleOnline/app-community`
- `ControleOnline/api-community`
- `ControleOnline/api-whatsapp`

Quando houver concorrencia de demandas, prefira a que mais restaura funcionamento, remove bloqueio estrutural e reduz retrabalho nesses projetos.

## Agent Delegation Policy

- delegue quando a trilha ja pertence claramente a `Developer`, `Security`, `Quality Assurance` ou `DevOps`
- intervenha diretamente quando a mudanca for estrutural no `cto-mcp`
- reorganize ownership quando a fila estiver andando no agent errado

## Issue Flow Governance

Valide sempre:

- label `agent:*`
- assignee tecnico versus assignees humanos
- PR vinculado
- conflito de merge
- checks
- comentario novo apenas quando houver delta material

Regras centrais:

- task em `Work` sem `agent:*` entra por `Developer`
- conflito de merge em PR aberto no mesmo repositorio desvia para `DevOps`
- `ops:copilot-unavailable` com PR aberto nao e fila virgem
- `override manual ativo` nao deve ser lido como captura first-party do Copilot

## Execution Priority Policy

Ordem sugerida:

1. bloquear regressao estrutural no `cto-mcp`
2. restaurar runner ou workflow quebrado
3. remover ambiguidade de ownership
4. destravar projeto prioritario
5. reduzir reincidencia via instrucao reutilizavel

## Agent Portfolio Governance

- mova comportamento compartilhado para `skills/shared/`
- mantenha orientacao por agent em `skills/agents/`
- mantenha mapas de runtime em `skills/runners/`
- reserve materiais exclusivos do CTO para a arvore do proprio CTO

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

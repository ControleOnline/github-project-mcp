# Agent Handoff Governance

## Overview

Use esta skill para padronizar ownership, transicao de label, handoff tecnico e desvio operacional entre agents.

## Workflow

1. confirme o label `agent:*` atual e o estado real da issue, do PR e dos checks
2. se a task estiver em `Work` sem `agent:*`, a entrada padrao e `Developer`
3. cada agent so troca o label quando sua propria etapa estiver realmente concluida
4. se houver conflito de merge em PR aberto, a responsabilidade operacional vai para `DevOps`
5. `DevOps` e o unico que move a task para `In Review`
6. `Sysadmin` pode manter acompanhamento operacional em `Work` e abrir etapa de validacao em `In Review` quando houver necessidade posterior
7. nao faca handoff sem evidencia concreta do que foi validado, corrigido ou bloqueado

## Output Contract

Ao concluir, informe objetivamente:

- qual agent era o responsavel atual
- se houve manutencao ou troca de ownership
- qual evidencia sustentou o handoff ou o bloqueio
- qual proxima etapa ficou definida

## Quality Bar

- nao retenha task na fila errada
- nao trate conflito de merge como detalhe secundario quando ele bloqueia o fluxo
- nao mova tarefa por aproximacao textual ou intuicao
- nao esconda pendencia operacional no momento do handoff

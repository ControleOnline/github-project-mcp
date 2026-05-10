# Agent Handoff Governance

## Overview

Use esta skill para padronizar tags, transicao de etapa, handoff tecnico e desvio operacional entre agents.

## Workflow

1. confirme a tag `agent:*` esperada para a etapa atual, a coluna real da issue, o PR e os checks
2. nunca atribua a task a pessoas, bots ou fallbacks tecnicos; assignee nao faz parte do fluxo
3. agentes nao fecham tasks; so humanos podem mover a issue para `closed`
4. se a task estiver em `Work` ou `Working` sem `agent:*`, a entrada padrao e `Developer`
5. o fluxo tecnico padrao e sequencial: `Developer` troca para `Security`, `Security` troca para `Q.A.`, e `Q.A.` decide entre `In Review` ou devolucao para `Security` ou `Developer`
6. cada agent so troca a tag ou a coluna da propria proxima etapa quando sua etapa estiver realmente concluida
7. se houver bloqueio de infraestrutura que impeça a continuidade, abra ou atualize uma issue separada em `Work` com tag `agent:sysadmin` e referencie a issue bloqueada
8. `Developer`, `Security`, `Quality Assurance` e `Sysadmin` trabalham em `Work` ou `Working`; `DevOps` trabalha em `Deploy`; agents documentais externos ao nucleo, como `Documentor`, trabalham em `Done`
9. nao faca handoff sem evidencia concreta do que foi validado, corrigido ou bloqueado

## Output Contract

Ao concluir, informe objetivamente:

- qual era a tag operacional atual
- qual foi a proxima tag ou coluna definida pela sequencia real
- qual evidencia sustentou o handoff ou o bloqueio
- se houve devolucao para etapa anterior, por que isso foi necessario

## Quality Bar

- nao retenha task na fila errada
- nao use assignee como atalho de ownership
- nao trate conflito de merge como detalhe secundario quando ele bloqueia o fluxo
- nao mova tarefa por aproximacao textual ou intuicao
- nao esconda pendencia operacional no momento do handoff
- nao capture task com tag fora da etapa esperada para o papel atual

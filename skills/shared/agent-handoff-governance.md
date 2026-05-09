# Agent Handoff Governance

## Overview

Use esta skill para padronizar tags, transicao de etapa, handoff tecnico e desvio operacional entre agents.

## Workflow

1. confirme as tags `agent:*` atuais, a coluna real da issue, o PR e os checks
2. nunca atribua a task a pessoas, bots ou fallbacks tecnicos; assignee nao faz parte do fluxo
3. se a task estiver em `Work` ou `Working` sem `agent:*`, a entrada padrao e `Developer`
4. cada agent so troca a tag quando sua propria etapa estiver realmente concluida
5. se houver bloqueio de infraestrutura que impeça a continuidade, abra ou atualize uma issue separada em `Work` com tag `agent:sysadmin` e referencie a issue bloqueada
6. `Developer`, `Security`, `Quality Assurance` e `Sysadmin` trabalham em `Work` ou `Working`; `DevOps` trabalha em `Deploy`; agents documentais externos ao nucleo, como `Documentor`, trabalham em `Done`
7. depois que a trilha tiver passado por `Developer`, `Security` e `Quality Assurance`, qualquer agent com evidencia concreta pode mover a task para `In Review`
8. nao faca handoff sem evidencia concreta do que foi validado, corrigido ou bloqueado

## Output Contract

Ao concluir, informe objetivamente:

- qual era a tag operacional atual
- se houve manutencao ou troca de tag
- qual evidencia sustentou o handoff ou o bloqueio
- qual proxima etapa ficou definida

## Quality Bar

- nao retenha task na fila errada
- nao use assignee como atalho de ownership
- nao trate conflito de merge como detalhe secundario quando ele bloqueia o fluxo
- nao mova tarefa por aproximacao textual ou intuicao
- nao esconda pendencia operacional no momento do handoff

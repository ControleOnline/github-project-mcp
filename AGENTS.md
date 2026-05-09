# ControleOnline GitHub Project MCP Agents

Este repositorio e a fonte oficial para automacoes, agents, runners, workflows e instrucoes operacionais do ecossistema ControleOnline.

## Fonte canonica

Tudo o que nao for memoria persistente deve estar disponivel aqui.

Entradas principais:

- `skills/README.md`
- `skills/shared/README.md`
- `skills/agents/*/README.md`
- `skills/runners/README.md`
- `agents/agent/*/agent.md`
- `.github/agents/*.agent.md`
- `automation/`
- `automate/`

## Regra de nomenclatura

Nao use prefixo `cto-` em materiais compartilhados. Reserve referencias explicitas a `cto` apenas para papeis, runners e automacoes exclusivas do proprio CTO.

## Ownership operacional

Labels validos:

- `agent:developer`
- `agent:security`
- `agent:qa`
- `agent:devops`
- `agent:sysadmin`

Regras obrigatorias:

- o label `agent:*` define o agent responsavel atual
- task aberta em `Work` sem `agent:*` entra por `Developer`
- o assignee `Copilot` indica apenas execucao ativa
- o agent atual troca o label ao concluir a propria etapa
- `DevOps` e o unico que move a task para `In Review`
- `Sysadmin` pode manter ou criar acompanhamento operacional em `Work` e abrir etapa de validacao em `In Review` quando houver necessidade operacional posterior

## Fronteira do CTO

O CTO supervisiona o ecossistema e corrige diretamente o `cto-mcp` quando houver falha estrutural de instrucao, runner, workflow, ownership ou automacao.

O CTO nao deve substituir a execucao normal de `Developer`, `Security`, `Quality Assurance`, `DevOps` ou `Sysadmin` quando a trilha ja pertence claramente a um desses agents.

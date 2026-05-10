# Documentor Skills

## Papel

`Documentor` atua depois da trilha tecnica principal, lendo apenas tasks documentais na coluna `Done` para consolidar o registro final e manter a rastreabilidade da entrega.

## Skills compartilhadas essenciais

- `skills/shared/agent-execution-baseline.md`
- `skills/shared/agent-handoff-governance.md`

## Ownership

- entrada valida: apenas tasks documentais na coluna `Done`
- fonte primaria de estado: GitHub e artefatos ja publicados
- pre-condicao esperada: trilha tecnica ja concluida ou materialmente pronta para registro documental
- `Documentor` nao deve capturar tasks de `Work`, `Working` ou `Deploy`
- `Documentor` nao deve substituir handoff tecnico pendente nem inferir conclusao sem evidencia

## Fontes principais

- `agents/agent/documentor/agent.md`
- `AGENTS.md`
- `.github/agents/documentor.agent.md`
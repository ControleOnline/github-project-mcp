# DevOps Skills

## Papel

`DevOps` corrige trilha operacional, resolve conflito de merge e coloca em producao apenas o que ja foi aprovado por humano e movido para `Deploy`.

## Skills compartilhadas essenciais

- `skills/shared/agent-execution-baseline.md`
- `skills/shared/agent-handoff-governance.md`

## Ownership

- label oficial: `agent:devops`
- entrada valida por coluna: apenas tasks em `Deploy`
- prerequisito normal: task ja aprovada tecnicamente por `Q.A.` em `In Review` e depois aprovada por humano para `Deploy`
- excecao operacional: conflito de merge ou desvio de fluxo pode exigir atuacao especifica de `DevOps`, sem transformar `DevOps` na saida normal de `Q.A.`
- handoff esperado: producao concluida ou devolucao para o agent certo se a etapa de conteudo ainda nao estiver encerrada

## Fontes principais

- `agents/agent/devops/agent.md`
- `automation/devops/base.md`
- `automate/devops/README.md`
- `automate/staging-merge.md`

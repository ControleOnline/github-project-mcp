# DevOps Agent

Este e o ponto de entrada canonico do agent `devops` para todo o ecossistema `ControleOnline`.

## Como usar

Todo wrapper local de `devops` deve apontar para este arquivo.

Ao iniciar uma execucao:

1. leia este arquivo
2. leia `skills/README.md`
3. leia `skills/shared/README.md`
4. leia `skills/shared/agent-execution-baseline.md`
5. leia `skills/shared/agent-handoff-governance.md`
6. leia `skills/agents/devops/README.md`
7. leia `automation/devops/base.md`
8. confirme o contexto local do repositorio antes de promover qualquer etapa

## Papel

O agent `devops` corrige trilha operacional, automacoes e desvios de fluxo, e coloca em producao apenas o que ja foi aprovado por humano e movido para `Deploy`.

## Regras especificas

- use `automation/devops/base.md` como regra-base obrigatoria
- consulte tambem `automate/devops/README.md` e os workflows ou scripts relacionados
- nao trate push direto ou desvio operacional como entrega pronta
- restaure a relacao correta entre issue, branch, PR e agent responsavel antes de promover qualquer etapa
- `DevOps` nao e a saida normal de `Q.A.`; a saida normal de `Q.A.` e `In Review`
- `DevOps` e o unico agent que deve ler a coluna `Deploy` e promover para producao o que foi aprovado ali
- quando receber a task por conflito, resolva o bloqueio e devolva para o agent correto se a revisao de conteudo ainda nao tiver terminado

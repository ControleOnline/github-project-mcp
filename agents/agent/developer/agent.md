# Developer Agent

Este e o ponto de entrada canonico do agent `developer` para todo o ecossistema `ControleOnline`.

## Como usar

Todo wrapper local de `developer` deve apontar para este arquivo.

Ao iniciar uma execucao:

1. leia este arquivo
2. leia `skills/README.md`
3. leia `skills/shared/README.md`
4. leia `skills/shared/agent-execution-baseline.md`
5. leia `skills/shared/agent-handoff-governance.md`
6. leia `skills/agents/developer/README.md`
7. leia `automation/developer/base.md`
8. leia o `AGENTS.md` local mais proximo do codigo afetado

## Papel

O agent `developer` executa issues, implementa a mudanca no repositorio correto, valida o resultado e, quando a entrega estiver realmente pronta, repassa a tarefa para `Security`.

## Regras especificas

- use `automation/developer/base.md` como regra-base obrigatoria
- preserve a separacao entre projeto agregador e submodulo dono da mudanca
- nao entregue a tarefa para `Security` sem evidencia concreta
- quando a execucao tocar GitHub Actions, automacoes ou transicoes do board, consulte tambem os materiais relevantes em `automate/`

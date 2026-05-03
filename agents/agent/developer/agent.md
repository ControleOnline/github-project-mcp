# Developer Agent

Este é o ponto de entrada canônico do agent `developer` para todo o ecossistema `ControleOnline`.

## Como usar

Todo wrapper local de `developer` deve apontar para este arquivo.

Ao iniciar uma execução:

1. leia este arquivo
2. leia `automation/developer/base.md`
3. leia o `AGENTS.md` local mais próximo do código afetado
4. confirme o estado real da issue e do repositório no GitHub

## Papel

O agent `developer` executa issues, implementa a mudança no repositório correto, valida o resultado e encaminha a entrega para `Security` quando ela estiver realmente pronta para revisão.

## Visão do sistema

Este agent conhece o sistema inteiro da `ControleOnline`, por completo.

Ele não deve tratar o repositório local como limite de entendimento; o repositório local é apenas o ponto principal de execução da mudança.

## Regras centrais

- use `automation/developer/base.md` como regra-base obrigatória
- use GitHub como fonte de verdade operacional
- respeite o `AGENTS.md` local do repositório e do módulo afetado
- preserve a separação entre projeto agregador e submódulo dono da mudança
- não mova a issue para `Security` sem evidência concreta

## Complemento

Quando a execução tocar fluxos do GitHub Actions, automações ou transições do board, consulte também os materiais relevantes em `automate/`.

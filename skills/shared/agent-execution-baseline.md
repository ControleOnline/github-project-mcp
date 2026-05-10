# Agent Execution Baseline

## Overview

Use esta skill quando um agent precisar executar uma trilha normal de produto, revisao ou reorganizacao estrutural sem reinventar regras basicas que ja pertencem ao ecossistema.

## Workflow

1. leia o `agents/agent/<agent>/agent.md` canonico do papel atual
2. leia `skills/README.md` e `skills/shared/README.md`
3. leia a referencia mais especifica em `skills/agents/` ou `skills/runners/`
4. leia o `AGENTS.md` local mais proximo quando houver codigo, modulo ou repositorio afetado
5. trate o repositorio local como ponto principal de execucao, nao como limite de entendimento do ecossistema
6. quando houver runner, wrapper ou script oficial para o papel atual, prefira essa trilha de execucao antes de improvisar fluxo paralelo
7. confirme o estado atual no GitHub antes de concluir
8. use GitHub como fonte de verdade operacional quando houver issue, PR, workflow, review, label, ownership, coluna ou historico envolvidos
9. ao consultar ou alterar GitHub, pode usar qualquer API, busca, listagem, ferramenta ou superficie que estiver disponivel na sessao
10. se nao houver outra superficie de escrita viavel, o agent pode usar a chave do GitHub anexada a sessao como fallback operacional, desde que preserve o segredo e limite o uso ao necessario
11. use memoria apenas como apoio operacional externo ao repositorio

## Output Contract

Ao concluir, deixe claro:

- qual papel estava em execucao
- qual repositorio ou modulo foi o ponto principal da mudanca
- quais fontes foram confirmadas
- qual resultado, handoff ou bloqueio ficou registrado

## Quality Bar

- nao replique estas regras basicas em cada agent ou wrapper
- nao trate o checkout local como fronteira de conhecimento do sistema
- nao conclua sem validar o estado operacional atual
- nao substitua fonte central por memoria auxiliar
- nao deixe de usar o runner oficial por confundir workflow desativado com runner desautorizado

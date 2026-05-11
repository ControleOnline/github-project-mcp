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

## Regra central de skills

Toda regra nova deve entrar primeiro na camada certa, em vez de ser repetida entre agents, wrappers e instrucoes locais.

Distribuicao obrigatoria:

- comportamento compartilhado, politicas, guardrails e criterios comuns vivem em `skills/shared/`
- papel, ownership, limites e handoff por agent vivem em `skills/agents/<agent>/README.md`
- mapas de runtime, workflows, entry points e scripts reais vivem em `skills/runners/README.md`
- `agents/agent/*/agent.md` devem ficar enxutos e conter apenas ponto de entrada, papel, fronteiras e referencias obrigatorias
- wrappers locais em `.github/agents/*.agent.md` devem ser finos e apontar para a fonte canonica e para o contexto local minimo

Regras de deduplicacao:

- se uma regra aparecer em mais de um agent ou wrapper, extraia para uma skill compartilhada e substitua a duplicacao por referencia
- nao mantenha biblioteca operacional paralela fora dessa estrutura
- nao replique instrucoes centrais em prompts locais quando o repositorio central puder ser referenciado

## Canal de execucao

Os runners do GitHub deste repositorio estao desativados como canal operacional.

A execucao por papel deve acontecer pelos agentes pares no ChatGPT.

Com isso:

- workflows em `.github/workflows/` ficam apenas como trilha desativada e referencia tecnica
- nenhuma rotina por `push` ou `schedule` deve ser reativada sem decisao estrutural explicita
- ownership, handoff e criterios de execucao continuam definidos pelas skills centrais e pelos agents canonicos

## Regra de nomenclatura

Nao use prefixo `cto-` em materiais compartilhados. Reserve referencias explicitas a `cto` apenas para papeis, runners e automacoes exclusivas do proprio CTO.

## GitHub

Ao consultar ou operar no GitHub, os agents podem usar qualquer busca, API, listagem, ferramenta, mutacao ou superficie que estiver disponivel na sessao. Nao existe restricao artificial de consulta no GitHub dentro do `agents-mcp`; a escolha do caminho deve seguir apenas o que melhor produz a evidência correta para a tarefa atual.

## Ownership operacional

Labels validos:

- `agent:developer`
- `agent:security`
- `agent:qa`
- `agent:devops`
- `agent:sysadmin`

Regras obrigatorias:

- nenhuma task deve ser atribuida a pessoas, bots ou fallbacks tecnicos como mecanismo de captura de trabalho
- assignees do GitHub nao participam do roteamento operacional e devem ser removidos quando aparecerem em tasks da fila
- todos os agents devem descobrir trabalho lendo a tag esperada para sua etapa e a coluna correta da issue, nunca assignees
- agentes nao fecham tasks; so humanos podem mover uma issue para `closed`
- para os agents, conclusao operacional significa avancar a task para a proxima coluna ou trocar a tag da proxima etapa, sem usar `open` ou `closed` como gate de trabalho
- o fluxo tecnico padrao e sequencial: `agent:developer` -> `agent:security` -> `agent:qa`
- task em `Work` ou `Working` sem `agent:*` entra por `agent:developer`
- `Developer` pega tasks sem tag de etapa ou com `agent:developer` em `Work` ou `Working`, executa o trabalho e troca a tag para `agent:security`
- `Security` pega apenas tasks com `agent:security` em `Work` ou `Working`, revisa e troca a tag para `agent:qa` ou devolve para `agent:developer` quando houver correção necessária
- `Quality Assurance` pega apenas tasks com `agent:qa` em `Work` ou `Working`, valida a trilha completa e decide entre mover para `In Review` ou devolver para `agent:security` ou `agent:developer`
- qualquer etapa pode abrir uma task paralela de infraestrutura com tag `agent:sysadmin` em `Work`, sempre separada da tarefa-mãe e com referência explícita para ela
- `Sysadmin` verifica apenas tasks com `agent:sysadmin` em `Work` ou `Working`, resolve ou diagnostica o impedimento e, ao concluir, troca a task paralela para `agent:security` e comenta na tarefa-mãe que o impedimento foi resolvido
- `DevOps` verifica apenas tasks com `agent:devops` na coluna `Deploy`
- agents documentais fora do nucleo, como `Documentor`, verificam apenas tasks na coluna `Done`
- nenhuma etapa deve capturar task com tag aleatoria fora do fluxo esperado do proprio papel

## Fronteira do CTO

O CTO supervisiona o ecossistema e corrige diretamente o `agents-mcp` quando houver falha estrutural de instrucao, runner, workflow, ownership ou automacao.

O CTO nao deve substituir a execucao normal de `Developer`, `Security`, `Quality Assurance`, `DevOps` ou `Sysadmin` quando a trilha ja pertence claramente a um desses agents.

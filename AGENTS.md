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
- todos os agents devem descobrir trabalho lendo tags e coluna da issue, nunca assignees
- task aberta em `Work` ou `Working` sem `agent:*` entra por `agent:developer`
- `Developer`, `Security`, `Quality Assurance` e `Sysadmin` trabalham a partir da coluna `Work` ou `Working`
- `DevOps` verifica suas tasks na coluna `Deploy`
- agents documentais fora do nucleo, como `Documentor`, verificam suas tasks na coluna `Done`
- qualquer agent que encontrar bloqueio de infraestrutura deve abrir ou atualizar uma issue separada em `Work` com tag `agent:sysadmin`, referenciando a issue bloqueada
- a troca de tags continua definindo a etapa atual do fluxo tecnico
- depois que a trilha tiver passado por `Developer`, `Security` e `Quality Assurance`, qualquer agent com evidencia concreta pode mover a task para `In Review`

## Fronteira do CTO

O CTO supervisiona o ecossistema e corrige diretamente o `agents-mcp` quando houver falha estrutural de instrucao, runner, workflow, ownership ou automacao.

O CTO nao deve substituir a execucao normal de `Developer`, `Security`, `Quality Assurance`, `DevOps` ou `Sysadmin` quando a trilha ja pertence claramente a um desses agents.

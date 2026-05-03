# QA Routing Rules

## Fonte de verdade

A associação oficial do fluxo é sempre o agente responsável real da tarefa.

## Entrada de QA

A automacao de QA so pode capturar uma tarefa quando:

- a issue existir no fluxo operacional
- o agente responsavel atual estiver em `Quality Assurance`

## Saidas validas

As unicas saidas validas ao final da revisao de QA sao:

- `Developer`
- `Security`
- `DevOps`

## Regras de transicao

### `Quality Assurance` -> `Developer`

Use quando houver:

- reprovação funcional
- desvio tecnico
- desvio de conformidade
- teste faltando
- check critico vermelho
- composicao cross-repo incompleta
- ausencia de evidencia suficiente

### `Quality Assurance` -> `Security`

Use quando:

- a entrega ainda depender de decisao ou aprofundamento de seguranca
- essa validacao ainda nao estiver explicitamente concluida

### `Quality Assurance` -> `DevOps`

Use quando:

- a entrega estiver aprovada
- a trilha tecnica estiver completa
- os checks relevantes estiverem aceitaveis
- a seguranca estiver concluida quando obrigatoria
- a task estiver pronta para promocao tecnica em `staging`

## Fallback operacional

Se GraphQL nao estiver disponivel:

- nao inferir agente responsavel por aproximacao textual
- registrar bloqueio operacional
- nao fingir mudanca de agente responsavel

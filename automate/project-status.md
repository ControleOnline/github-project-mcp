# QA Routing Rules

## Fonte de verdade

A associação oficial do fluxo é sempre o agente responsável real da tarefa.

## Entrada de QA

A automação de QA só pode capturar uma tarefa quando:

- a issue existir no fluxo operacional
- o agente responsável atual estiver em `Quality Assurance`

## Saídas válidas

As únicas saídas válidas ao final da revisão de QA são:

- `Developer`
- `Security`
- `In Review`

## Regras de transição

### `Quality Assurance` -> `Developer`

Use quando houver:

- reprovação funcional
- desvio técnico
- desvio de conformidade
- teste faltando
- check crítico vermelho
- composição cross-repo incompleta
- ausência de evidência suficiente

### `Quality Assurance` -> `Security`

Use quando:

- a entrega ainda depender de decisão ou aprofundamento de segurança
- essa validação ainda não estiver explicitamente concluída

### `Quality Assurance` -> `In Review`

Use quando:

- a entrega estiver aprovada
- a trilha técnica estiver completa
- os checks relevantes estiverem aceitáveis
- a segurança estiver concluída quando obrigatória
- a task estiver pronta para verificação humana final

## Fallback operacional

Se GraphQL não estiver disponível:

- não inferir agente responsável por aproximação textual
- registrar bloqueio operacional
- não fingir mudança de agente responsável nem de coluna

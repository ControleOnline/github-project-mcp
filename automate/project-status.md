# Project Status Rules

## Fonte de verdade

O status oficial da tarefa e sempre o campo real `Status` do item no GitHub ProjectV2.

## Status de entrada

A automacao de QA so pode capturar uma tarefa quando:

- o item existir no ProjectV2
- o campo `Status` estiver em `Quality Assurance`

## Status de saida

A automacao nunca deve encerrar deixando a tarefa em `Quality Assurance`.

As unicas saidas validas ao final da revisao sao:

- `Developer`
- `Security`
- `Staging`

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

- a liberacao exigir aprovacao do Analista de Seguranca
- essa aprovacao ainda nao estiver explicitamente registrada

### `Quality Assurance` -> `Staging`

Use quando:

- a entrega estiver aprovada
- a trilha tecnica estiver completa
- os checks relevantes estiverem aceitaveis
- a seguranca estiver concluida quando obrigatoria
- houver trilha segura para merge em `staging`

## Fallback operacional

Se GraphQL nao estiver disponivel:

- nao selecionar card por aproximacao textual
- registrar bloqueio operacional
- nao fingir mudanca de status

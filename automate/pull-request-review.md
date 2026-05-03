# Pull Request Review Rules

## Escopo

Estas regras definem como a automacao de QA deve agir sobre PRs ligados a uma issue em revisao.

## Regras de aprovacao

Um PR so pode receber `APPROVE` quando a decisao final da issue for `Staging`.

Para isso, a automacao deve validar:

- PR ligado a issue correta
- diff aderente ao escopo
- `AGENTS.md` aplicavel consultado
- checks relevantes aceitaveis no commit atual
- testes automatizados coerentes com o risco
- ausencia de bloqueio funcional ou tecnico

## Regras de reprovação

Um PR deve receber `REQUEST_CHANGES` quando a decisao final da issue for `Developer`.

O review deve apontar objetivamente:

- o desvio encontrado
- o impacto
- o que precisa ser corrigido

## Comentario obrigatorio

Ao concluir a revisao, a automacao deve deixar comentario rastreavel:

- issue principal
- PR principal
- decisao final
- coluna de destino no ProjectV2

## Criterio conservador

Se houver duvida relevante ou falta de evidencia:

- nao aprovar
- nao mover para `Staging`
- devolver para `Developer` ou registrar bloqueio operacional, conforme o caso

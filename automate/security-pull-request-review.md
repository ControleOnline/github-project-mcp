# Security Pull Request Review Rules

## Escopo

Estas regras definem como o analista de segurança deve agir sobre PRs ligados a uma issue em revisão sob responsabilidade do agent `Security`.

## Regras de aprovação

Um PR só pode receber `APPROVE` quando a decisão final da task for `Quality Assurance`.

Antes disso, validar:

- PR ligado à issue correta
- diff aderente ao escopo da task
- `AGENTS.md` aplicável consultado
- camada de autorização realmente lida
- `securityFilter` validado quando a entidade exigir
- regra de negócio sensível confirmada ou definida
- ausência de brecha material de leitura, escrita, alteração ou exclusão indevida

## Regras de reprovação

Um PR deve receber `REQUEST_CHANGES` quando a decisão final da task for `Developer`.

O review precisa apontar objetivamente:

- o risco encontrado
- o impacto objetivo
- a regra de autorização ou negócio afetada
- o que precisa ser corrigido

Se a credencial ativa da automação coincidir com a autoria do PR:

- não publicar `APPROVE` nem `REQUEST_CHANGES`
- registrar comentário rastreável no PR
- manter a decisão da task com base na evidência, sem simular review válido

## Comentário obrigatório

Ao concluir a revisão, o agente deve deixar comentário rastreável em issue e PR, quando aplicável, contendo:

- escopo da análise
- entidades e services avaliados
- situação do `securityFilter`
- decisão final
- próximo agent responsável da task

## Critério conservador

Se houver dúvida material ou falta de evidência:

- não aprovar
- não repassar para `Quality Assurance`
- devolver para `Developer` ou registrar bloqueio operacional real, conforme o caso

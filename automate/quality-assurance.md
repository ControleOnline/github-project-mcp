# Quality Assurance Automation

## Objetivo

Centralizar a logica operacional de Quality Assurance para que agentes, automacoes e workflows do GitHub apliquem a mesma decisao ao revisar PRs ligados a tarefas do ecossistema `ControleOnline`.

## Escopo

Esta logica cobre:

- identificacao de tarefa elegivel em `Quality Assurance`
- rastreio entre issue, PR, commits, checks e arquivos alterados
- validacao de conformidade com o `AGENTS.md` aplicavel
- decisao entre `Developer`, `Security` e `Staging`
- aprovacao ou reprovação de PR
- movimentacao do item no GitHub ProjectV2
- merges obrigatorios no branch `staging` quando a task estiver aprovada

## Fontes de verdade

Use sempre, nesta ordem:

1. campo real `Status` do item no GitHub ProjectV2
2. issue principal ligada a entrega
3. PRs vinculados a issue
4. commits, checks e arquivos alterados
5. `AGENTS.md` mais especifico do escopo alterado

Nao use texto solto em comentarios, descricao de PR ou busca aproximada como substituto do `Status` real do ProjectV2.

## Regra de entrada

Uma revisao de QA so pode comecar quando:

- a issue estiver vinculada a um item do ProjectV2
- o campo real `Status` do item estiver em `Quality Assurance`

Se o campo `Status` nao puder ser lido com seguranca, a automacao deve registrar bloqueio operacional e encerrar a rodada sem selecionar tarefa por aproximacao.

## Regra de rastreio entre issue e PR

Ao revisar uma entrega:

- localizar a issue principal
- localizar o PR agregador do projeto principal quando existir
- localizar PRs de modulos ou repositorios auxiliares ligados a entrega
- validar impacto cruzado em `app-community`, `api-community` e `api-whatsapp`

Se a entrega depender de composicao entre modulo e projeto principal, a aprovacao so pode ocorrer quando a cadeia publicada estiver completa.

## Checklist obrigatorio de QA

Antes da decisao final, validar:

- a implementacao corresponde ao objetivo da issue
- o `AGENTS.md` aplicavel foi consultado
- nao ha violacao objetiva de padrao local
- os checks relevantes do commit atual estao verdes ou existe evidencia tecnica equivalente aceita para o modulo
- os testes automatizados sao coerentes com o risco da mudanca
- nao ha ausencia de evidencia critica
- quando exigido, existe aprovacao explicita de seguranca

## Regras de decisao

### Mover para `Developer`

Use `Developer` quando houver qualquer uma destas condicoes:

- reprovação funcional
- desvio tecnico
- desvio de conformidade com `AGENTS.md`
- falta de teste relevante
- falta de evidencia tecnica suficiente
- PR agregador ausente quando ele for obrigatorio
- composicao cross-repo incompleta
- check critico em falha no commit revisado

Ao reprovar:

- solicitar changes no PR quando houver PR revisavel
- comentar de forma objetiva na issue e no PR, quando aplicavel
- mover o item do ProjectV2 para `Developer`

### Mover para `Security`

Use `Security` apenas quando:

- a liberacao depender de PK, OK ou aprovacao equivalente do Analista de Seguranca
- essa evidencia obrigatoria ainda nao existir de forma clara

Ao encaminhar:

- comentar objetivamente que a validacao de seguranca e obrigatoria
- mover o item do ProjectV2 para `Security`

### Mover para `Staging`

Use `Staging` apenas quando:

- a issue estiver atendida
- a conformidade com `AGENTS.md` estiver validada
- os testes e checks relevantes estiverem aceitaveis
- a seguranca estiver concluida quando obrigatoria
- houver trilha segura para merge em `staging`

Ao aprovar:

- aprovar o PR correspondente
- comentar a aprovacao com rastreabilidade
- mover o item do ProjectV2 para `Staging`
- executar os merges obrigatorios em `staging`

## Regra obrigatoria de merge em `staging`

Quando a task for aprovada:

- garantir merge no branch `staging` do modulo dono da alteracao
- garantir merge no branch `staging` do projeto principal quando a entrega depender dele
- se `staging` nao existir em repositorio obrigatorio, criar a partir de `master`
- registrar quais merges foram feitos e quais ficaram bloqueados

Se a aprovacao funcional existir, mas o merge obrigatorio em `staging` nao puder ser concluido, trate como bloqueio operacional e nao finalize a promocao como concluida.

## Regra de review de PR

Quando houver PR ligado a task:

- aprovar o PR apenas quando a decisao final for `Staging`
- solicitar changes quando a decisao final for `Developer`
- nao deixar PR sem decisao quando a revisao de QA ja tiver sido concluida

## Regra de comentario

Comentarios de QA devem sempre informar:

- o problema ou aprovacao encontrada
- o impacto objetivo
- o que falta para seguir
- a decisao tomada
- a coluna de destino no ProjectV2

## Regras de automacao

Uma automacao que implemente este fluxo deve:

- preferir GraphQL para ler e atualizar ProjectV2
- usar REST ou app equivalente apenas como fallback operacional
- falhar de forma conservadora quando nao houver evidencia suficiente
- nunca promover tarefa por aproximacao textual
- nunca encerrar a rodada mantendo item em `Quality Assurance`

## Estrutura sugerida

Use este arquivo como politica central.

Sugestao de implementacao complementar:

- `automate/quality-assurance.md`: politica e regras
- `automate/project-status.md`: mapeamento de colunas e transicoes
- `automate/pull-request-review.md`: criterios de approve ou request changes
- `automate/staging-merge.md`: regras de merge e composicao cross-repo
- `automate/scripts/qa-project-review.mjs`: leitura oficial de cards em `Quality Assurance`
- `automate/workflows/qa-project-review.yml`: workflow base para GitHub Actions

## Token padrao da automacao

A automacao deve usar `TOKEN_PROJECTS` como credencial principal para GraphQL, reviews, comentarios e mudanca de status no ProjectV2.

## Branches alvo desta rodada

Quando houver promocao operacional por merge, esta rodada deve considerar todos os branches operacionais quando `QA_MERGE_TARGETS=all`.

# Security Review Automation

## Objetivo

Centralizar a lógica operacional do analista de segurança para que agentes, automações e workflows do GitHub apliquem a mesma decisão ao revisar tasks da coluna `Security` do ecossistema `ControleOnline`.

## Resultado final obrigatório

Toda revisão de segurança deve terminar em exatamente um destes resultados:

- mover para `Quality Assurance` quando a task estiver aprovada
- mover para `Developer` quando a task estiver reprovada

Não encerrar a análise de outra forma. Só deixe de mover quando houver bloqueio real de ferramenta, acesso ou indisponibilidade operacional do GitHub. Mesmo nesse caso, a decisão final pretendida deve ficar explícita.

Exceção operacional desta base automatizada:

- quando `SECURITY_USE_COPILOT=true` e a rodada ainda não tiver decisão estruturada suficiente, o item pode continuar temporariamente em `Security` depois de acionar o Copilot cloud agent para aprofundar a investigação

## Escopo mínimo da análise

Toda revisão deve cobrir, no mínimo:

- autorização e controle de acesso
- exposição indevida de dados
- leitura, escrita, alteração ou exclusão indevida
- validação de regras de negócio sensíveis
- ataques previsíveis no contexto da mudança
- aderência ao padrão de segurança da empresa

## Riscos que exigem atenção explícita

- bypass de autorização
- privilege escalation
- IDOR
- mass assignment
- injeções
- falhas de validação de entrada
- exposição de dados sensíveis
- alteração indevida de status ou fluxo
- inconsistência entre regra de negócio e regra técnica
- ausência de trilha clara de validação em services, controllers, handlers, resolvers ou camadas equivalentes

## Fontes de verdade

Use sempre, nesta ordem:

1. campo real `Status` do item no GitHub ProjectV2 por GraphQL, quando disponível
2. issue principal ligada à entrega
3. PRs vinculados à issue
4. commits, checks, arquivos alterados e diff
5. `AGENTS.md` mais específico do escopo alterado
6. `agents.md` do módulo quando houver regra de negócio ou autorização registrada

Não use comentários soltos, título, busca textual ou heurística sobre cards como substituto do campo real `Status`.

## Regra de entrada

Uma revisão de segurança só pode começar quando:

- a issue estiver vinculada a um item do ProjectV2
- o item pertencer ao fluxo de segurança
- o campo `Status` estiver em `Security` ou em estado compatível com a revisão de segurança em andamento

Se GraphQL estiver indisponível por limitação de infraestrutura, continue a coleta com as ações suportadas do GitHub e registre a limitação no comentário final.

## Regra obrigatória de `securityFilter`

Esta regra é mandatória:

- toda entidade deve ter um `securityFilter` no service equivalente
- o `securityFilter` deve definir com clareza quem pode ver e quem pode gravar a entidade
- a ausência de `securityFilter`, um filtro incompleto ou um filtro incapaz de proteger leitura e escrita é falha relevante de segurança

Não basta verificar a existência nominal do método. A validação precisa considerar o comportamento efetivo.

## Regras de negócio

Ao revisar uma entidade ou fluxo, deixar explícito:

- quem pode ver
- quem pode criar
- quem pode editar
- quem pode alterar status
- quais restrições dependem de role, ownership, tipo, status ou contexto

Quando a regra não existir, estiver ambígua ou incompleta:

- explicitar a lacuna
- propor a regra mais segura e coerente com o negócio
- adotar o menor privilégio necessário
- registrar a decisão no `agents.md` do módulo correspondente

## Registro obrigatório em `agents.md`

Sempre que a análise exigir definição, refinamento, correção ou explicitação de regra de negócio ou autorização, registrar no `agents.md` do módulo:

- entidade analisada
- service correspondente
- regras de visualização
- regras de gravação
- restrições por role
- restrições por status, tipo, ownership ou contexto
- exceções administrativas
- decisão adotada quando a regra original não existia ou era ambígua

## Checklist obrigatório

Antes da decisão final, validar:

- a issue e os PRs certos foram analisados
- o `AGENTS.md` aplicável foi consultado
- o código alterado e o código relacionado foram lidos
- não existe brecha material de autorização
- o `securityFilter` existe onde deveria existir e protege os cenários relevantes
- as regras de negócio sensíveis foram confirmadas ou definidas
- o `agents.md` do módulo foi atualizado quando necessário
- a evidência disponível sustenta revisão humana posterior sem esconder risco relevante

## Regras de decisão

### Mover para `Developer`

Reprovar quando houver qualquer situação de gravidade equivalente a:

- ausência de `securityFilter` obrigatório
- `securityFilter` incompleto, superficial ou inconsistente
- regra de visualização ou gravação sem definição confiável
- brecha de autorização relevante
- risco material de alteração indevida por role incorreto
- fluxo sensível dependente de suposição não comprovada
- regra crítica ausente, ambígua ou implementada de forma incorreta
- evidência insuficiente para sustentar aprovação
- documentação obrigatória em `agents.md` não realizada quando necessária

Ao reprovar:

- deixar comentário final objetivo com escopo, evidências e motivo
- solicitar `REQUEST_CHANGES` no PR quando houver PR revisável
- mover o item do ProjectV2 para `Developer`

### Mover para `Quality Assurance`

Aprovar apenas quando houver evidência suficiente de que:

- os riscos relevantes foram analisados
- a proteção da entidade ou fluxo é coerente
- o `securityFilter` cumpre seu papel
- as regras de negócio sensíveis foram validadas ou definidas com clareza
- não restam lacunas materiais de autorização
- o registro em `agents.md` foi feito quando aplicável

Ao aprovar:

- comentar com rastreabilidade do escopo revisado
- aprovar o PR quando houver PR revisável
- mover o item do ProjectV2 para `Quality Assurance`

## Regra de comentário final

O comentário final da revisão deve informar:

- escopo analisado
- entidades, services, regras ou fluxos revisados
- principais riscos encontrados ou validados
- situação do `securityFilter`
- regras de negócio confirmadas ou definidas
- se houve atualização em `agents.md`
- decisão final e o motivo

## Regras de automação

Uma automação que implemente este fluxo deve:

- preferir GraphQL para ler e atualizar ProjectV2
- usar REST ou app equivalente apenas como fallback operacional
- poder acionar o Copilot cloud agent como apoio investigativo quando a rodada exigir contexto adicional
- falhar de forma conservadora quando não houver evidência suficiente
- nunca aprovar por aproximação textual
- nunca encerrar a rodada mantendo item em `Security`, exceto na etapa transitória de apoio do Copilot cloud agent explicitamente configurada

## Apoio com Copilot cloud agent

Quando configurado, o workflow pode acionar o Copilot cloud agent para apoiar a revisão.

Essa delegação serve para:

- explorar o código relacionado com mais profundidade
- sugerir trilhas de validação
- levantar pontos de atenção no diff

Essa delegação não substitui a decisão final do analista de segurança. A aprovação ou reprovação continua dependendo de evidência verificável e de decisão operacional explícita.

## Estrutura sugerida

- `automate/security-review.md`: política e regras
- `automate/security-project-status.md`: mapeamento de colunas e transições
- `automate/security-pull-request-review.md`: critérios de review
- `automate/scripts/security-project-review.mjs`: coleta de evidência e execução do fluxo
- `automate/workflows/security-project-review.yml`: workflow base no GitHub Actions

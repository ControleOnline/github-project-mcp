# Common automation guidelines

Diretrizes compartilhadas por todos os agentes do projeto.

## Fonte de verdade

A coluna oficial de uma task é sempre o campo `Status` do item no GitHub ProjectV2. Label, comentário, título de issue ou texto de PR não substituem movimentação real de coluna.

## Regra de execução

Todo agente deve:

1. ler o item do ProjectV2 por GraphQL
2. decidir com base na política do agente em `automate/agents/<agent>/`
3. registrar evidência na issue ou PR
4. mover o campo `Status` para a coluna de destino
5. falhar visivelmente quando não conseguir mover a coluna

Não existe fallback por label para representar coluna.

## Autenticação

Os workflows usam os secrets da GitHub App:

- `APP_ID`
- `APP_INSTALLATION_ID`
- `APP_PRIVATE_KEY`

A automação gera token de instalação em runtime usando `src/github-app-auth.js`.

## Copilot

Os agentes podem acionar o Copilot cloud agent quando precisarem de investigação adicional. O Copilot pode apoiar a análise, mas a conclusão operacional continua sendo a movimentação real do item no ProjectV2.

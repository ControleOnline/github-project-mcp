# GitHub Operations Runner

## Objetivo

Fornecer uma trilha oficial, executada dentro do proprio GitHub Actions, para mutacoes que os agents do ChatGPT precisem fazer quando o runtime local nao tiver egress confiavel para `api.github.com` ou quando a mutacao precisar rodar com o token e as permissoes do runner.

## Casos de uso

Use este runner para:

- mover task entre colunas do ProjectV2
- publicar comentarios em issues ou PRs
- trocar labels
- adicionar ou remover assignees
- publicar review em PR
- executar chamadas REST ou GraphQL especificas do GitHub de forma rastreavel

## Disparos suportados

- `workflow_dispatch` com JSON explicito de operacoes
- `issue_comment` no proprio repositorio `agents-mcp`, usando o comando `/github-ops`

## Formato do comando por comentario

Exemplo:

```text
/github-ops
```json
{
  "dry_run": false,
  "operations": [
    {
      "type": "project_status",
      "org": "ControleOnline",
      "project_number": 1,
      "repo_full_name": "ControleOnline/app-community",
      "issue_number": 74,
      "target_status": "In Review"
    }
  ]
}
```
```

## Operacoes suportadas

### `project_status`

Campos aceitos:

- `org`
- `project_number`
- `target_status`
- `item_id` opcional quando o item ja for conhecido
- `repo_full_name` e `issue_number` quando for preciso localizar o item pela issue

### `issue_comment`

Campos aceitos:

- `repo_full_name`
- `issue_number`
- `body`

### `replace_labels`

Campos aceitos:

- `repo_full_name`
- `issue_number`
- `labels`

### `add_assignees`

Campos aceitos:

- `repo_full_name`
- `issue_number`
- `assignees`

### `remove_assignees`

Campos aceitos:

- `repo_full_name`
- `issue_number`
- `assignees`

### `pr_review`

Campos aceitos:

- `repo_full_name`
- `pull_number`
- `event`
- `body`

### `rest`

Campos aceitos:

- `method`
- `path`
- `body` opcional
- `headers` opcionais

### `graphql`

Campos aceitos:

- `query`
- `variables` opcionais

## Regras de seguranca

- o runner so executa comentario-comando de logins permitidos
- o token preferencial e `GH_TOKEN`; `GITHUB_TOKEN` fica como fallback
- `dry_run` deve ser usado por padrao quando a operacao ainda estiver sendo validada
- o output precisa deixar rastreavel o que foi pedido, o que foi executado e o que falhou

## Relacao com os agents

Quando um agent do ChatGPT nao conseguir concluir uma mutacao do GitHub diretamente deste runtime, ele deve preferir esta trilha oficial em vez de fingir mudanca de estado, coluna ou ownership.

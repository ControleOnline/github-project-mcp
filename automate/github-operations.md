# GitHub Manager Runner

## Objetivo

Fornecer um unico runner oficial, executado dentro do proprio GitHub Actions, para manutencao gerencial e mutacoes autorizadas no GitHub.

## Papel

Esse runner tem papel de gerente operacional no GitHub.

Ele:

- corrige coluna errada no ProjectV2
- remove labels `agent:*` incorretas ou residuais
- limpa assignees tecnicos quando eles nao fazem parte do fluxo oficial
- executa manutencoes gerais de issue e PR
- recebe comandos remotos de outros agents com mais permissao de escrita

## Auditoria automatica

Quando executado por `schedule` ou por `workflow_dispatch` sem `operations_json`, o runner entra em modo de auditoria.

Nesse modo ele:

- procura tasks em `Work` ou `Working`
- verifica evidencias de aprovacao de `Security` e `Q.A.`
- move para `In Review` a task que ficou presa na coluna errada
- remove labels operacionais residuais
- pode remover assignees tecnicos residuais

## Disparos suportados

- `schedule`
- `workflow_dispatch`
- `issue_comment` no proprio repositorio `agents-mcp`, usando `/github-manager` ou `/github-ops`

## Formato do comando por comentario

Exemplo:

```text
/github-manager
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

Sem JSON, o comentario-comando apenas dispara a auditoria gerencial.

## Operacoes suportadas

### `manager_audit`

Executa a mesma auditoria gerencial do agendamento.

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
- `dry_run` deve ser usado quando a operacao ainda estiver sendo validada
- o output precisa deixar rastreavel o que foi pedido, o que foi executado e o que falhou

## Relacao com os agents

Quando um agent do ChatGPT nao conseguir concluir uma mutacao do GitHub diretamente deste runtime, ele deve preferir este runner oficial em vez de fingir mudanca de coluna, label, ownership ou review.

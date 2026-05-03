# github-project-mcp

Repositório padrão de automação de QA do ecossistema ControleOnline.

## Execução automática

Este projeto roda automaticamente via GitHub Actions.

Não há parâmetros manuais.

O fluxo padrão:

1. Lê o projeto:
   - https://github.com/orgs/ControleOnline/projects/1
2. Filtra:
   - Status = Quality Assurance
3. Seleciona:
   - até 5 tarefas
4. Executa QA automático

## Variáveis obrigatórias

```bash
TOKEN_PROJECTS
```

Sem fallback. Execução falha se não existir.

## Variáveis de configuração

```bash
QA_PROJECT_ORG=ControleOnline
QA_PROJECT_NUMBER=1
QA_TARGET_STATUS="Quality Assurance"
QA_TASK_LIMIT=5
```

## Execução local

```bash
TOKEN_PROJECTS=*** node src/index.js
```

Sem argumentos.

## Publicação

Este é o repositório oficial de automação:

https://github.com/ControleOnline/github-project-mcp

Todos os agentes devem publicar aqui.

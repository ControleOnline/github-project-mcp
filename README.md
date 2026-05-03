# github-project-mcp

Repositório padrão de publicação para scripts, workflows e políticas de automação de QA do ecossistema `ControleOnline`.

## Onde publicar

Use este repositório como destino versionado padrão:

- `https://github.com/ControleOnline/github-project-mcp`

Use o branch:

- `master`

## Variáveis esperadas

O scaffold e as automações deste repositório devem preferir:

- `TOKEN_PROJECTS`
- `QA_PROJECT_ORG`
- `QA_PROJECT_NUMBER`
- `QA_TARGET_STATUS`

## Arquivos principais

- `package.json`
- `src/index.js`
- `automate/`

## Exemplo de uso

```bash
node src/index.js ControleOnline ControleOnline app-community 100 1 "Quality Assurance"
```

Ou por variáveis de ambiente:

```bash
export TOKEN_PROJECTS=***
export QA_PROJECT_ORG=ControleOnline
export QA_PROJECT_NUMBER=1
export QA_ISSUE_OWNER=ControleOnline
export QA_ISSUE_REPO=app-community
export QA_ISSUE_NUMBER=100
export QA_TARGET_STATUS="Quality Assurance"
node src/index.js
```

# ControleOnline GitHub Project MCP Agents

Este repositório é a fonte oficial para automações, agents e normalização do fluxo operacional dos projetos ControleOnline.

## Regra de credenciais

- Nunca publicar, registrar, ecoar ou documentar o valor real de secrets ou tokens.
- Em GitHub Actions, prefira as credenciais do GitHub App via `APP_ID`, `APP_INSTALLATION_ID` e `APP_PRIVATE_KEY`.
- Quando o ambiente já fornecer token válido, use `GITHUB_TOKEN` ou `GH_TOKEN`.
- Não depender de arquivos locais de credenciais dentro dos runners.

## Integração com Copilot Agents

Copilot Agents devem usar este repositório como fonte de verdade para o fluxo entre agents.

## Associação oficial do agent responsável

Como o GitHub expõe o executor do Copilot genericamente como `Copilot`, o papel atual da task é rastreado pelo label exclusivo `agent:*`.

Labels válidos:

- `agent:developer`
- `agent:security`
- `agent:qa`
- `agent:devops`

Regra obrigatória:

- o label `agent:*` define o agent responsável atual
- o assignee `Copilot` define apenas que existe execução em andamento
- ao concluir uma etapa, o agent atual deve trocar o label para o próximo agent
- ao concluir uma etapa, o agent atual deve remover o assignee `Copilot`
- assignees humanos devem ser preservados
- a coluna continua em `Work` durante `Developer`, `Security`, `QA` e `DevOps`
- somente `DevOps` move a task para `In Review`

Quando um Copilot Agent atuar em qualquer projeto ControleOnline:

1. Deve verificar se existe tarefa vinculada.
2. Se não existir tarefa, deve criar ou acionar o fluxo que cria uma tarefa no GitHub e a associa ao fluxo operacional.
3. Deve continuar o trabalho a partir de branch `task-{issue_number}`.
4. Deve abrir PR vinculado à tarefa.
5. Não deve publicar diretamente em branches operacionais sem tarefa.
6. Ao concluir a implementação, `Developer` deve mudar o agente responsável para `Security`.
7. Ao concluir a análise, `Security` deve mudar o agente responsável para `Quality Assurance` ou devolver para `Developer`.
8. Ao concluir a revisão, `Quality Assurance` deve mudar o agente responsável para `DevOps`, ou devolver para `Developer` ou `Security`.
9. Ao concluir a promoção técnica, `DevOps` deve atualizar a task branch com o `master`, atualizar `staging` com o `master`, fazer o merge necessário em `staging` e só então mover a coluna para `In Review`.
10. Deve usar os scripts e workflows deste repositório para automações de agent routing, review e merge.

## Publicação

Toda mudança de política, script ou workflow de automação deve ser publicada neste repositório:

https://github.com/ControleOnline/github-project-mcp

## Fluxos principais

- `automation/`: regra-base dos agents `developer`, `security`, `qa` e `devops`
- `automate/`: políticas operacionais, runners e workflows
- `src/developer-runner.js`: despacha a próxima task elegível de `Work` para o agent `Developer`
- `src/qa-runner.js`: despacha tasks com `agent:qa`
- `src/security-runner.js`: despacha tasks com `agent:security`
- `src/devops-runner.js`: despacha tasks com `agent:devops`
- `src/direct-push-ingest.js`: transforma alteração sem tarefa em issue e branch `task-{issue_number}`
- `.github/workflows/developer-runner.yml`: runner recorrente do Developer
- `.github/workflows/qa-runner.yml`: runner recorrente do QA
- `.github/workflows/security-runner.yml`: runner recorrente do Security
- `.github/workflows/devops-runner.yml`: runner recorrente do DevOps
- `.github/workflows/direct-push-ingest.yml`: ingestor de push sem tarefa quando instalado no repositório alvo

## Regra operacional

Se uma automação não conseguir comprovar tarefa, PR, checks, agente responsável real ou pré-requisitos de merge, ela deve ser conservadora: criar ou corrigir a trilha, devolver para o agent correto e evitar promoção automática.

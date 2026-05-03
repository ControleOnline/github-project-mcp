# ControleOnline GitHub Project MCP Agents

Este repositório é a fonte oficial para automações, agents e normalização do fluxo operacional dos projetos ControleOnline.

## Regra de credenciais

- `TOKEN_PROJECTS` é um GitHub Actions Secret.
- Nunca publicar, registrar, ecoar ou documentar o valor real do secret.
- Nunca substituir `TOKEN_PROJECTS` por `GITHUB_TOKEN`.
- Não usar fallbacks para outras variáveis ou arquivos locais.
- Toda automação que escreve no GitHub, revisa PR, cria issue, cria branch, altera agente responsável ou faz merge deve receber `TOKEN_PROJECTS` exclusivamente via `secrets.TOKEN_PROJECTS` em GitHub Actions.

## Integração com Copilot Agents

Copilot Agents devem usar este repositório como fonte de verdade para o fluxo entre agents.

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
- `src/direct-push-ingest.js`: transforma alteração sem tarefa em issue e branch `task-{issue_number}`
- `.github/workflows/qa-runner.yml`: runner recorrente do QA
- `.github/workflows/security-runner.yml`: runner recorrente do Security
- `.github/workflows/direct-push-ingest.yml`: ingestor de push sem tarefa quando instalado no repositório alvo

## Regra operacional

Se uma automação não conseguir comprovar tarefa, PR, checks, agente responsável real ou pré-requisitos de merge, ela deve ser conservadora: criar ou corrigir a trilha, devolver para o agent correto e evitar promoção automática.

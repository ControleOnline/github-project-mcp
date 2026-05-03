# ControleOnline GitHub Project MCP Agents

Este repositório é a fonte oficial para automações de QA, ProjectV2 e normalização de fluxo dos projetos ControleOnline.

## Regra de credenciais

- `TOKEN_PROJECTS` é um GitHub Actions Secret.
- Nunca publicar, registrar, ecoar ou documentar o valor real do secret.
- Nunca substituir `TOKEN_PROJECTS` por `GITHUB_TOKEN`.
- Não usar fallbacks para outras variáveis ou arquivos locais.
- Toda automação que escreve no ProjectV2, revisa PR, cria issue, cria branch ou faz merge deve receber `TOKEN_PROJECTS` exclusivamente via `secrets.TOKEN_PROJECTS` em GitHub Actions.

## Integração com Copilot Agents

Copilot Agents devem usar este repositório como fonte de verdade para o fluxo de QA.

Quando um Copilot Agent atuar em qualquer projeto ControleOnline:

1. Deve verificar se existe tarefa vinculada.
2. Se não existir tarefa, deve criar ou acionar o fluxo que cria uma tarefa no ProjectV2 `ControleOnline/projects/1`.
3. Deve continuar o trabalho a partir de branch `task-{issue_number}`.
4. Deve abrir PR vinculado à tarefa.
5. Não deve publicar diretamente em branches operacionais sem tarefa.
6. Deve deixar a tarefa em `Quality Assurance` quando a alteração estiver pronta para revisão.
7. Deve usar os scripts e workflows deste repositório para automações de ProjectV2, QA, review e merge.

## Publicação

Toda mudança de política, script ou workflow de automação deve ser publicada neste repositório:

https://github.com/ControleOnline/github-project-mcp

## Fluxos principais

- `src/index.js`: executa QA autônomo de itens em `Quality Assurance`.
- `src/direct-push-ingest.js`: transforma alteração sem tarefa em issue, ProjectV2 item e branch `task-{issue_number}`.
- `.github/workflows/qa-runner.yml`: runner recorrente do QA autônomo.
- `.github/workflows/direct-push-ingest.yml`: ingestor de push sem tarefa quando instalado no repositório alvo.

## Regra operacional

Se uma automação não conseguir comprovar tarefa, PR, checks e status real do ProjectV2, ela deve ser conservadora: criar tarefa, mover para fluxo correto e evitar aprovação/merge automático.
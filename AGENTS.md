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
- task aberta em `Work` sem `agent:*` entra por padrão em `Developer`
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
9. Se houver conflito de merge em PR aberto, a responsabilidade operacional deve ir para `DevOps`.
10. Ao concluir a promoção técnica, `DevOps` deve atualizar a task branch com o `master`, atualizar `staging` com o `master`, fazer o merge necessário em `staging` e só então mover a coluna para `In Review`.
11. Deve usar os scripts e workflows deste repositório para automações de agent routing, review e merge.

## Fronteira do CTO

O CTO supervisiona o ecossistema e pode corrigir diretamente o `cto-mcp` quando houver falha estrutural de instrução, runner, workflow, ownership ou automação.

O CTO não deve substituir a execução operacional do agent responsável quando a trilha já pertence claramente a `Developer`, `Security`, `Q.A.` ou `DevOps`.

Isso inclui, salvo quando a própria mudança for estrutural neste repositório:

- não implementar demanda de produto no lugar do agent
- não avançar PR operacional apenas para compensar travamento do agent
- não fazer `ready for review`, merge, promoção ou conclusão de trilha operacional que pertence ao agent responsável
- não tratar bloqueio de agent como autorização para absorver a execução fim a fim

Quando houver travamento de agent, o papel correto do CTO é diagnosticar, corrigir a causa estrutural no ecossistema, registrar evidência e devolver a trilha ao agent certo.

### Espelho operacional do CTO

O repositório também mantém um supervisor recorrente do CTO para auditoria estrutural do fluxo.

Regras desse supervisor:

- ele não implementa demanda de produto
- ele não substitui `Developer`, `Security`, `Q.A.` ou `DevOps`
- ele só corrige estado de projeto quando o erro for inequívoco e verificável
- a primeira responsabilidade dele é detectar tasks em `Done` incompatíveis com o fluxo oficial
- ao corrigir um estado inválido, ele deve deixar comentário explicando a reversão e o motivo operacional

## Evidência operacional

Quando houver workflow, runner, automação ou execução recente relacionada ao diagnóstico:

- GitHub Actions e seus logs de jobs e steps devem ser tratados como fonte prioritária de evidência operacional
- não basta olhar issue, PR ou label isoladamente quando existir execução recente verificável
- antes de concluir que um fluxo está saudável, o agente deve cruzar estado de projeto, PRs, checks e execuções recentes relevantes

## Publicação

Toda mudança de política, script ou workflow de automação deve ser publicada neste repositório:

https://github.com/ControleOnline/cto-mcp

## Fluxos principais

- `automation/`: regra-base dos agents `developer`, `security`, `qa` e `devops`
- `automate/`: políticas operacionais, runners e workflows
- `src/developer-runner.js`: despacha a próxima task elegível de `Work` para o agent `Developer`
- `src/agent-flow-sync-runner.js`: semeia `agent:developer`, redireciona conflitos para `DevOps` e limpa `agent:*` em `In Review`
- `src/qa-runner.js`: despacha tasks com `agent:qa`
- `src/security-runner.js`: despacha tasks com `agent:security`
- `src/devops-runner.js`: despacha tasks com `agent:devops`
- `src/cto-runner.js`: executa a auditoria estrutural do CTO sobre estados inválidos do fluxo
- `src/direct-push-ingest.js`: transforma alteração sem tarefa em issue e branch `task-{issue_number}`
- `.github/workflows/developer-runner.yml`: runner recorrente do Developer
- `.github/workflows/agent-flow-sync.yml`: sincroniza labels iniciais, conflitos e limpeza de `In Review`
- `.github/workflows/qa-runner.yml`: runner recorrente do QA
- `.github/workflows/security-runner.yml`: runner recorrente do Security
- `.github/workflows/devops-runner.yml`: runner recorrente do DevOps
- `.github/workflows/cto-runner.yml`: supervisor recorrente do CTO para auditar e corrigir estados estruturais inválidos
- `.github/workflows/direct-push-ingest.yml`: ingestor de push sem tarefa quando instalado no repositório alvo

## Regra operacional

Se uma automação não conseguir comprovar tarefa, PR, checks, agente responsável real ou pré-requisitos de merge, ela deve ser conservadora: criar ou corrigir a trilha, devolver para o agent correto e evitar promoção automática.

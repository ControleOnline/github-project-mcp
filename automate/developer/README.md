# Developer

Automacoes do agent `Developer`.

## Responsabilidade do runner

O runner de `Developer` nao implementa a issue por conta propria.

Ele:

- procura tasks abertas na coluna `Work`
- trata task sem `agent:*` em `Work` como entrada padrao do fluxo
- ignora tasks que estejam exclusivamente com pessoas
- ignora tasks que ja estejam com algum agent em execucao na propria coluna `Work`
- atribui o `copilot-swe-agent` com instrucoes de `Developer` para a proxima task elegivel
- registra comentario objetivo quando a atribuicao for executada
- nos runners do GitHub Actions, deve preferir `GH_TOKEN`; o GitHub App fica apenas como fallback quando esse token nao estiver disponivel

## Arquivos principais

- `automate/scripts/developer-project-dispatch.mjs`
- `.github/workflows/developer-runner.yml`
- `automate/workflows/developer-project-dispatch.yml`

## Regras operacionais

- nao retirar task que esteja exclusivamente com pessoas
- task nova em `Work` sem `agent:*` pertence inicialmente a `Developer`
- nao iniciar nova task se ja houver outra em execucao pelo `Developer` na coluna `Work`
- usar `master` como branch base operacional
- delegar a execucao para o agent `Developer` do repositório alvo

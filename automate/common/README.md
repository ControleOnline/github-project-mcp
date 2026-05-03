# Common

Diretrizes gerais e utilitarios compartilhados entre automacoes.

## Regras gerais

- autenticacao com GitHub deve ser app-first, usando `APP_ID`, `APP_INSTALLATION_ID` e `APP_PRIVATE_KEY`;
- nenhum script novo deve depender de token legado de Projects;
- mensagens automatizadas devem deixar claro o motivo da decisao e o destino no fluxo;
- quando um agente precisar acionar o Copilot, a instrucao deve dizer explicitamente qual formato de saida o restante da automacao espera consumir.

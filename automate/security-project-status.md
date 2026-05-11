# Security Routing Rules

## Fonte de verdade

A associacao oficial do fluxo e sempre o agente responsavel real da task.

## Entrada de Security

A automação de Security só pode capturar uma task quando:

- a issue existir no fluxo operacional
- o agente responsável atual estiver em `Security`

## Saídas válidas

As únicas saídas válidas ao final da revisão são:

- `Developer`
- `Quality Assurance`

Exceção transitória desta base:

- quando `SECURITY_USE_COPILOT=true` e ainda não existir decisão estruturada suficiente, a automação pode manter a task em `Security` apenas para aguardar o apoio investigativo do Copilot cloud agent

## Regras de transição

### `Security` -> `Developer`

Use quando houver:

- brecha de autorização
- `securityFilter` ausente, incompleto ou inefetivo
- regra de negócio sensível ausente ou incorreta
- exposição material de dados
- risco previsível sem mitigação comprovada
- evidência insuficiente para sustentar aprovação

### `Security` -> `Quality Assurance`

Use quando:

- a análise de segurança estiver concluída
- os riscos relevantes estiverem cobertos
- o `securityFilter` estiver validado
- as regras de negócio sensíveis estiverem claras
- não restarem lacunas materiais de autorização

## Fallback operacional

Se GraphQL não estiver disponível:

- não inferir agente responsável por aproximação textual
- registrar bloqueio operacional de infraestrutura
- seguir com a coleta por meios suportados do GitHub quando possível
- não fingir mudança de agente responsável que não foi executada

## Apoio investigativo

Quando `SECURITY_USE_COPILOT=true`, a rodada pode acionar o Copilot cloud agent para aprofundar a investigação de uma issue ainda sem decisão estruturada.

Esse apoio não muda sozinho o agente responsável da task. A mudança continua condicionada à decisão final registrada pelo fluxo de Security.

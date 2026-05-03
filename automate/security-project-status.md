# Security Project Status Rules

## Fonte de verdade

O status oficial da task é sempre o campo real `Status` do item no GitHub ProjectV2.

## Status de entrada

A automação de Security só pode capturar uma task quando:

- o item existir no ProjectV2
- o campo `Status` estiver em `Security` ou em estado compatível com revisão de segurança em andamento

## Status de saída

A automação nunca deve encerrar deixando a task em `Security`.

As únicas saídas válidas ao final da revisão são:

- `Developer`
- `Quality Assurance`

Exceção transitória desta base:

- quando `SECURITY_USE_COPILOT=true` e ainda não existir decisão estruturada suficiente, a automação pode manter o item em `Security` apenas para aguardar o apoio investigativo do Copilot cloud agent

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

- não selecionar card por aproximação textual
- registrar bloqueio operacional de infraestrutura
- seguir com a coleta por meios suportados do GitHub quando possível
- não fingir mudança de status que não foi executada

## Apoio investigativo

Quando `SECURITY_USE_COPILOT=true`, a rodada pode acionar o Copilot cloud agent para aprofundar a investigação de uma issue ainda sem decisão estruturada.

Esse apoio não muda sozinho o status do ProjectV2. A mudança continua condicionada à decisão final registrada pelo fluxo de Security.

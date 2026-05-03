# Agents

Esta pasta concentra os pontos de entrada canônicos dos custom agents.

## Estrutura

- `agents/agent/developer/agent.md`
- `agents/agent/qa/agent.md`
- `agents/agent/security/agent.md`
- `agents/agent/devops/agent.md`

Os wrappers locais em `.github/agents/*.agent.md` de cada projeto e submódulo devem apontar para exatamente um desses arquivos centrais por tipo.

As regras-base detalhadas continuam em `automation/`.

Os wrappers locais podem ser regenerados pelo script:

- `scripts/sync-copilot-agents.mjs`

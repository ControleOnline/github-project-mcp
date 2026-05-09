# Agents

Esta pasta concentra os pontos de entrada canonicos dos custom agents.

## Estrutura

- `agents/agent/cto/agent.md`
- `agents/agent/developer/agent.md`
- `agents/agent/qa/agent.md`
- `agents/agent/security/agent.md`
- `agents/agent/devops/agent.md`
- `agents/agent/sysadmin/agent.md`

Os wrappers locais em `.github/agents/*.agent.md` de cada projeto e submodulo devem apontar para exatamente um desses arquivos centrais por tipo.

As regras compartilhadas vivem em `skills/shared/`. As regras detalhadas de execucao continuam em `automation/` e `automate/`.

Os wrappers locais podem ser regenerados pelo script:

- `scripts/sync-copilot-agents.mjs`

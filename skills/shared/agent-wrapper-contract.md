# Agent Wrapper Contract

## Overview

Use esta skill quando for criar, revisar ou sincronizar wrappers locais em `.github/agents/*.agent.md`.

## Workflow

1. mantenha o wrapper fino e centrado na fonte canonica
2. aponte sempre para o `agents/agent/<agent>/agent.md` central, `skills/README.md`, `skills/shared/README.md` e a referencia especifica do agent quando existir
3. deixe no wrapper apenas o contexto local minimo que muda por checkout, como repositorio, tipo, familia, branch base, alvo preferencial de PR e presenca de `AGENTS.md`
4. nao duplique biblioteca operacional, guardrails ou politicas compartilhadas dentro do wrapper
5. se um texto de wrapper precisar aparecer em varios lugares, extraia a regra para `skills/shared/` e faca os wrappers referenciarem essa skill
6. mantenha scripts de sincronizacao alinhados com essa mesma estrutura

## Output Contract

Ao concluir, o wrapper deve deixar claro:

- qual e a fonte canonica
- qual e o contexto local minimo
- onde vivem as regras reais

## Quality Bar

- nao transforme wrapper em prompt completo
- nao mantenha referencias antigas a repositorios ou nomes descontinuados
- nao deixe o script regenerar duplicacao estrutural
- nao replique no wrapper o que ja esta coberto pelas skills centrais

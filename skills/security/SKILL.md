---
name: security
description: revisao tecnica de seguranca, avaliacao de risco, leitura de PR, decisao estruturada e handoff para qa ou developer. usar quando a task estiver com agent:security ou quando a trilha exigir validacao tecnica de seguranca.
---

# Security

## Objetivo

Validar risco tecnico antes da etapa de qualidade.

## Regras obrigatorias

- Ler issue, PR, diff, comentarios, checks e contexto relevante.
- Nao implementar demanda no lugar de Developer.
- Registrar decisao estruturada antes do handoff.
- Usar `SECURITY_DECISION: APPROVED|REJECTED`.
- Usar `NEXT_AGENT: Quality Assurance|Developer`.
- Quando aprovado, trocar `agent:security` por `agent:qa`.
- Quando devolvido, trocar `agent:security` por `agent:developer`.
- Remover assignee tecnico do agent ao concluir.

## Evidencia minima

- escopo revisado;
- pontos de risco avaliados;
- decisao estruturada;
- motivo objetivo de aprovacao ou devolucao.

## Referencias

- `automation/security/base.md`
- `automate/security-review.md`
- `automate/security-project-status.md`
- `automate/security-pull-request-review.md`

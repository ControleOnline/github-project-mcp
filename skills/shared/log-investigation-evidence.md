# Log Investigation Evidence

## Overview

Use esta skill para padronizar investigacao operacional baseada em evidencias.

## Workflow

1. como primeira prioridade, use acesso direto ao servidor por SSH para verificar o estado real, confirmar contexto local, ler logs brutos e investigar anomalias diretamente na origem
2. como segunda prioridade, consulte a tabela `logs` e demais dados estruturados do banco para localizar padroes, recorrencia, severidade, correlacao temporal, servicos afetados e historico operacional
3. ao consultar o banco, respeite rigorosamente o contexto de multi-tenancy, filtrando e validando tenant, ambiente, servico e escopo corretos
4. como terceira prioridade, use APIs de log ou fontes auxiliares somente quando isso complementar ou confirmar eventos de forma util
5. se houver divergencia entre logs do servidor, banco e fontes auxiliares, registre a diferenca e priorize a confirmacao do estado real
6. nunca exponha trechos sensiveis de logs em respostas, issues ou registros visiveis

## Output Contract

Ao concluir, informe objetivamente:

- qual fonte trouxe a evidencia principal
- qual erro, padrao ou recorrencia foi encontrado
- qual contexto temporal ou operacional foi confirmado
- quais divergencias entre fontes foram observadas

## Quality Bar

- nao trate evidencia indireta como substituto automatico do estado real
- nao ignore multi-tenancy ao investigar no banco
- nao exponha logs sensiveis
- sempre deixe claro de onde veio a evidencia principal

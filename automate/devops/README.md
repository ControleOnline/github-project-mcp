# DevOps

Automacoes do agente de DevOps.

## Responsabilidades

- detectar mudancas diretas fora do fluxo esperado;
- criar task operacional para o time de desenvolvimento corrigir a trilha;
- garantir que pushes sem tarefa caiam em `Work`, para posterior captura pelo runner de `Developer`, e nao em `Quality Assurance`;
- receber tarefas aprovadas por `Quality Assurance`;
- receber tarefas com conflito de merge em PR aberto;
- atualizar task branch e `staging` com o `master` atual;
- fazer o merge em `staging` e mover a coluna para `In Review`.

# DevOps

Automacoes do agente de DevOps.

## Responsabilidades

- detectar mudancas diretas fora do fluxo esperado;
- criar task operacional para o time de desenvolvimento corrigir a trilha;
- garantir que pushes sem tarefa caiam em `Work`, para posterior captura pelo runner de `Developer`, e nao em `Quality Assurance`;
- receber tarefas aprovadas por humano e movidas para `Deploy`;
- receber tarefas com conflito de merge em PR aberto;
- sincronizar ambientes e refs necessarios para promocao tecnica;
- colocar em producao o que estiver aprovado em `Deploy`.

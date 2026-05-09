# Skills

Esta pasta e a fonte oficial das instrucoes reutilizaveis dos agents do ecossistema ControleOnline.

A partir desta organizacao, instrucoes persistentes que nao sejam memoria operacional devem ficar neste repositorio e ser lidas daqui. Memoria operacional continua sendo estado externo, temporario ou historico, e nao deve ser duplicada como skill.

## Estrutura

- `shared/README.md`: politicas compartilhadas, criterios de priorizacao e leitura de evidencia
- `agents/<agent>/README.md`: papel, limites, ownership e handoff por tipo de agent
- `runners/README.md`: mapa dos workflows, entry points e scripts reais
- `developer/SKILL.md`: skill de implementacao para o agent Developer
- `security/SKILL.md`: skill de revisao de seguranca para o agent Security

## Regra de fonte de verdade

- Ler primeiro `skills/README.md` para descobrir o catalogo disponivel.
- Em seguida, carregar apenas a skill do agent responsavel atual.
- Quando uma tarefa exigir outro dominio, carregar somente a skill complementar necessaria.
- Evitar instrucoes permanentes fora de `cto-mcp`, exceto memoria operacional explicitamente marcada como memoria.
- Nao usar a nomenclatura `cto-*` para skills, scripts ou arquivos, salvo quando o escopo for exclusivo do CTO ou do supervisor estrutural deste repositorio.

## Regra de uso

1. identifique o tipo de decisao ou investigacao
2. leia primeiro a area mais especifica
3. combine evidencia com mapa de runtime quando a duvida envolver comportamento real
4. use memoria apenas como apoio externo ao repositorio

## Catalogo por tipo de agent

- `developer/`: implementacao, composicao de PR, correcao de codigo e devolucao para Security.
- `security/`: revisao de seguranca, triagem de risco, aprovacao ou devolucao para Developer.
- `qa/`: revisao funcional, qualidade, regressao e devolucao para Developer, Security ou DevOps.
- `devops/`: conflitos, sincronizacao com `master`, promocao para `staging` e conclusao em `In Review`.
- `supervisor/`: auditoria estrutural exclusiva do CTO sobre o fluxo e o proprio `cto-mcp`.

## Ordem de leitura recomendada

1. `AGENTS.md` para regras globais e fronteira operacional.
2. `skills/README.md` para catalogo e politica de carregamento.
3. `skills/<agent>/SKILL.md` para a funcao responsavel pela task.
4. `automation/<agent>/base.md` e politicas em `automate/` quando a execucao exigir detalhe operacional.
5. Skills complementares somente quando o trabalho realmente precisar delas.

## Politica de migracao

Ao adicionar ou alterar instrucoes permanentes:

- colocar a instrucao na skill mais especifica possivel;
- mover detalhes longos para referencias dentro da propria pasta da skill;
- manter `AGENTS.md` e `README.md` como indice e contrato global, nao como deposito de todas as regras;
- registrar excecoes de nomenclatura `cto-*` apenas para componentes exclusivos do CTO.

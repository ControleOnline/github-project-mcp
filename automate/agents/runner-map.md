# Runner Map

Este arquivo existe para eliminar ambiguidade entre a documentacao historica e o que realmente roda hoje no GitHub Actions.

## Cadeia ativa dos runners

Quando a pergunta for "o que realmente roda hoje no GitHub Actions?", a resposta correta passa a ser:

### GitHub Manager

- workflow ativo: `.github/workflows/github-operations.yml`
- logica final: `automate/scripts/github-operations.mjs`
- papel: manutencao gerencial, correcoes de coluna, limpeza de labels e mutacoes autorizadas no GitHub

## Entradas legadas ou de compatibilidade

Os workflows por papel, sincronizadores e supervisores antigos deixam de representar a cadeia principal de execucao recorrente.

Se ainda existirem scripts legados no repositorio, eles devem ser lidos apenas como referencia historica ate consolidacao total no runner gerencial.

## Regra de auditoria

Ao revisar funcionamento, incidentes, ownership ou backlog do ecossistema:

1. confirme primeiro o workflow `.github/workflows/github-operations.yml`
2. confirme a logica em `automate/scripts/github-operations.mjs`
3. confirme o estado atual no ProjectV2 e nas issues/PRs do GitHub
4. trate qualquer outro runner antigo como legado, salvo se houver reativacao explicita e documentada

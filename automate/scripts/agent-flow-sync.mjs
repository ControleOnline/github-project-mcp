import fs from 'node:fs';
import {
  githubRetryConfig,
  isRetriableGraphQLErrors,
  isRetriableStatus,
  retryAsync,
  retryableError,
} from '../../src/retry.js';

const GITHUB_API_URL = 'https://api.github.com/graphql';
const REST_API_URL = 'https://api.github.com';

const AGENT_LABELS = {
  developer: 'agent:developer',
  devops: 'agent:devops',
};

const ALL_AGENT_LABELS = ['agent:developer', 'agent:security', 'agent:qa', 'agent:devops'];
const DEFAULT_KNOWN_AGENT_LOGINS = 'copilot-swe-agent,copilot';
const DEFAULT_UNSUPPORTED_LABEL = 'ops:copilot-unavailable';
const RETRY = githubRetryConfig('FLOW');
const LABEL_META = {
  'agent:developer': { color: '1f6feb', description: 'Task atualmente com o agent Developer' },
  'agent:security': { color: 'd1242f', description: 'Task atualmente com o agent Security' },
  'agent:qa': { color: '8b5cf6', description: 'Task atualmente com o agent QA' },
  'agent:devops': { color: 'fb8c00', description: 'Task atualmente com o agent DevOps' },
  'ops:copilot-unavailable': {
    color: 'd4a72c',
    description: 'Copilot cloud agent nao habilitado no repositorio alvo',
  },
};

function env(name, fallback = '') {
  return (process.env[name] || fallback).trim();
}

function getToken() {
  return env('GITHUB_TOKEN') || env('GH_TOKEN');
}

function parseCsv(value) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

async function githubGraphQL(query, variables = {}) {
  const token = getToken();
  if (!token) throw new Error('Missing GitHub token. Set GITHUB_TOKEN or GH_TOKEN.');

  return retryAsync(
    async () => {
      let response;
      try {
        response = await fetch(GITHUB_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            'User-Agent': 'controleonline-agent-flow-sync',
          },
          body: JSON.stringify({ query, variables }),
        });
      } catch (error) {
        throw retryableError(`GitHub GraphQL request failed: ${error.message || error}`);
      }

      const text = await response.text();
      let json;
      try {
        json = text ? JSON.parse(text) : null;
      } catch {
        const message = JSON.stringify({ status: response.status, body: text }, null, 2);
        if (isRetriableStatus(response.status)) {
          throw retryableError(message);
        }
        throw new Error(message);
      }
      if (!response.ok || json.errors) {
        const message = JSON.stringify({ status: response.status, errors: json.errors || json }, null, 2);
        if ((!response.ok && isRetriableStatus(response.status)) || isRetriableGraphQLErrors(json.errors)) {
          throw retryableError(message);
        }
        throw new Error(message);
      }

      return json.data;
    },
    { label: 'GitHub GraphQL flow sync', ...RETRY }
  );
}

async function githubRest(path, options = {}) {
  const token = getToken();
  if (!token) throw new Error('Missing GitHub token. Set GITHUB_TOKEN or GH_TOKEN.');

  return retryAsync(
    async () => {
      let response;
      try {
        response = await fetch(`${REST_API_URL}${path}`, {
          ...options,
          headers: {
            Accept: 'application/vnd.github+json',
            Authorization: `Bearer ${token}`,
            'X-GitHub-Api-Version': '2022-11-28',
            'Content-Type': 'application/json',
            'User-Agent': 'controleonline-agent-flow-sync',
            ...(options.headers || {}),
          },
        });
      } catch (error) {
        throw retryableError(`GitHub REST request failed: ${error.message || error}`);
      }

      const text = await response.text();
      let body;
      try {
        body = text ? JSON.parse(text) : null;
      } catch {
        const message = JSON.stringify({ status: response.status, path, body: text }, null, 2);
        if (isRetriableStatus(response.status)) {
          throw retryableError(message);
        }
        throw new Error(message);
      }
      if (!response.ok) {
        const message = JSON.stringify({ status: response.status, path, body }, null, 2);
        if (isRetriableStatus(response.status)) {
          throw retryableError(message);
        }
        throw new Error(message);
      }
      return body;
    },
    { label: `GitHub REST flow sync ${path}`, ...RETRY }
  );
}

async function getProjectSnapshot(org, projectNumber) {
  const query = `query($org:String!, $projectNumber:Int!, $cursor:String) {
    organization(login:$org) {
      projectV2(number:$projectNumber) {
        id
        title
        items(first:100, after:$cursor) {
          pageInfo {
            hasNextPage
            endCursor
          }
          nodes {
            id
            fieldValues(first:20) {
              nodes {
                ... on ProjectV2ItemFieldSingleSelectValue {
                  name
                  field {
                    ... on ProjectV2SingleSelectField {
                      id
                      name
                    }
                  }
                }
              }
            }
            content {
              ... on Issue {
                id
                number
                title
                url
                state
                createdAt
                updatedAt
                labels(first:20) {
                  nodes {
                    name
                  }
                }
                assignees(first:20) {
                  nodes {
                    id
                    login
                  }
                }
                repository {
                  id
                  nameWithOwner
                }
                timelineItems(first:50, itemTypes:[CROSS_REFERENCED_EVENT]) {
                  nodes {
                    ... on CrossReferencedEvent {
                      source {
                        __typename
                        ... on PullRequest {
                          id
                          number
                          title
                          url
                          state
                          isDraft
                          mergeable
                          repository {
                            nameWithOwner
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }`;

  const firstPage = await githubGraphQL(query, { org, projectNumber, cursor: null });
  const project = firstPage?.organization?.projectV2;
  if (!project) return firstPage;

  const items = [...(project.items?.nodes || [])];
  let pageInfo = project.items?.pageInfo;

  while (pageInfo?.hasNextPage && pageInfo.endCursor) {
    const page = await githubGraphQL(query, { org, projectNumber, cursor: pageInfo.endCursor });
    const nextItems = page?.organization?.projectV2?.items?.nodes || [];
    items.push(...nextItems);
    pageInfo = page?.organization?.projectV2?.items?.pageInfo;
  }

  project.items.nodes = items;
  return firstPage;
}

function getStatusValue(item) {
  const value = item.fieldValues?.nodes?.find(
    (node) => node?.field?.name?.toLowerCase() === 'status'
  );
  return value?.name || null;
}

function issueLabels(issue) {
  return (issue.labels?.nodes || []).map((label) => label?.name).filter(Boolean);
}

function currentAgentLabel(issue) {
  return issueLabels(issue).find((label) => ALL_AGENT_LABELS.includes(label)) || null;
}

function assigneeLogins(issue) {
  return (issue.assignees?.nodes || [])
    .map((assignee) => (assignee?.login || '').trim().toLowerCase())
    .filter(Boolean);
}

function retainedHumanActorIds(issue, knownAgentLogins) {
  return (issue.assignees?.nodes || [])
    .filter((assignee) => {
      const login = (assignee?.login || '').trim().toLowerCase();
      return login && !knownAgentLogins.has(login) && assignee?.id;
    })
    .map((assignee) => assignee.id);
}

function hasAgentAssignee(issue, knownAgentLogins) {
  return assigneeLogins(issue).some((login) => knownAgentLogins.has(login));
}

function hasHumanAssignee(issue, knownAgentLogins) {
  return assigneeLogins(issue).some((login) => !knownAgentLogins.has(login));
}

function hasHumanOnlyAssignee(issue, knownAgentLogins) {
  return hasHumanAssignee(issue, knownAgentLogins) && !hasAgentAssignee(issue, knownAgentLogins);
}

function normalizePullRequests(issue) {
  const seen = new Set();
  const pullRequests = [];
  for (const node of issue.timelineItems?.nodes || []) {
    const pr = node?.source;
    if (!pr || pr.__typename !== 'PullRequest') continue;
    const key = `${pr.repository?.nameWithOwner || ''}#${pr.number}`;
    if (seen.has(key)) continue;
    seen.add(key);
    pullRequests.push(pr);
  }
  return pullRequests;
}

function openPullRequests(issue) {
  return normalizePullRequests(issue).filter((pr) => pr?.state === 'OPEN');
}

function hasOpenPullRequest(issue) {
  return openPullRequests(issue).length > 0;
}

function openPullRequestsInSameRepository(issue) {
  const repoFullName = issue.repository?.nameWithOwner;
  return openPullRequests(issue).filter((pr) => pr?.repository?.nameWithOwner === repoFullName);
}

function isConflictingOrBlockedMergeable(mergeable) {
  return mergeable === false || mergeable === 'CONFLICTING';
}

function hasConflictingPullRequestInSameRepository(issue) {
  return openPullRequestsInSameRepository(issue).some((pr) => isConflictingOrBlockedMergeable(pr?.mergeable));
}

async function ensureLabelExists(repoFullName, labelName) {
  const [owner, repo] = repoFullName.split('/');
  const meta = LABEL_META[labelName] || { color: '1f6feb', description: labelName };
  try {
    await githubRest(`/repos/${owner}/${repo}/labels`, {
      method: 'POST',
      body: JSON.stringify({
        name: labelName,
        color: meta.color,
        description: meta.description,
      }),
    });
  } catch (error) {
    const payload = JSON.parse(error.message || '{}');
    if (payload.status !== 422) throw error;
  }
}

async function replaceIssueLabels(repoFullName, issueNumber, nextLabels) {
  const [owner, repo] = repoFullName.split('/');
  await githubRest(`/repos/${owner}/${repo}/issues/${issueNumber}/labels`, {
    method: 'PUT',
    body: JSON.stringify(nextLabels),
  });
}

async function replaceAssignableActors(issueId, actorIds) {
  return githubGraphQL(
    `mutation($issueId:ID!, $actorIds:[ID!]!) {
      replaceActorsForAssignable(input: {
        assignableId: $issueId,
        actorIds: $actorIds
      }) {
        assignable {
          ... on Issue {
            id
          }
        }
      }
    }`,
    { issueId, actorIds }
  );
}

async function addIssueComment(issueId, body) {
  return githubGraphQL(
    `mutation($subjectId:ID!, $body:String!) {
      addComment(input:{subjectId:$subjectId, body:$body}) {
        commentEdge {
          node {
            id
          }
        }
      }
    }`,
    { subjectId: issueId, body }
  );
}

function buildDeveloperSeedComment(issueRef) {
  return [
    '### Fluxo iniciado automaticamente',
    '',
    `Issue: ${issueRef}`,
    'Ação: a task entrou sem `agent:*` em `Work`, então o fluxo oficial apontou a responsabilidade inicial para `agent:developer`.',
    'Próximo passo: o runner de `Developer` fará a captura quando não houver outra execução ativa do mesmo agent.',
  ].join('\n');
}

function buildOrphanAgentCleanupComment(issueRef) {
  return [
    '### Higienização de ownership técnico',
    '',
    `Issue: ${issueRef}`,
    'Motivo: a task estava em `Work` com assignee técnico do Copilot, mas sem `agent:*` ativo que justificasse execução em andamento.',
    'Ação: o assignee técnico foi removido para restaurar o estado neutro da fila e evitar que a task fosse tratada como execução ativa sem owner operacional claro.',
    'Próximo passo: o sincronizador pode semear novamente `agent:developer` na próxima rodada, permitindo captura limpa pelo runner correto.',
  ].join('\n');
}

function buildConflictComment(issueRef) {
  return [
    '### Fluxo redirecionado para DevOps',
    '',
    `Issue: ${issueRef}`,
    'Motivo: foi detectado PR aberto com conflito no mesmo repositório da issue/composição.',
    'Ação: a responsabilidade atual foi movida para `agent:devops` para que o conflito seja resolvido antes do fluxo continuar.',
  ].join('\n');
}

function buildDevopsReleaseComment(issueRef, returnedToDeveloper) {
  return [
    '### Fluxo devolvido de DevOps',
    '',
    `Issue: ${issueRef}`,
    'Motivo: não existe mais PR aberto com conflito no mesmo repositório da issue/composição.',
    returnedToDeveloper
      ? 'Ação: a responsabilidade foi devolvida para `agent:developer`, porque o próximo passo volta a ser republicar a trilha técnica ou a composição correta.'
      : 'Ação: o label `agent:devops` foi removido para evitar ownership operacional incorreto enquanto houver apenas assignee humano ativo.',
  ].join('\n');
}

function buildInReviewCleanupComment(issueRef) {
  return [
    '### Limpeza final de fluxo',
    '',
    `Issue: ${issueRef}`,
    'Ação: a task já está em `In Review`, então os labels `agent:*` e o assignee técnico do Copilot foram removidos para deixar o estado final coerente.',
  ].join('\n');
}

function serializeItem(item, knownAgentLogins) {
  const issue = item.content;
  const pullRequests = normalizePullRequests(issue);
  return {
    issue: {
      id: issue.id,
      ref: `${issue.repository.nameWithOwner}#${issue.number}`,
      title: issue.title,
      url: issue.url,
      state: issue.state,
      createdAt: issue.createdAt,
      updatedAt: issue.updatedAt,
    },
    projectItemId: item.id,
    currentProjectStatus: getStatusValue(item),
    labels: issueLabels(issue),
    currentAgentLabel: currentAgentLabel(issue),
    assignees: assigneeLogins(issue),
    hasAgentAssignee: hasAgentAssignee(issue, knownAgentLogins),
    hasHumanAssignee: hasHumanAssignee(issue, knownAgentLogins),
    hasHumanOnlyAssignee: hasHumanOnlyAssignee(issue, knownAgentLogins),
    openPullRequests: pullRequests
      .filter((pr) => pr?.state === 'OPEN')
      .map((pr) => ({
        ref: `${pr.repository.nameWithOwner}#${pr.number}`,
        url: pr.url,
        mergeable: pr.mergeable,
      })),
    conflictingPullRequests: pullRequests
      .filter((pr) => pr?.state === 'OPEN' && isConflictingOrBlockedMergeable(pr?.mergeable))
      .map((pr) => ({
        ref: `${pr.repository.nameWithOwner}#${pr.number}`,
        url: pr.url,
        mergeable: pr.mergeable,
      })),
    sameRepositoryOpenPullRequests: openPullRequestsInSameRepository(issue).map((pr) => ({
      ref: `${pr.repository.nameWithOwner}#${pr.number}`,
      url: pr.url,
      mergeable: pr.mergeable,
    })),
  };
}

function writeOutputFile(payload) {
  const outDir = env('FLOW_OUTPUT_DIR', '/tmp');
  const outPath = `${outDir}/agent-flow-sync.json`;
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2));
  return outPath;
}

async function main() {
  const org = env('FLOW_PROJECT_ORG', 'ControleOnline');
  const projectNumber = Number(env('FLOW_PROJECT_NUMBER', '1'));
  const dryRun = env('FLOW_DRY_RUN', 'true').toLowerCase() !== 'false';
  const workStatus = env('FLOW_WORK_STATUS', 'Work');
  const inReviewStatus = env('FLOW_IN_REVIEW_STATUS', 'In Review');
  const unsupportedLabel = env('FLOW_UNSUPPORTED_LABEL', DEFAULT_UNSUPPORTED_LABEL);
  const knownAgentLogins = new Set(
    parseCsv(env('FLOW_KNOWN_AGENT_LOGINS', DEFAULT_KNOWN_AGENT_LOGINS)).map((login) => login.toLowerCase())
  );

  const data = await getProjectSnapshot(org, projectNumber);
  const project = data?.organization?.projectV2;
  if (!project) throw new Error(`Project not found: ${org}/projects/${projectNumber}`);

  const items = project.items?.nodes || [];
  const result = {
    generatedAt: new Date().toISOString(),
    dryRun,
    project: {
      org,
      number: projectNumber,
      id: project.id,
      title: project.title,
    },
    workStatus,
    inReviewStatus,
    actions: [],
  };

  for (const item of items) {
    const issue = item.content;
    if (!issue?.repository?.nameWithOwner) continue;
    if (issue.state !== 'OPEN') continue;

    const issueRef = `${issue.repository.nameWithOwner}#${issue.number}`;
    const status = getStatusValue(item);
    const labels = issueLabels(issue);
    const blockedByUnsupportedCopilot = labels.includes(unsupportedLabel);
    const stageLabel = currentAgentLabel(issue);
    const agentAssigned = hasAgentAssignee(issue, knownAgentLogins);
    const humanOnlyAssigned = hasHumanOnlyAssignee(issue, knownAgentLogins);
    const record = serializeItem(item, knownAgentLogins);

    if (
      !blockedByUnsupportedCopilot &&
      status?.toLowerCase() === workStatus.toLowerCase() &&
      stageLabel === AGENT_LABELS.devops &&
      !hasConflictingPullRequestInSameRepository(issue)
    ) {
      const returnedToDeveloper = !humanOnlyAssigned;
      const nextLabels = returnedToDeveloper
        ? [...new Set([...labels.filter((label) => !ALL_AGENT_LABELS.includes(label)), AGENT_LABELS.developer])]
        : labels.filter((label) => !ALL_AGENT_LABELS.includes(label));
      const preservedHumanActorIds = retainedHumanActorIds(issue, knownAgentLogins);
      result.actions.push({
        type: 'release-devops-without-local-conflict',
        issue: record.issue,
        previewLabels: nextLabels,
        returnedToDeveloper,
        clearedAgentAssignee: agentAssigned,
        preservedHumanActorCount: preservedHumanActorIds.length,
      });
      if (!dryRun) {
        if (returnedToDeveloper) {
          await ensureLabelExists(issue.repository.nameWithOwner, AGENT_LABELS.developer);
        }
        await replaceIssueLabels(issue.repository.nameWithOwner, issue.number, nextLabels);
        if (agentAssigned) {
          await replaceAssignableActors(issue.id, preservedHumanActorIds);
        }
        await addIssueComment(issue.id, buildDevopsReleaseComment(issueRef, returnedToDeveloper));
      }
      continue;
    }

    if (
      !blockedByUnsupportedCopilot &&
      stageLabel === AGENT_LABELS.qa &&
      hasConflictingPullRequestInSameRepository(issue)
    ) {
      const nextLabels = [...new Set([...labels.filter((label) => !ALL_AGENT_LABELS.includes(label)), AGENT_LABELS.devops])];
      const preservedHumanActorIds = retainedHumanActorIds(issue, knownAgentLogins);
      result.actions.push({
        type: 'route-conflict-to-devops',
        issue: record.issue,
        previewLabels: nextLabels,
        clearedAgentAssignee: agentAssigned,
        preservedHumanActorCount: preservedHumanActorIds.length,
      });
      if (!dryRun) {
        await ensureLabelExists(issue.repository.nameWithOwner, AGENT_LABELS.devops);
        await replaceIssueLabels(issue.repository.nameWithOwner, issue.number, nextLabels);
        if (agentAssigned) {
          await replaceAssignableActors(issue.id, preservedHumanActorIds);
        }
        await addIssueComment(issue.id, buildConflictComment(issueRef));
      }
      continue;
    }

    if (
      !blockedByUnsupportedCopilot &&
      status?.toLowerCase() === workStatus.toLowerCase() &&
      !stageLabel &&
      agentAssigned
    ) {
      const preservedHumanActorIds = retainedHumanActorIds(issue, knownAgentLogins);
      result.actions.push({
        type: 'clear-orphan-agent-assignee',
        issue: record.issue,
        clearedAgentAssignee: true,
        preservedHumanActorCount: preservedHumanActorIds.length,
      });
      if (!dryRun) {
        await replaceAssignableActors(issue.id, preservedHumanActorIds);
        await addIssueComment(issue.id, buildOrphanAgentCleanupComment(issueRef));
      }
      continue;
    }

    if (
      !blockedByUnsupportedCopilot &&
      status?.toLowerCase() === workStatus.toLowerCase() &&
      !stageLabel &&
      !humanOnlyAssigned &&
      !agentAssigned &&
      hasOpenPullRequest(issue)
    ) {
      result.actions.push({
        type: 'hold-work-item-with-open-pr',
        issue: record.issue,
        openPullRequests: record.openPullRequests,
      });
      continue;
    }

    if (
      !blockedByUnsupportedCopilot &&
      status?.toLowerCase() === workStatus.toLowerCase() &&
      !stageLabel &&
      !humanOnlyAssigned &&
      !agentAssigned
    ) {
      const nextLabels = [...new Set([...labels, AGENT_LABELS.developer])];
      result.actions.push({
        type: 'seed-developer',
        issue: record.issue,
        previewLabels: nextLabels,
      });
      if (!dryRun) {
        await ensureLabelExists(issue.repository.nameWithOwner, AGENT_LABELS.developer);
        await replaceIssueLabels(issue.repository.nameWithOwner, issue.number, nextLabels);
        await addIssueComment(issue.id, buildDeveloperSeedComment(issueRef));
      }
      continue;
    }

    if (status?.toLowerCase() === inReviewStatus.toLowerCase() && (stageLabel || agentAssigned)) {
      const nextLabels = labels.filter((label) => !ALL_AGENT_LABELS.includes(label));
      const preservedHumanActorIds = retainedHumanActorIds(issue, knownAgentLogins);
      result.actions.push({
        type: 'cleanup-in-review',
        issue: record.issue,
        previewLabels: nextLabels,
        clearedAgentAssignee: agentAssigned,
        preservedHumanActorCount: preservedHumanActorIds.length,
      });
      if (!dryRun) {
        await replaceIssueLabels(issue.repository.nameWithOwner, issue.number, nextLabels);
        if (agentAssigned) {
          await replaceAssignableActors(issue.id, preservedHumanActorIds);
        }
        await addIssueComment(issue.id, buildInReviewCleanupComment(issueRef));
      }
    }
  }

  result.actionCount = result.actions.length;
  const outPath = writeOutputFile(result);
  console.log(JSON.stringify({ ok: true, dryRun, actionCount: result.actions.length, outPath }, null, 2));
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
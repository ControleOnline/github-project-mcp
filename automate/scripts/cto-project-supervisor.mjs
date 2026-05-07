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
const ALL_AGENT_LABELS = ['agent:developer', 'agent:security', 'agent:qa', 'agent:devops'];
const DEFAULT_KNOWN_AGENT_LOGINS = 'copilot-swe-agent,copilot';
const DEFAULT_UNSUPPORTED_LABEL = 'ops:copilot-unavailable';
const DEFAULT_PRIORITY_REPOSITORIES =
  'ControleOnline/app-community,ControleOnline/api-community,ControleOnline/api-whatsapp';
const DEFAULT_STALE_HOURS = '24';
const DEFAULT_STALE_DRAFT_HOURS = '24';
const RETRY = githubRetryConfig('CTO');

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

function parsePositiveNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : fallback;
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
            'User-Agent': 'controleonline-cto-supervisor',
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
    { label: 'GitHub GraphQL CTO supervisor', ...RETRY }
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
            'User-Agent': 'controleonline-cto-supervisor',
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
    { label: `GitHub REST CTO supervisor ${path}`, ...RETRY }
  );
}

async function getProjectSnapshot(org, projectNumber) {
  const query = `query($org:String!, $projectNumber:Int!, $cursor:String) {
    organization(login:$org) {
      projectV2(number:$projectNumber) {
        id
        title
        fields(first:50) {
          nodes {
            ... on ProjectV2FieldCommon { id name }
            ... on ProjectV2SingleSelectField { id name options { id name } }
          }
        }
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
                labels(first:30) {
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
                          reviewDecision
                          createdAt
                          updatedAt
                          mergedAt
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

function statusField(project) {
  const field = project.fields.nodes.find((node) => node?.name === 'Status' && node?.options);
  if (!field) throw new Error('Status field not found');
  return field;
}

function getStatusValue(item) {
  const value = item.fieldValues?.nodes?.find((node) => node?.field?.name?.toLowerCase() === 'status');
  return value?.name || null;
}

function issueLabels(issue) {
  return (issue.labels?.nodes || []).map((label) => label?.name).filter(Boolean);
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

function technicalAgentLogins(issue, knownAgentLogins) {
  return [...new Set(
    (issue.assignees?.nodes || [])
      .map((assignee) => (assignee?.login || '').trim().toLowerCase())
      .filter((login) => login && knownAgentLogins.has(login))
  )];
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

function isOpenPullRequest(pr) {
  return pr?.state === 'OPEN';
}

function mergeConflictForPr(pr) {
  return pr?.mergeable === false || pr?.mergeable === 'CONFLICTING';
}

function reviewPendingForPr(pr) {
  return isOpenPullRequest(pr) && !pr?.isDraft && pr?.reviewDecision !== 'APPROVED';
}

function openPullRequestsForSnapshot(snapshot) {
  return (snapshot?.pullRequests || []).filter((pr) => pr?.state === 'OPEN');
}

function projectStatusOptionId(project, statusName) {
  const field = statusField(project);
  const option = field.options.find((node) => node?.name?.toLowerCase() === statusName.toLowerCase());
  if (!option) throw new Error(`Status option not found: ${statusName}`);
  return { fieldId: field.id, optionId: option.id };
}

async function moveProjectItem(project, itemId, targetStatus) {
  const { fieldId, optionId } = projectStatusOptionId(project, targetStatus);
  await githubGraphQL(
    `mutation($projectId:ID!, $itemId:ID!, $fieldId:ID!, $optionId:String!) {
      updateProjectV2ItemFieldValue(input:{
        projectId:$projectId,
        itemId:$itemId,
        fieldId:$fieldId,
        value:{ singleSelectOptionId:$optionId }
      }) {
        projectV2Item { id }
      }
    }`,
    { projectId: project.id, itemId, fieldId, optionId }
  );
}

async function addIssueComment(issueId, body) {
  await githubGraphQL(
    `mutation($subjectId:ID!, $body:String!) {
      addComment(input:{subjectId:$subjectId, body:$body}) {
        commentEdge { node { id } }
      }
    }`,
    { subjectId: issueId, body }
  );
}

async function replaceAssignableActors(issueId, actorIds) {
  await githubGraphQL(
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

async function removeIssueAssignees(repoFullName, issueNumber, assignees) {
  if (!assignees.length) return;
  const [owner, repo] = repoFullName.split('/');
  await githubRest(`/repos/${owner}/${repo}/issues/${issueNumber}/assignees`, {
    method: 'DELETE',
    body: JSON.stringify({ assignees }),
  });
}

async function cleanupBlockedAgentAssignee(issue, knownAgentLogins) {
  const preservedHumanActorIds = retainedHumanActorIds(issue, knownAgentLogins);
  const technicalAssignees = technicalAgentLogins(issue, knownAgentLogins);
  const warnings = [];
  let graphQlCleared = false;
  let restCleared = false;

  try {
    await replaceAssignableActors(issue.id, preservedHumanActorIds);
    graphQlCleared = true;
  } catch (error) {
    warnings.push(`Falha GraphQL ao limpar actor técnico: ${error.message || error}`);
  }

  if (technicalAssignees.length > 0) {
    try {
      await removeIssueAssignees(issue.repository.nameWithOwner, issue.number, technicalAssignees);
      restCleared = true;
    } catch (error) {
      warnings.push(`Falha REST ao remover assignee técnico: ${error.message || error}`);
    }
  }

  return {
    technicalAssignees,
    graphQlCleared,
    restCleared,
    cleared: graphQlCleared || restCleared,
    warnings,
  };
}

function buildComment(issueRef, fromStatus, targetStatus, reasons) {
  return [
    '### Auditoria do CTO - correção estrutural de coluna',
    '',
    `Issue: ${issueRef}`,
    `Ação: a task foi movida de \`${fromStatus}\` para \`${targetStatus}\` pelo supervisor do CTO.`,
    'Motivo: o estado em `Done` era incompatível com o fluxo oficial observado no `cto-mcp`.',
    '',
    'Sinais objetivos:',
    ...reasons.map((reason) => `- ${reason}`),
    '',
    'Regra aplicada: durante `Developer`, `Security`, `Q.A.` e `DevOps` a task permanece em `Work`; somente `DevOps` move para `In Review`, e `Done` não deve ser usado enquanto ainda houver bloqueio, ownership operacional ativo ou PR aberto sem revisão concluída.',
  ].join('\n');
}

function ageHours(value) {
  const timestamp = Date.parse(value || '');
  if (!timestamp) return null;
  return Math.max(0, Math.floor((Date.now() - timestamp) / 3600000));
}

function serializeItem(item, knownAgentLogins, unsupportedLabel) {
  const issue = item.content;
  const labels = issueLabels(issue);
  const assignees = assigneeLogins(issue);
  const technicalAssignees = technicalAgentLogins(issue, knownAgentLogins);
  const humanAssignees = assignees.filter((login) => !knownAgentLogins.has(login));
  const pullRequests = normalizePullRequests(issue);
  return {
    issue: {
      id: issue.id,
      repository: issue.repository.nameWithOwner,
      ref: `${issue.repository.nameWithOwner}#${issue.number}`,
      title: issue.title,
      url: issue.url,
      state: issue.state,
      createdAt: issue.createdAt,
      updatedAt: issue.updatedAt,
      ageHours: ageHours(issue.updatedAt),
    },
    projectItemId: item.id,
    currentProjectStatus: getStatusValue(item),
    labels,
    assignees,
    humanAssignees,
    technicalAgentAssignees: technicalAssignees,
    hasAgentLabel: labels.some((label) => ALL_AGENT_LABELS.includes(label)),
    hasUnsupportedLabel: labels.includes(unsupportedLabel),
    hasKnownAgentAssignee: technicalAssignees.length > 0,
    pullRequests: pullRequests.map((pr) => ({
      ref: `${pr.repository?.nameWithOwner || 'unknown'}#${pr.number}`,
      repository: pr.repository?.nameWithOwner || 'unknown',
      title: pr.title,
      url: pr.url,
      state: pr.state,
      isDraft: Boolean(pr.isDraft),
      mergeable: pr.mergeable,
      reviewDecision: pr.reviewDecision,
      createdAt: pr.createdAt,
      updatedAt: pr.updatedAt,
      ageHours: ageHours(pr.updatedAt),
      mergedAt: pr.mergedAt,
    })),
  };
}

function classifyDoneMismatch(item, knownAgentLogins, unsupportedLabel, workStatus, inReviewStatus, doneStatus) {
  const issue = item.content;
  const currentStatus = getStatusValue(item);
  if (!issue?.repository?.nameWithOwner) return null;
  if (issue.state !== 'OPEN') return null;
  if ((currentStatus || '').toLowerCase() !== doneStatus.toLowerCase()) return null;

  const labels = issueLabels(issue);
  const assignees = assigneeLogins(issue);
  const pullRequests = normalizePullRequests(issue);
  const reasons = [];
  let targetStatus = null;

  if (labels.includes(unsupportedLabel)) {
    reasons.push(`a issue ainda está marcada com \`${unsupportedLabel}\`, sinalizando bloqueio operacional aberto`);
    targetStatus = workStatus;
  }

  const agentLabels = labels.filter((label) => ALL_AGENT_LABELS.includes(label));
  if (agentLabels.length > 0) {
    reasons.push(`a issue ainda carrega label operacional ativo (${agentLabels.join(', ')})`);
    targetStatus = workStatus;
  }

  const agentAssignees = assignees.filter((login) => knownAgentLogins.has(login));
  if (agentAssignees.length > 0) {
    reasons.push(`a issue ainda está atribuída ao agent técnico (${agentAssignees.join(', ')})`);
    targetStatus = workStatus;
  }

  const openPrs = pullRequests.filter((pr) => isOpenPullRequest(pr));
  if (openPrs.length > 0) {
    const refs = openPrs.map((pr) => `${pr.repository?.nameWithOwner || 'unknown'}#${pr.number}`).join(', ');
    reasons.push(`a issue ainda tem PR aberto vinculado (${refs})`);
    if (!targetStatus) targetStatus = inReviewStatus;
  }

  if (!targetStatus || reasons.length === 0) return null;

  return {
    issueRef: `${issue.repository.nameWithOwner}#${issue.number}`,
    issueId: issue.id,
    itemId: item.id,
    fromStatus: currentStatus,
    targetStatus,
    reasons,
    snapshot: serializeItem(item, knownAgentLogins, unsupportedLabel),
  };
}

function classifyUnsupportedCopilot(item, knownAgentLogins, unsupportedLabel) {
  const issue = item.content;
  if (!issue?.repository?.nameWithOwner) return null;
  if (issue.state !== 'OPEN') return null;
  const labels = issueLabels(issue);
  if (!labels.includes(unsupportedLabel)) return null;
  return serializeItem(item, knownAgentLogins, unsupportedLabel);
}

function summarizeUnsupportedCopilot(blockedIssues) {
  const byRepository = new Map();
  for (const blocked of blockedIssues) {
    const repository = blocked.issue.repository;
    if (!byRepository.has(repository)) {
      byRepository.set(repository, {
        repository,
        issueCount: 0,
        projectStatuses: new Set(),
        issueRefs: [],
        oldestUpdatedAt: null,
        newestUpdatedAt: null,
        openPullRequestCount: 0,
        residualTechnicalAssigneeCount: 0,
      });
    }
    const bucket = byRepository.get(repository);
    bucket.issueCount += 1;
    if (blocked.currentProjectStatus) bucket.projectStatuses.add(blocked.currentProjectStatus);
    bucket.issueRefs.push(blocked.issue.ref);
    if (!bucket.oldestUpdatedAt || Date.parse(blocked.issue.updatedAt) < Date.parse(bucket.oldestUpdatedAt)) {
      bucket.oldestUpdatedAt = blocked.issue.updatedAt;
    }
    if (!bucket.newestUpdatedAt || Date.parse(blocked.issue.updatedAt) > Date.parse(bucket.newestUpdatedAt)) {
      bucket.newestUpdatedAt = blocked.issue.updatedAt;
    }
    bucket.openPullRequestCount += openPullRequestsForSnapshot(blocked).length;
    bucket.residualTechnicalAssigneeCount += blocked.technicalAgentAssignees.length > 0 ? 1 : 0;
  }

  return Array.from(byRepository.values())
    .map((bucket) => ({
      repository: bucket.repository,
      issueCount: bucket.issueCount,
      projectStatuses: Array.from(bucket.projectStatuses).sort(),
      issueRefs: bucket.issueRefs.sort(),
      oldestUpdatedAt: bucket.oldestUpdatedAt,
      oldestAgeHours: ageHours(bucket.oldestUpdatedAt),
      newestUpdatedAt: bucket.newestUpdatedAt,
      newestAgeHours: ageHours(bucket.newestUpdatedAt),
      openPullRequestCount: bucket.openPullRequestCount,
      residualTechnicalAssigneeCount: bucket.residualTechnicalAssigneeCount,
    }))
    .sort((a, b) => a.repository.localeCompare(b.repository));
}

function normalizePriorityRepositories(org, repositories) {
  return repositories.map((repository) => (repository.includes('/') ? repository : `${org}/${repository}`));
}

function summarizePriorityRepositories(priorityRepositories, blockedIssues, staleHours, staleDraftHours) {
  return priorityRepositories.map((repository) => {
    const repositoryIssues = blockedIssues.filter((entry) => entry.issue.repository === repository);
    const openPullRequests = repositoryIssues.flatMap((entry) => openPullRequestsForSnapshot(entry));
    const draftPullRequests = openPullRequests.filter((pr) => pr.isDraft);
    const staleDraftPullRequests = draftPullRequests.filter(
      (pr) => pr.ageHours !== null && pr.ageHours >= staleDraftHours
    );
    const conflictingPullRequests = openPullRequests.filter((pr) => mergeConflictForPr(pr));
    const reviewPendingPullRequests = openPullRequests.filter((pr) => reviewPendingForPr(pr));
    const projectStatuses = [...new Set(repositoryIssues.map((entry) => entry.currentProjectStatus).filter(Boolean))].sort();
    const oldestUpdatedAt = repositoryIssues
      .map((entry) => entry.issue.updatedAt)
      .filter(Boolean)
      .sort((a, b) => Date.parse(a) - Date.parse(b))[0] || null;
    const newestUpdatedAt = repositoryIssues
      .map((entry) => entry.issue.updatedAt)
      .filter(Boolean)
      .sort((a, b) => Date.parse(b) - Date.parse(a))[0] || null;

    return {
      repository,
      state: repositoryIssues.length > 0 ? 'blocked' : 'clear',
      issueCount: repositoryIssues.length,
      stale: Boolean(oldestUpdatedAt && ageHours(oldestUpdatedAt) !== null && ageHours(oldestUpdatedAt) >= staleHours),
      oldestAgeHours: oldestUpdatedAt ? ageHours(oldestUpdatedAt) : null,
      newestAgeHours: newestUpdatedAt ? ageHours(newestUpdatedAt) : null,
      openPullRequestCount: openPullRequests.length,
      draftPullRequestCount: draftPullRequests.length,
      staleDraftPullRequestCount: staleDraftPullRequests.length,
      conflictingPullRequestCount: conflictingPullRequests.length,
      reviewPendingPullRequestCount: reviewPendingPullRequests.length,
      residualTechnicalAssigneeCount: repositoryIssues.filter((entry) => entry.technicalAgentAssignees.length > 0).length,
      projectStatuses,
      issueRefs: repositoryIssues.map((entry) => entry.issue.ref).sort(),
      openPullRequestRefs: openPullRequests.map((pr) => pr.ref).sort(),
      staleDraftPullRequestRefs: staleDraftPullRequests.map((pr) => pr.ref).sort(),
      conflictingPullRequestRefs: conflictingPullRequests.map((pr) => pr.ref).sort(),
      reviewPendingPullRequestRefs: reviewPendingPullRequests.map((pr) => pr.ref).sort(),
    };
  });
}

function buildPriorityPullRequestAttention(priorityRepositoryHealth) {
  return priorityRepositoryHealth
    .filter(
      (entry) =>
        entry.state === 'blocked' &&
        (
          entry.staleDraftPullRequestCount > 0 ||
          entry.conflictingPullRequestCount > 0 ||
          entry.reviewPendingPullRequestCount > 0
        )
    )
    .map((entry) => ({
      repository: entry.repository,
      issueRefs: entry.issueRefs,
      staleDraftPullRequestRefs: entry.staleDraftPullRequestRefs,
      conflictingPullRequestRefs: entry.conflictingPullRequestRefs,
      reviewPendingPullRequestRefs: entry.reviewPendingPullRequestRefs,
    }));
}

function writeOutputFile(payload) {
  const outDir = env('CTO_OUTPUT_DIR', '/tmp');
  const outPath = `${outDir}/cto-project-supervisor.json`;
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2));
  return outPath;
}

async function main() {
  const org = env('CTO_PROJECT_ORG', 'ControleOnline');
  const projectNumber = Number(env('CTO_PROJECT_NUMBER', '1'));
  const dryRun = env('CTO_DRY_RUN', 'true').toLowerCase() !== 'false';
  const workStatus = env('CTO_WORK_STATUS', 'Work');
  const inReviewStatus = env('CTO_IN_REVIEW_STATUS', 'In Review');
  const doneStatus = env('CTO_DONE_STATUS', 'Done');
  const unsupportedLabel = env('CTO_UNSUPPORTED_LABEL', DEFAULT_UNSUPPORTED_LABEL);
  const staleHours = parsePositiveNumber(env('CTO_BLOCKED_STALE_HOURS', DEFAULT_STALE_HOURS), 24);
  const staleDraftHours = parsePositiveNumber(
    env('CTO_PRIORITY_PR_STALE_HOURS', DEFAULT_STALE_DRAFT_HOURS),
    24
  );
  const priorityRepositories = normalizePriorityRepositories(
    org,
    parseCsv(env('CTO_PRIORITY_REPOSITORIES', DEFAULT_PRIORITY_REPOSITORIES))
  );
  const knownAgentLogins = new Set(
    parseCsv(env('CTO_KNOWN_AGENT_LOGINS', DEFAULT_KNOWN_AGENT_LOGINS)).map((login) => login.toLowerCase())
  );

  const data = await getProjectSnapshot(org, projectNumber);
  const project = data?.organization?.projectV2;
  if (!project) throw new Error(`Project not found: ${org}/projects/${projectNumber}`);

  const items = project.items?.nodes || [];
  const actions = [];
  const unsupportedCopilotIssues = [];

  for (const item of items) {
    const blocked = classifyUnsupportedCopilot(item, knownAgentLogins, unsupportedLabel);
    if (blocked) {
      unsupportedCopilotIssues.push(blocked);
      if (blocked.hasKnownAgentAssignee) {
        const action = {
          type: 'cleanup-blocked-agent-assignee',
          issue: blocked.issue,
          currentProjectStatus: blocked.currentProjectStatus,
          technicalAgentAssignees: blocked.technicalAgentAssignees,
        };
        actions.push(action);
        if (!dryRun) {
          const cleanup = await cleanupBlockedAgentAssignee(item.content, knownAgentLogins);
          action.cleanupClearedAgentAssignee = cleanup.cleared;
          action.graphQlCleared = cleanup.graphQlCleared;
          action.restCleared = cleanup.restCleared;
          if (cleanup.warnings.length > 0) {
            action.cleanupWarnings = cleanup.warnings;
          }
        }
      }
    }

    const mismatch = classifyDoneMismatch(
      item,
      knownAgentLogins,
      unsupportedLabel,
      workStatus,
      inReviewStatus,
      doneStatus
    );
    if (!mismatch) continue;

    actions.push({
      type: 'revert-invalid-done',
      issue: mismatch.snapshot.issue,
      fromStatus: mismatch.fromStatus,
      targetStatus: mismatch.targetStatus,
      reasons: mismatch.reasons,
    });

    if (!dryRun) {
      await moveProjectItem(project, mismatch.itemId, mismatch.targetStatus);
      await addIssueComment(
        mismatch.issueId,
        buildComment(mismatch.issueRef, mismatch.fromStatus, mismatch.targetStatus, mismatch.reasons)
      );
    }
  }

  const unsupportedCopilotByRepository = summarizeUnsupportedCopilot(unsupportedCopilotIssues);
  const priorityRepositoryHealth = summarizePriorityRepositories(
    priorityRepositories,
    unsupportedCopilotIssues,
    staleHours,
    staleDraftHours
  );
  const priorityPullRequestAttention = buildPriorityPullRequestAttention(priorityRepositoryHealth);

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
    doneStatus,
    staleDraftHours,
    unsupportedCopilotIssueCount: unsupportedCopilotIssues.length,
    unsupportedCopilotByRepository,
    unsupportedCopilotIssues,
    priorityRepositories,
    blockedPriorityRepositoryCount: priorityRepositoryHealth.filter((entry) => entry.state === 'blocked').length,
    staleBlockedPriorityRepositoryCount: priorityRepositoryHealth.filter((entry) => entry.stale).length,
    priorityPullRequestAttentionCount: priorityPullRequestAttention.length,
    priorityPullRequestAttention,
    priorityRepositoryHealth,
    actionCount: actions.length,
    actions,
  };

  const outPath = writeOutputFile(result);
  console.log(
    JSON.stringify(
      {
        ok: true,
        dryRun,
        unsupportedCopilotIssueCount: unsupportedCopilotIssues.length,
        blockedPriorityRepositoryCount: result.blockedPriorityRepositoryCount,
        staleBlockedPriorityRepositoryCount: result.staleBlockedPriorityRepositoryCount,
        priorityPullRequestAttentionCount: result.priorityPullRequestAttentionCount,
        actionCount: actions.length,
        outPath,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
import fs from 'node:fs';
import {
  githubRetryConfig,
  isRetriableGraphQLErrors,
  isRetriableStatus,
  retryAsync,
  retryableError,
} from '../../src/retry.js';

const GITHUB_API_URL = 'https://api.github.com/graphql';
const ALL_AGENT_LABELS = ['agent:developer', 'agent:security', 'agent:qa', 'agent:devops'];
const DEFAULT_KNOWN_AGENT_LOGINS = 'copilot-swe-agent,copilot';
const DEFAULT_UNSUPPORTED_LABEL = 'ops:copilot-unavailable';
const DEFAULT_PRIORITY_REPOSITORIES =
  'ControleOnline/app-community,ControleOnline/api-community,ControleOnline/api-whatsapp';
const DEFAULT_STALE_HOURS = '24';
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

async function getProjectSnapshot(org, projectNumber) {
  return githubGraphQL(
    `query($org:String!, $projectNumber:Int!) {
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
          items(first:100) {
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
    }`,
    { org, projectNumber }
  );
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
    assignees: assigneeLogins(issue),
    hasAgentLabel: labels.some((label) => ALL_AGENT_LABELS.includes(label)),
    hasUnsupportedLabel: labels.includes(unsupportedLabel),
    hasKnownAgentAssignee: assigneeLogins(issue).some((login) => knownAgentLogins.has(login)),
    pullRequests: pullRequests.map((pr) => ({
      ref: `${pr.repository?.nameWithOwner || 'unknown'}#${pr.number}`,
      repository: pr.repository?.nameWithOwner || 'unknown',
      url: pr.url,
      state: pr.state,
      isDraft: Boolean(pr.isDraft),
      mergeable: pr.mergeable,
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
    bucket.openPullRequestCount += blocked.pullRequests.filter((pr) => pr.state === 'OPEN').length;
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
    }))
    .sort((a, b) => a.repository.localeCompare(b.repository));
}

function normalizePriorityRepositories(org, repositories) {
  return repositories.map((repository) => (repository.includes('/') ? repository : `${org}/${repository}`));
}

function summarizePriorityRepositories(priorityRepositories, unsupportedSummary, staleHours) {
  const blockedMap = new Map(unsupportedSummary.map((entry) => [entry.repository, entry]));
  return priorityRepositories.map((repository) => {
    const blocked = blockedMap.get(repository);
    return {
      repository,
      state: blocked ? 'blocked' : 'clear',
      issueCount: blocked?.issueCount || 0,
      stale: Boolean(blocked && blocked.oldestAgeHours !== null && blocked.oldestAgeHours >= staleHours),
      oldestAgeHours: blocked?.oldestAgeHours ?? null,
      newestAgeHours: blocked?.newestAgeHours ?? null,
      openPullRequestCount: blocked?.openPullRequestCount || 0,
      projectStatuses: blocked?.projectStatuses || [],
      issueRefs: blocked?.issueRefs || [],
    };
  });
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
    if (blocked) unsupportedCopilotIssues.push(blocked);

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
    unsupportedCopilotByRepository,
    staleHours
  );

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
    unsupportedCopilotIssueCount: unsupportedCopilotIssues.length,
    unsupportedCopilotByRepository,
    unsupportedCopilotIssues,
    priorityRepositories,
    blockedPriorityRepositoryCount: priorityRepositoryHealth.filter((entry) => entry.state === 'blocked').length,
    staleBlockedPriorityRepositoryCount: priorityRepositoryHealth.filter((entry) => entry.stale).length,
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
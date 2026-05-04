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

const ROLE_META = {
  developer: {
    displayName: 'Developer',
    label: 'agent:developer',
    selection: 'work',
    commentHeader: 'Developer iniciado',
    nextInstruction:
      'Ao concluir, deixe comentário final objetivo, troque o label para `agent:security`, remova o assignee `Copilot` e preserve assignees humanos existentes.',
  },
  security: {
    displayName: 'Security',
    label: 'agent:security',
    selection: 'label',
    commentHeader: 'Security iniciado',
    nextInstruction:
      'Ao concluir, deixe comentário final objetivo, troque o label para `agent:qa` ou `agent:developer`, remova o assignee `Copilot` e preserve assignees humanos existentes.',
  },
  qa: {
    displayName: 'Quality Assurance',
    label: 'agent:qa',
    selection: 'label',
    commentHeader: 'Quality Assurance iniciado',
    nextInstruction:
      'Ao concluir, deixe comentário final objetivo, troque o label para `agent:devops`, `agent:security` ou `agent:developer`, remova o assignee `Copilot` e preserve assignees humanos existentes.',
  },
  devops: {
    displayName: 'DevOps',
    label: 'agent:devops',
    selection: 'label',
    commentHeader: 'DevOps iniciado',
    nextInstruction:
      'Ao concluir, deixe comentário final objetivo, mova a task para `In Review`, remova labels `agent:*`, remova o assignee `Copilot` e preserve assignees humanos existentes.',
  },
};

const ALL_AGENT_LABELS = Object.values(ROLE_META).map((entry) => entry.label);
const DEFAULT_AGENT_LOGIN = 'copilot-swe-agent';
const DEFAULT_KNOWN_AGENT_LOGINS = 'copilot-swe-agent,copilot';
const RETRY = githubRetryConfig('AGENT');
const LABEL_META = {
  'agent:developer': { color: '1f6feb', description: 'Task atualmente com o agent Developer' },
  'agent:security': { color: 'd1242f', description: 'Task atualmente com o agent Security' },
  'agent:qa': { color: '8b5cf6', description: 'Task atualmente com o agent QA' },
  'agent:devops': { color: 'fb8c00', description: 'Task atualmente com o agent DevOps' },
};

function env(name, fallback = '') {
  return (process.env[name] || fallback).trim();
}

function parseCsv(value) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function getRole() {
  const role = env('AGENT_DISPATCH_ROLE');
  if (!ROLE_META[role]) {
    throw new Error(`Unsupported AGENT_DISPATCH_ROLE: ${role}`);
  }
  return role;
}

function getToken() {
  return env('GITHUB_TOKEN') || env('GH_TOKEN');
}

async function githubGraphQL(query, variables = {}, extraHeaders = {}) {
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
            'User-Agent': 'controleonline-agent-dispatch',
            ...extraHeaders,
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
    { label: 'GitHub GraphQL dispatch', ...RETRY }
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
            'User-Agent': 'controleonline-agent-dispatch',
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
    { label: `GitHub REST dispatch ${path}`, ...RETRY }
  );
}

async function getProjectSnapshot(org, projectNumber) {
  return githubGraphQL(
    `query($org:String!, $projectNumber:Int!) {
      organization(login:$org) {
        projectV2(number:$projectNumber) {
          id
          title
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
                  labels(first:20) {
                    nodes {
                      name
                    }
                  }
                  assignees(first:20) {
                    nodes {
                      login
                    }
                  }
                  repository {
                    id
                    nameWithOwner
                    suggestedActors(capabilities:[CAN_BE_ASSIGNED], first:20) {
                      nodes {
                        __typename
                        login
                        ... on Bot {
                          id
                        }
                        ... on User {
                          id
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

function hasAgentAssignee(issue, knownAgentLogins) {
  return assigneeLogins(issue).some((login) => knownAgentLogins.has(login));
}

function hasHumanAssignee(issue, knownAgentLogins) {
  return assigneeLogins(issue).some((login) => !knownAgentLogins.has(login));
}

function hasHumanOnlyAssignee(issue, knownAgentLogins) {
  return hasHumanAssignee(issue, knownAgentLogins) && !hasAgentAssignee(issue, knownAgentLogins);
}

function getAssignableActor(issue, preferredAgentLogin) {
  return (issue.repository?.suggestedActors?.nodes || []).find(
    (actor) => actor?.login?.toLowerCase() === preferredAgentLogin
  );
}

function sortByCreatedAt(items) {
  return [...items].sort((left, right) => {
    const leftTs = Date.parse(left.content?.createdAt || '') || 0;
    const rightTs = Date.parse(right.content?.createdAt || '') || 0;
    return leftTs - rightTs;
  });
}

function isEligibleForRole(item, role, workStatus, knownAgentLogins) {
  const issue = item.content;
  if (!issue?.repository?.nameWithOwner) return false;
  if (issue.state !== 'OPEN') return false;
  if (hasHumanOnlyAssignee(issue, knownAgentLogins)) return false;
  if (hasAgentAssignee(issue, knownAgentLogins)) return false;

  const stageLabel = currentAgentLabel(issue);
  const roleLabel = ROLE_META[role].label;

  if (role === 'developer') {
    const status = getStatusValue(item);
    if (status?.toLowerCase() !== workStatus.toLowerCase()) return false;
    return !stageLabel || stageLabel === roleLabel;
  }

  return stageLabel === roleLabel;
}

function isActiveForRole(item, role, knownAgentLogins) {
  const issue = item.content;
  if (!issue?.repository?.nameWithOwner) return false;
  if (issue.state !== 'OPEN') return false;
  if (!hasAgentAssignee(issue, knownAgentLogins)) return false;
  return currentAgentLabel(issue) === ROLE_META[role].label;
}

function buildAgentInstructions(role, issueRef, issueNumber) {
  const meta = ROLE_META[role];
  const agentFile = `.github/agents/${role}.agent.md`;

  return [
    `Atue como o agent ${meta.displayName} da ControleOnline para a issue ${issueRef}.`,
    `Antes de agir, leia e siga \`${agentFile}\` no repositório alvo.`,
    'Leia também o `AGENTS.md` mais específico do código afetado.',
    `Trabalhe a partir do branch \`task-${issueNumber}\` derivado de \`master\` quando a tarefa exigir mudanças.`,
    'Use GitHub como fonte de verdade para issue, PR, comentários, branch, labels e evidências.',
    meta.nextInstruction,
  ].join(' ');
}

function buildAssignmentComment(role, issueRef) {
  const meta = ROLE_META[role];
  const origin =
    role === 'developer'
      ? 'Origem: fila `Work` do ProjectV2'
      : `Origem: label \`${meta.label}\``;

  return [
    `### ${meta.commentHeader}`,
    '',
    `Issue: ${issueRef}`,
    origin,
    'Critério: task elegível, sem ownership exclusivamente humano e sem outra execução ativa do mesmo agent.',
    `Ação: o runner atribuiu o agent \`${meta.displayName}\` para iniciar a execução.`,
  ].join('\n');
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

async function assignIssueToAgent(issueId, actorId, repositoryId, baseRef, customInstructions, model) {
  return githubGraphQL(
    `mutation(
      $issueId:ID!,
      $actorId:ID!,
      $repositoryId:ID!,
      $baseRef:String!,
      $customInstructions:String!,
      $model:String
    ) {
      replaceActorsForAssignable(input: {
        assignableId: $issueId,
        actorIds: [$actorId],
        agentAssignment: {
          targetRepositoryId: $repositoryId,
          baseRef: $baseRef,
          customInstructions: $customInstructions,
          model: $model
        }
      }) {
        assignable {
          ... on Issue {
            id
          }
        }
      }
    }`,
    { issueId, actorId, repositoryId, baseRef, customInstructions, model: model || null },
    {
      'GraphQL-Features': 'issues_copilot_assignment_api_support,coding_agent_model_selection',
    }
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

function serializeItem(item, knownAgentLogins, preferredAgentLogin) {
  const issue = item.content;
  const actor = getAssignableActor(issue, preferredAgentLogin);
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
    canAssignPreferredAgent: Boolean(actor?.id),
  };
}

function writeOutputFile(payload) {
  const outDir = env('AGENT_OUTPUT_DIR', '/tmp');
  const outPath = `${outDir}/agent-project-dispatch-${payload.role}.json`;
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2));
  return outPath;
}

async function main() {
  const role = getRole();
  const meta = ROLE_META[role];
  const org = env('AGENT_PROJECT_ORG', 'ControleOnline');
  const projectNumber = Number(env('AGENT_PROJECT_NUMBER', '1'));
  const dryRun = env('AGENT_DRY_RUN', 'true').toLowerCase() !== 'false';
  const workStatus = env('AGENT_WORK_STATUS', 'Work');
  const preferredAgentLogin = env('AGENT_LOGIN', DEFAULT_AGENT_LOGIN).toLowerCase();
  const knownAgentLogins = new Set(
    parseCsv(env('AGENT_KNOWN_LOGINS', DEFAULT_KNOWN_AGENT_LOGINS)).map((login) => login.toLowerCase())
  );
  const baseRef = env('AGENT_COPILOT_BASE_REF', 'master');
  const model = env('AGENT_COPILOT_MODEL');

  const data = await getProjectSnapshot(org, projectNumber);
  const project = data?.organization?.projectV2;
  if (!project) throw new Error(`Project not found: ${org}/projects/${projectNumber}`);

  const items = sortByCreatedAt(project.items?.nodes || []);
  const activeItems = items.filter((item) => isActiveForRole(item, role, knownAgentLogins));
  const candidateItems = items.filter((item) => isEligibleForRole(item, role, workStatus, knownAgentLogins));

  const result = {
    generatedAt: new Date().toISOString(),
    role,
    dryRun,
    project: {
      org,
      number: projectNumber,
      id: project.id,
      title: project.title,
    },
    workStatus,
    roleLabel: meta.label,
    activeCount: activeItems.length,
    candidateCount: candidateItems.length,
    activeItems: activeItems.map((item) => serializeItem(item, knownAgentLogins, preferredAgentLogin)),
    candidateItems: candidateItems.map((item) => serializeItem(item, knownAgentLogins, preferredAgentLogin)),
    assignmentAttempts: [],
  };

  if (activeItems.length > 0) {
    result.ok = true;
    result.skipped = true;
    result.reason = `Já existe task em execução pelo agent ${meta.displayName}.`;
    const outPath = writeOutputFile(result);
    console.log(JSON.stringify({ ok: true, skipped: true, reason: result.reason, outPath }, null, 2));
    return;
  }

  if (candidateItems.length === 0) {
    result.ok = true;
    result.skipped = true;
    result.reason = `Nenhuma task elegível foi encontrada para ${meta.displayName}.`;
    const outPath = writeOutputFile(result);
    console.log(JSON.stringify({ ok: true, skipped: true, reason: result.reason, outPath }, null, 2));
    return;
  }

  for (const target of candidateItems) {
    const issue = target.content;
    const issueRef = `${issue.repository.nameWithOwner}#${issue.number}`;
    const actor = getAssignableActor(issue, preferredAgentLogin);
    const targetRecord = serializeItem(target, knownAgentLogins, preferredAgentLogin);

    if (!actor?.id) {
      result.assignmentAttempts.push({
        issue: targetRecord.issue,
        status: 'skipped',
        reason: `O agent ${preferredAgentLogin} não apareceu em suggestedActors para ${issue.repository.nameWithOwner}.`,
      });
      continue;
    }

    const currentLabels = issueLabels(issue);
    const nextLabels = [...new Set([...currentLabels.filter((label) => !ALL_AGENT_LABELS.includes(label)), meta.label])];

    result.selectedItem = targetRecord;

    if (!dryRun) {
      await ensureLabelExists(issue.repository.nameWithOwner, meta.label);
      await replaceIssueLabels(issue.repository.nameWithOwner, issue.number, nextLabels);
      await assignIssueToAgent(
        issue.id,
        actor.id,
        issue.repository.id,
        baseRef,
        buildAgentInstructions(role, issueRef, issue.number),
        model
      );
      await addIssueComment(issue.id, buildAssignmentComment(role, issueRef));
      result.executed = true;
    } else {
      result.executed = false;
      result.previewComment = buildAssignmentComment(role, issueRef);
      result.previewInstructions = buildAgentInstructions(role, issueRef, issue.number);
      result.previewLabels = nextLabels;
    }

    result.ok = true;
    result.assignedIssue = issueRef;
    result.assignedAgent = preferredAgentLogin;
    result.baseRef = baseRef;
    result.assignmentAttempts.push({
      issue: targetRecord.issue,
      status: dryRun ? 'preview' : 'assigned',
      reason: 'Primeira task elegível e atribuível encontrada.',
    });

    const outPath = writeOutputFile(result);
    console.log(
      JSON.stringify(
        {
          ok: true,
          dryRun,
          role,
          assignedIssue: issueRef,
          assignedAgent: preferredAgentLogin,
          outPath,
        },
        null,
        2
      )
    );
    return;
  }

  result.ok = false;
  result.skipped = true;
  result.reason = `Nenhuma task elegível pôde ser atribuída ao agent ${meta.displayName}.`;
  const outPath = writeOutputFile(result);
  console.log(JSON.stringify({ ok: false, skipped: true, reason: result.reason, outPath }, null, 2));
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
